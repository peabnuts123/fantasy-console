import { makeAutoObservable, runInAction } from 'mobx';
import { invoke } from '@tauri-apps/api/core'
import { v4 as uuid } from 'uuid';

import { AssetType, CartridgeArchiveManifest } from '@fantasy-console/runtime/src/cartridge';

import { ProjectController } from '@lib/project/ProjectController';
import { SceneManifest } from '@lib/project/definition';
import { SceneDefinition, toRuntimeSceneDefinition } from '@lib/project/definition/scene/SceneDefinition';
import { TauriCommands } from '@lib/util/TauriCommands';
import { SceneViewController } from './scene/SceneViewController';
import { SceneData } from './data/SceneData';

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

  public async loadSceneForTab(tabId: string, sceneManifest: SceneManifest) {
    for (const tab of this.currentlyOpenTabs) {
      if (tab.id === tabId) {
        // Find scene definition in memory
        const rawSceneData = this.projectController.currentProjectRawSceneData.find((rawSceneDatum) => rawSceneDatum.manifest.path === sceneManifest.path);
        if (rawSceneData === undefined) throw new Error(`Could not load scene for tab - no scene exists with path '${sceneManifest.path}'`);
        const runtimeSceneDefinition = toRuntimeSceneDefinition(rawSceneData.jsonc.value, rawSceneData.manifest.path);

        const sceneViewController = new SceneViewController(
          new SceneData(runtimeSceneDefinition, this.projectController.assetDb),
          rawSceneData.jsonc,
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
    const scenes = this.projectController.currentProjectRawSceneData.map((rawSceneDatum) =>
      toRuntimeSceneDefinition(rawSceneDatum.jsonc.value, rawSceneDatum.manifest.path)
    );

    // Move `overrideEntryPoint` to be the first scene in the list
    if (entryPointSceneIdOverride !== undefined) {
      const overrideIndex = scenes.findIndex((scene) => scene.id === entryPointSceneIdOverride);
      if (overrideIndex === -1) {
        throw new Error(`Cannot build cartridge. Cannot set entrypoint to SceneDefinition with ID '${entryPointSceneIdOverride}' - it isn't one of the current project's scenes`);
      }

      const override = scenes.splice(overrideIndex, 1)[0];
      scenes.unshift(override);
    }

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
    const createCartridgeResult = await invoke<number[]>(TauriCommands.CreateCartridge, {
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

  public get currentlyOpenTabs(): TabData[] {
    return this._tabData;
  }
}
