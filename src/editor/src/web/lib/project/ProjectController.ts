import { makeAutoObservable, runInAction } from "mobx";
import * as path from "@tauri-apps/api/path";

import Resolver from '@fantasy-console/runtime/src/Resolver';

import { TauriFileSystem } from '@lib/filesystem/TauriFileSystem';
import { JsoncContainer } from "@lib/util/JsoncContainer";
import { ProjectMutator } from "@lib/mutation/project/ProjectMutator";
import { ProjectDefinition } from "./definition";
import { invoke } from "@lib/util/TauriCommands";
import { ProjectFilesWatcher } from "./watcher/ProjectFilesWatcher";
import { ProblemScanner } from "./problems/ProblemScanner";
import { ProjectData } from "./data/ProjectData";


export class ProjectController {
  private _isLoadingProject: boolean = false;
  private _projectDefinition: JsoncContainer<ProjectDefinition> | undefined = undefined;
  private readonly _mutator: ProjectMutator;
  private _project: ProjectData | undefined = undefined;
  private _fileSystem: TauriFileSystem | undefined = undefined;
  private _assetsWatcher: ProjectFilesWatcher | undefined = undefined;
  private problemScanner: ProblemScanner | undefined = undefined;

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
      this._fileSystem = fileSystem;
    });

    // Bind file system to babylon resolver
    Resolver.registerFileSystem(fileSystem);

    // Notify backend that project is loaded
    await invoke('load_project', { projectFilePath: projectPath });

    const projectFile = await fileSystem.readFile(projectFileName);
    const projectJson = new JsoncContainer<ProjectDefinition>(projectFile.textContent);

    const project = await ProjectData.new({
      rootPath: projectDirRoot,
      fileName: projectFileName,
      definition: projectJson.value,
      fileSystem,
    });

    runInAction(() => {
      this._projectDefinition = projectJson;
      this._project = project;
      this._isLoadingProject = false
    });

    // Start asset watcher
    this._assetsWatcher = new ProjectFilesWatcher(this);
    await this._assetsWatcher.watch();

    // Start problem scanner
    // @TODO just pass the watcher in directly (?)
    this.problemScanner = new ProblemScanner(this);
    // @TODO Run an initial scan for problems
  }

  public async reloadProjectFileFromFs() {
    const oldProject = this.project;
    const projectFile = await this.fileSystem.readFile(oldProject.fileName);

    const projectJson = new JsoncContainer<ProjectDefinition>(projectFile.textContent);

    const project = await ProjectData.new({
      rootPath: oldProject.rootPath,
      fileName: oldProject.fileName,
      definition: projectJson.value,
      fileSystem: this.fileSystem,
    });

    runInAction(() => {
      this._projectDefinition = projectJson;
      this._project = project;
    });

    return project;
  }

  public onDestroy() {
    // Attempt to stop watching the FS before the page unloads
    // Generally sends a request to Tauri backend which is received but logs some
    // warnings when the response is sent back after the page has reloaded.
    // See: https://github.com/tauri-apps/tauri/issues/10266
    if (this.hasLoadedProject) {
      invoke('unload_project');
    }
    this._assetsWatcher?.onDestroy();
    this.problemScanner?.onDestroy();
  }

  public get isLoadingProject() {
    return this._isLoadingProject;
  }

  public get hasLoadedProject() {
    return this._project !== undefined;
  }

  public get project(): ProjectData {
    if (this._project === undefined) {
      throw new ProjectNotLoadedError();
    }
    return this._project;
  }
  public get projectDefinition(): JsoncContainer<ProjectDefinition> {
    if (this._projectDefinition === undefined) {
      throw new ProjectNotLoadedError();
    }
    return this._projectDefinition;
  }

  public get mutator(): ProjectMutator {
    return this._mutator;
  }

  public get fileSystem(): TauriFileSystem {
    if (this._fileSystem === undefined) {
      throw new ProjectNotLoadedError();
    }
    return this._fileSystem;
  }

  public get filesWatcher(): ProjectFilesWatcher {
    if (this._assetsWatcher === undefined) {
      throw new ProjectNotLoadedError();
    }
    return this._assetsWatcher;
  }
}

export class ProjectNotLoadedError extends Error {
  public constructor() {
    super(`No project is currently loaded`);
  }
}

