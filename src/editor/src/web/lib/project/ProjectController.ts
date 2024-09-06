import { makeAutoObservable, runInAction } from "mobx";
import * as Jsonc from 'jsonc-parser';

import Resolver from '@fantasy-console/runtime/src/Resolver';
import { IFileSystem } from '@fantasy-console/runtime/src/filesystem';
import { AssetDb } from "@fantasy-console/runtime/src/cartridge";

import { TauriFileSystem } from '@lib/filesystem/TauriFileSystem';
import * as path from '@lib/tauri/path';
import { ProjectDefinition, ProjectManifest } from "./definition";

export class ProjectController {
  private _isLoadingProject: boolean = false;
  private _currentProject: ProjectDefinition | undefined = undefined;
  private _currentProjectRoot: string | undefined = undefined;
  private _assetDb?: AssetDb = undefined;
  private _fileSystem: IFileSystem | undefined = undefined;

  public constructor() {
    // @NOTE Class properties MUST have a value explicitly assigned
    // by this point otherwise mobx won't pick them up.
    makeAutoObservable(this);
  }

  public async loadProject(projectPath: string): Promise<void> {
    this._isLoadingProject = true;

    // Create file system relative to project
    const projectFileName = await path.basename(projectPath);
    const projectDirRoot = this._currentProjectRoot = await path.resolve(projectPath, '..');
    this._fileSystem = new TauriFileSystem(projectDirRoot);

    // Bind file system to babylon resolver
    Resolver.registerFileSystem(this._fileSystem);

    const projectFile = await this._fileSystem.readFile(projectFileName);
    // @TODO JSONC Container
    // @TODO also do we need some kind of ProjectConfig?
    const project = Jsonc.parse(projectFile.textContent) as ProjectDefinition;

    // Asset database
    const assetDb = new AssetDb(
      project.assets,
      this._fileSystem,
    );

    runInAction(() => {
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
  public get currentProjectManifest(): ProjectManifest {
    if (this._currentProject === undefined) {
      throw new ProjectNotLoadedError();
    }
    return this.currentProject.manifest;
  }

  public get currentProjectRoot(): string {
    if (this._currentProjectRoot === undefined) {
      throw new ProjectNotLoadedError();
    }
    return this._currentProjectRoot;
  }

  public get assetDb(): AssetDb {
    if (this._assetDb === undefined) {
      throw new ProjectNotLoadedError();
    }
    return this._assetDb;
  }

  public get fileSystem(): IFileSystem {
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

