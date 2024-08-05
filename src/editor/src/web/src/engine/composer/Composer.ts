import { makeAutoObservable, runInAction } from 'mobx';
import { createContext, useContext } from "react";
import * as Jsonc from 'jsonc-parser';

import { DebugFileSystem, FileSystem } from "./filesystem";
import { ProjectDefinition } from "./project/ProjectDefinition";
import { AssetDb } from "./AssetDb";
import { SceneDb } from "./SceneDb";
import { SceneView } from './SceneView';
import { SceneManifest } from './project/scene';

interface LoadedProject {
  project: ProjectDefinition;
  assetDb: AssetDb;
  sceneDb: SceneDb;
}

export class Composer {
  private fileSystem: FileSystem;
  private _isLoadingProject: boolean = false;
  // @TODO Feel like these properties should maybe live on Composer itself
  private _currentProject?: LoadedProject = undefined; // @NOTE explicit `undefined` for mobx
  private _currentScene?: SceneView = undefined; // @NOTE explicit `undefined` for mobx

  public constructor() {
    // @NOTE debug file system serves from public URL
    this.fileSystem = new DebugFileSystem();

    // @NOTE Class properties MUST have a value explicitly assigned
    // by this point otherwise mobx won't pick them up.
    makeAutoObservable(this);
  }

  // @TODO probably need mobx or something in here
  public async loadProject(projectPath: string): Promise<void> {
    // const response = await fetch(`${ProjectRoot}/${ProjectName}`);
    this._isLoadingProject = true;

    // const json = await response.text();
    var projectFile = await this.fileSystem.getByPath(projectPath);
    var projectFileJson = new TextDecoder().decode(projectFile.bytes);
    // const result = parseTree(json);
    var project = Jsonc.parse(projectFileJson) as ProjectDefinition;


    const assetDb = new AssetDb(
      this.fileSystem,
      project.assets
    );

    const sceneDb = new SceneDb(
      this.fileSystem,
      project.scenes
    );

    runInAction(() => {
      this._currentProject = {
        project,
        assetDb,
        sceneDb,
      };
      this._isLoadingProject = false
    });
  }

  public loadScene(sceneManifest: SceneManifest) {
    this._currentScene = new SceneView(sceneManifest, this.currentProject.sceneDb);
  }

  public get isLoadingProject() {
    return this._isLoadingProject;
  }

  public get hasLoadedProject() {
    return this._currentProject !== undefined;
  }

  public get hasLoadedScene() {
    return this._currentScene !== undefined;
  }

  public get currentProject(): LoadedProject {
    if (!this.hasLoadedProject) {
      throw new Error(`No project is currently loaded`);
    }

    return this._currentProject!;
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
