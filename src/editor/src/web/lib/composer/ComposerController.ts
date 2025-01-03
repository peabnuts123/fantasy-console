import { makeAutoObservable, runInAction } from 'mobx';
import { v4 as uuid } from 'uuid';

import { AssetType, CartridgeArchiveManifest } from '@fantasy-console/runtime/src/cartridge';

import { ProjectController } from '@lib/project/ProjectController';
import { SceneManifest, toRuntimeSceneDefinition } from '@lib/project/definition';
import { SceneData } from '@lib/project/data';
import { invoke } from '@lib/util/TauriCommands';
import { SceneViewController } from './scene/SceneViewController';



export interface TabData {
  id: string;
  label: string;
  sceneViewController?: SceneViewController;
}


export class ComposerController {
  private _tabData: TabData[] = [];

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
    // @TODO remove?
  }

  public onExit() {
    // @TODO remove?
  }

  public async loadSceneForTab(tabId: string, sceneManifest: SceneData) {
    for (const tab of this.currentlyOpenTabs) {
      if (tab.id === tabId) {
        // Look up scene data
        const scene = this.projectController.project.scenes.getByPath(sceneManifest.path);
        if (scene === undefined) throw new Error(`Could not load scene for tab - no scene exists with path '${sceneManifest.path}'`);

        // Unload possible previously-loaded scene
        if (tab.sceneViewController !== undefined) {
          tab.sceneViewController?.destroy();
        }

        const sceneViewController = new SceneViewController(
          scene.data,
          scene.jsonc,
          this.projectController
        );

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

  /** Called when the app is unloaded (e.g. page refresh) */
  public onDestroy(): void {
    /* No-op */
  }

  // Kind of a debug method with a bit of a mashup of concerns
  /*
    @TODO
    Is there a way we can do this from Rust, so that we
    could do this from a CLI?
  */
  public async debug_buildCartridge(entryPointSceneIdOverride: string | undefined = undefined): Promise<Uint8Array> {

    // Load scene definitions
    const scenes = this.projectController.project.scenes.getAll();

    // Move `overrideEntryPoint` to be the first scene in the list
    if (entryPointSceneIdOverride !== undefined) {
      const overrideIndex = scenes.findIndex((scene) => scene.manifest.id === entryPointSceneIdOverride);
      if (overrideIndex === -1) {
        throw new Error(`Cannot build cartridge. Cannot set entrypoint to SceneDefinition with ID '${entryPointSceneIdOverride}' - it isn't one of the current project's scenes`);
      }

      const override = scenes.splice(overrideIndex, 1)[0];
      scenes.unshift(override);
    }

    // Build cartridge manifest
    const manifest: CartridgeArchiveManifest = {
      assets: this.projectController.project.assets.getAll()
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
      scenes: scenes.map((scene) =>
        toRuntimeSceneDefinition(scene.jsonc.value, scene.manifest.path)
      ),
    };

    // Compile cartridge file
    const createCartridgeResult = await invoke('create_cartridge', {
      manifestFileBytes: JSON.stringify(manifest),
      projectRootPath: this.projectController.project.rootPath,
      assetPaths: this.projectController.project.assets.getAll()
        .filter((asset) => asset.type !== AssetType.Script)
        .map((asset) => asset.path),
      scriptPaths: this.projectController.project.assets.getAll()
        .filter((asset) => asset.type === AssetType.Script)
        .map((asset) => asset.path),
    })

    return new Uint8Array(createCartridgeResult);
  }

  public get currentlyOpenTabs(): TabData[] {
    return this._tabData;
  }
}
