import { makeAutoObservable, runInAction } from 'mobx';
import { createContext, useContext } from "react";
import * as Jsonc from 'jsonc-parser';

import { IFileSystem } from '@fantasy-console/runtime/src/filesystem';
import { AssetDb } from '@fantasy-console/runtime/src/cartridge';
import Resolver from '@fantasy-console/runtime/src/Resolver';

import { TauriFileSystem } from '@lib/filesystem/TauriFileSystem';
import * as path from '@lib/tauri/path';

import { SceneView } from './SceneView';
import { ProjectDefinition, ProjectManifest, SceneManifest } from './project/definition';
import { ComposerAssetResolverProtocol } from './constants';

export class Composer {
  private fileSystem: IFileSystem = undefined!; // @NOTE explicit `undefined` for mobx
  private _isLoadingProject: boolean = false;
  private _currentProject: ProjectDefinition | undefined = undefined; // @NOTE explicit `undefined` for mobx
  private _currentScene: SceneView | undefined = undefined; // @NOTE explicit `undefined` for mobx
  private _assetDb?: AssetDb = undefined;

  public constructor() {
    // @NOTE Class properties MUST have a value explicitly assigned
    // by this point otherwise mobx won't pick them up.
    makeAutoObservable(this);
  }

  public async loadProject(projectPath: string): Promise<void> {
    this._isLoadingProject = true;

    // Create file system relative to project
    const projectFileName = await path.basename(projectPath);
    const projectDirRoot = await path.resolve(projectPath, '..');
    this.fileSystem = new TauriFileSystem(projectDirRoot);

    // Bind file system to babylon resolver
    Resolver.registerFileSystem(ComposerAssetResolverProtocol, this.fileSystem);

    var projectFile = await this.fileSystem.readFile(projectFileName);
    var project = Jsonc.parse(projectFile.textContent) as ProjectDefinition;

    // Asset database
    const assetDb = new AssetDb(
      project.assets,
      this.fileSystem,
      ComposerAssetResolverProtocol,
    );

    runInAction(() => {
      this._currentProject = project;
      this._assetDb = assetDb;
      this._isLoadingProject = false
    });
  }

  public async loadScene(sceneManifest: SceneManifest) {
    const scene = await SceneView.loadFromManifest(sceneManifest, this.fileSystem, this.assetDb);
    runInAction(() => {
      this._currentScene = scene;
    })
  }

  public get assetDb(): AssetDb {
    if (this._assetDb === undefined) {
      throw new Error(`AssetDb is undefined - is a project loaded?`)
    }
    return this._assetDb;
  }

  public get isLoadingProject() {
    return this._isLoadingProject;
  }

  public get hasLoadedProject() {
    return this._currentProject !== undefined;
  }

  public get currentProject(): ProjectDefinition {
    if (this._currentProject === undefined) {
      throw new Error(`No project is currently loaded`);
    }
    return this._currentProject;
  }
  public get currentProjectManifest(): ProjectManifest {
    if (this._currentProject === undefined) {
      throw new Error(`No project is currently loaded`)
    }
    return this.currentProject.manifest;
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
