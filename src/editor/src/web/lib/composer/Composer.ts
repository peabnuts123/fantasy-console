import { makeAutoObservable, runInAction } from 'mobx';
import { createContext, useContext } from "react";
import * as Jsonc from 'jsonc-parser';

import { IFileSystem } from '@fantasy-console/runtime/src/filesystem';
import { AssetDb, SceneConfig, SceneDb, SceneDefinition } from '@fantasy-console/runtime/src/cartridge';
import Resolver from '@fantasy-console/runtime/src/Resolver';

import { SceneView } from './SceneView';
import { ProjectDefinition, ProjectManifest } from './project/definition';
import { DebugFileSystem } from './DebugFileSystem';
import { ComposerAssetResolverProtocol } from './constants';

export class Composer {
  private fileSystem: IFileSystem;
  private _isLoadingProject: boolean = false;
  // @TODO Feel like these properties should maybe live on Composer itself
  private _currentScene?: SceneView = undefined; // @NOTE explicit `undefined` for mobx
  private _currentProjectManifest?: ProjectManifest = undefined;
  private _assetDb?: AssetDb = undefined;
  private _sceneDb?: SceneDb = undefined;

  public constructor() {
    // @NOTE debug file system serves from public URL
    this.fileSystem = new DebugFileSystem();

    // @NOTE Class properties MUST have a value explicitly assigned
    // by this point otherwise mobx won't pick them up.
    makeAutoObservable(this);
  }

  public async loadProject(projectPath: string): Promise<void> {
    this._isLoadingProject = true;

    var projectFile = await this.fileSystem.getByPath(projectPath);
    var projectFileJson = new TextDecoder().decode(projectFile.bytes);
    var project = Jsonc.parse(projectFileJson) as ProjectDefinition;

    // Asset database
    const assetDb = await AssetDb.build(
      project.assets,
      this.fileSystem,
      ComposerAssetResolverProtocol,
    );

    // Bind assetDb to babylon resolver
    Resolver.registerAssetDb(ComposerAssetResolverProtocol, assetDb);

    // Scene database
    const sceneDefinitions = await Promise.all(
      project.scenes.map(async (sceneManifest) => {
        const file = await this.fileSystem.getByPath(sceneManifest.path);
        const json = new TextDecoder().decode(file.bytes);
        const sceneDefinition = Jsonc.parse(json) as SceneDefinition;
        // @NOTE path property comes from manifest
        sceneDefinition.path = sceneManifest.path;
        return sceneDefinition;
      })
    );
    const sceneDb = SceneDb.build(
      sceneDefinitions,
      assetDb,
    );

    runInAction(() => {
      this._currentProjectManifest = project.manifest;
      this._assetDb = assetDb;
      this._sceneDb = sceneDb;
      this._isLoadingProject = false
    });
  }

  public loadScene(scene: SceneConfig) {
    this._currentScene = new SceneView(scene);
  }

  public get assetDb(): AssetDb {
    if (this._assetDb === undefined) {
      throw new Error(`AssetDb is undefined - is a project loaded?`)
    }
    return this._assetDb;
  }

  public get sceneDb(): SceneDb {
    if (this._sceneDb === undefined) {
      throw new Error(`SceneDb is undefined - is a project loaded?`)
    }
    return this._sceneDb;
  }

  public get isLoadingProject() {
    return this._isLoadingProject;
  }

  public get hasLoadedProject() {
    return this._currentProjectManifest !== undefined;
  }

  public get currentProjectManifest(): ProjectManifest {
    if (this._currentProjectManifest === undefined) {
      throw new Error(`No project is currently loaded`)
    }
    return this._currentProjectManifest;
  }

  public get hasLoadedScene() {
    return this._currentScene !== undefined;
  }

  public get currentScene(): SceneView {
    if (this._currentScene === undefined) {
      throw new Error(`No scene is currently loaded`);
    }

    return this._currentScene;
  }
}

// @TODO mostly redundant in its current form (i.e. no provider)
const ComposerContext = createContext<Composer>(new Composer());
export const useComposer = (): Composer => useContext(ComposerContext);
