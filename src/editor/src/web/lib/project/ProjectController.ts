import { makeAutoObservable, runInAction } from "mobx";

import Resolver from '@fantasy-console/runtime/src/Resolver';
import { AssetDb } from "@fantasy-console/runtime/src/cartridge";

import { TauriFileSystem } from '@lib/filesystem/TauriFileSystem';
import * as path from "@tauri-apps/api/path";
import { ProjectDefinition, ProjectManifest } from "./definition";
import { JsoncContainer } from "@lib/util/JsoncContainer";
import { ProjectMutator } from "@lib/mutation/project/ProjectMutator";

export class ProjectController {
  private _isLoadingProject: boolean = false;
  private _currentProject: ProjectDefinition | undefined = undefined;
  private _currentProjectJson: JsoncContainer<ProjectDefinition> | undefined = undefined;
  private readonly _mutator: ProjectMutator;
  private _currentProjectRoot: string | undefined = undefined;
  private _currentProjectFileName: string | undefined = undefined;
  private _assetDb?: AssetDb = undefined;
  private _fileSystem: TauriFileSystem | undefined = undefined;

  public constructor() {
    this._mutator = new ProjectMutator(this);

    // @NOTE Class properties MUST have a value explicitly assigned
    // by this point otherwise mobx won't pick them up.
    makeAutoObservable(this);
  }

  public async loadProject(projectPath: string): Promise<void> {
    this._isLoadingProject = true;

    // Create file system relative to project
    const projectFileName = await path.basename(projectPath);
    const projectDirRoot = await path.resolve(projectPath, '..');
    const fileSystem = new TauriFileSystem(projectDirRoot);
    runInAction(() => {
      this._currentProjectFileName = projectFileName;
      this._currentProjectRoot = projectDirRoot;
      this._fileSystem = fileSystem;
    });

    // Bind file system to babylon resolver
    Resolver.registerFileSystem(fileSystem);

    const projectFile = await fileSystem.readFile(projectFileName);
    // @TODO also do we need some kind of ProjectData?
    const projectJson = new JsoncContainer<ProjectDefinition>(projectFile.textContent);
    const project = projectJson.value;

    // Asset database
    const assetDb = new AssetDb(
      project.assets,
      fileSystem,
    );

    runInAction(() => {
      this._currentProjectJson = projectJson;
      this._currentProject = project;
      this._assetDb = assetDb;
      this._isLoadingProject = false
    });
  }

  public get isLoadingProject() {
    return this._isLoadingProject;
  }

  public get hasLoadedProject() {
    return this._currentProject !== undefined;
  }

  public get currentProject(): ProjectDefinition {
    if (this._currentProject === undefined) {
      throw new ProjectNotLoadedError();
    }
    return this._currentProject;
  }
  public get currentProjectJson(): JsoncContainer<ProjectDefinition> {
    if (this._currentProjectJson === undefined) {
      throw new ProjectNotLoadedError();
    }
    return this._currentProjectJson;
  }
  public get currentProjectManifest(): ProjectManifest {
    if (this._currentProject === undefined) {
      throw new ProjectNotLoadedError();
    }
    return this.currentProject.manifest;
  }
  public get mutator(): ProjectMutator {
    return this._mutator;
  }
  public get currentProjectRoot(): string {
    if (this._currentProjectRoot === undefined) {
      throw new ProjectNotLoadedError();
    }
    return this._currentProjectRoot;
  }
  public get currentProjectFileName(): string {
    if (this._currentProjectFileName === undefined) {
      throw new ProjectNotLoadedError();
    }
    return this._currentProjectFileName;
  }

  public get assetDb(): AssetDb {
    if (this._assetDb === undefined) {
      throw new ProjectNotLoadedError();
    }
    return this._assetDb;
  }

  public get fileSystem(): TauriFileSystem {
    if (this._fileSystem === undefined) {
      throw new ProjectNotLoadedError();
    }
    return this._fileSystem;
  }
}

export class ProjectNotLoadedError extends Error {
  public constructor() {
    super(`No project is currently loaded`);
  }
}

