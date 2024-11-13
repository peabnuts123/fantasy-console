import { makeAutoObservable, runInAction } from 'mobx';
import { invoke } from '@tauri-apps/api/core'
import { v4 as uuid } from 'uuid';

import { AssetType, CartridgeArchiveManifest } from '@fantasy-console/runtime/src/cartridge';

import { ProjectController } from '@lib/project/ProjectController';
import { SceneManifest } from '@lib/project/definition';
import { SceneViewController } from './scene/SceneViewController';

export interface CreateCartridgeCmdArgs {
  manifestFileBytes: string;
  projectRootPath: string;
  assetPaths: string[];
  scriptPaths: string[];
}

export interface TabData {
  id: string;
  label: string;
  sceneViewController?: SceneViewController;
}


export class ComposerController {
  private _tabData: TabData[] = [];
  private _stopWatchingFs?: Function = undefined;

  private readonly projectController: ProjectController;

  public constructor(projectController: ProjectController) {
    // @NOTE Class properties MUST have a value explicitly assigned
    // by this point otherwise mobx won't pick them up.
    makeAutoObservable(this);

    this.projectController = projectController; // @NOTE explicitly not observed by mobx

    // Open 1 blank tab
    this.openNewTab();
  }

  public async onEnter(): Promise<void> {
    // @TODO bring this back (when we've made project load at the top level)
    // Start watching project for file changes on disk
    // console.log(`[Composer] (loadProject) Watching '${this.projectController.currentProjectRoot}' for changes...`);
    // this._stopWatchingFs = await watchImmediate(this.projectController.currentProjectRoot, (event) => {
    //   console.log(`FSEvent: `, event);
    // }, {
    //   recursive: true,
    // });
  }

  public onExit() {
    if (this._stopWatchingFs) {
      this._stopWatchingFs();
      this._stopWatchingFs = undefined;
    }
  }

  public async loadSceneForTab(tabId: string, sceneManifest: SceneManifest) {
    for (const tab of this.currentlyOpenTabs) {
      if (tab.id === tabId) {
        const sceneViewController = await SceneViewController.loadFromManifest(sceneManifest, this.projectController);
        runInAction(() => {
          tab.label = sceneViewController.scene.path;
          tab.sceneViewController = sceneViewController;
        });
        return;
      }
    }

    throw new Error(`Could not load scene for tab - no tab exists with ID '${tabId}'`);
  }

  public openNewTab() {
    const newTabData: TabData = {
      id: uuid(),
      label: "No scene loaded",
    };

    runInAction(() => {
      this.currentlyOpenTabs.push(newTabData);
    });

    return newTabData;
  }

  public closeTab(tabId: string) {
    const tabIndex = this.currentlyOpenTabs.findIndex((tab) => tab.id === tabId);
    if (tabIndex === -1) {
      throw new Error(`Could not load scene for tab - no tab exists with ID '${tabId}'`);
    }

    // Unload scene
    this.currentlyOpenTabs[tabIndex].sceneViewController?.destroy();

    runInAction(() => {
      this.currentlyOpenTabs.splice(tabIndex, 1);
    });
  }

  public get currentlyOpenTabs(): TabData[] {
    return this._tabData;
  }

  public async debug_buildCartridge(): Promise<Uint8Array> {
    /*
      @TODO
      Is there a way we can do this from Rust, so that we
      could do this from a CLI?
    */

    // Load scene definitions
    const scenes = await Promise.all(
      this.projectController.currentProject.scenes.map(async (sceneManifest) => {
        // Load any scenes currently open from memory
        // @TODO is this just a Chrome @DEBUG thing?
        const openTab = this.currentlyOpenTabs.find((tab) => tab.sceneViewController?.scene.path === sceneManifest.path);
        if (openTab !== undefined) {
          // Load current scene from memory
          return openTab.sceneViewController!.sceneDefinition;
        } else {
          // @TODO can this be a method on ProjectController instead?
          const [sceneDefinition] = await SceneViewController.loadSceneDefinition(sceneManifest, this.projectController.fileSystem);
          return sceneDefinition;
        }
      })
    );

    // Build cartridge manifest
    const manifest: CartridgeArchiveManifest = {
      assets: this.projectController.assetDb.assets
        .map((asset) => {
          // @NOTE map assets to pluck only desired properties
          if (asset.type === AssetType.Script) {
            // @NOTE Scripts need to be renamed to .js
            return {
              id: asset.id,
              type: asset.type,
              path: asset.path.replace(/\.\w+$/, '.js'),
            };
          } else {
            return {
              id: asset.id,
              type: asset.type,
              path: asset.path,
            };
          }
        }),
      scenes
    };

    // Compile cartridge file
    const createCartridgeResult = await invoke<number[]>('create_cartridge', {
      manifestFileBytes: JSON.stringify(manifest),
      projectRootPath: this.projectController.currentProjectRoot,
      assetPaths: this.projectController.assetDb.assets
        .filter((asset) => asset.type !== AssetType.Script)
        .map((asset) => asset.path),
      scriptPaths: this.projectController.assetDb.assets
        .filter((asset) => asset.type === AssetType.Script)
        .map((asset) => asset.path),
    } satisfies CreateCartridgeCmdArgs)

    return new Uint8Array(createCartridgeResult);
  }
}
