import { makeAutoObservable, runInAction } from 'mobx';
import { invoke } from '@tauri-apps/api/core'

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


export class ComposerController {
  private _currentScene: SceneViewController | undefined = undefined; // @NOTE explicit `undefined` for mobx

  private _stopWatchingFs?: Function = undefined;

  private readonly projectController: ProjectController;

  public constructor(projectController: ProjectController) {
    // @NOTE Class properties MUST have a value explicitly assigned
    // by this point otherwise mobx won't pick them up.
    makeAutoObservable(this);

    this.projectController = projectController;
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

  public async loadScene(sceneManifest: SceneManifest) {
    // @TODO this abstract probably doesn't make sense any more
    //  - @TODO What about it ^?
    const scene = await SceneViewController.loadFromManifest(sceneManifest, this.projectController);
    runInAction(() => {
      this._currentScene = scene;
    })
  }


  public get currentScene(): SceneViewController | undefined {
    return this._currentScene;
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
        if (this._currentScene !== undefined && sceneManifest.path === this._currentScene.scene.path) {
          // Load current scene from memory
          // @NOTE This is kind of @DEBUG because we are suppose to have multiple scenes open
          return this._currentScene.sceneDefinition;
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
