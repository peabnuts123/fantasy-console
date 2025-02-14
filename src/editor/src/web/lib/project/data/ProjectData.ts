import { makeAutoObservable } from "mobx";
import { IFileSystem } from "@polyzone/runtime/src/filesystem";
import { ProjectDefinition, ProjectManifest } from "../definition";
import { AssetDb } from "./AssetDb";
import { SceneDb } from "./SceneDb";

export interface ProjectDataConstructorArgs {
  rootPath: string;
  fileName: string;
  definition: ProjectDefinition;
  fileSystem: IFileSystem;
}

export class ProjectData {
  public readonly rootPath: string;
  public fileName: string;
  public readonly assets: AssetDb;
  public readonly scenes: SceneDb;
  public readonly manifest: ProjectManifest;

  private constructor(rootPath: string, fileName: string, manifest: ProjectManifest, assets: AssetDb, scenes: SceneDb) {
    this.rootPath = rootPath;
    this.fileName = fileName;
    this.manifest = manifest;
    this.assets = assets;
    this.scenes = scenes;

    makeAutoObservable(this);
  }

  public static async new({
    rootPath,
    fileName,
    definition,
    fileSystem,
  }: ProjectDataConstructorArgs): Promise<ProjectData> {
    const assetDb = new AssetDb(
      definition.assets,
      fileSystem,
    );
    const sceneDb = await SceneDb.new(
      definition.scenes,
      assetDb,
      fileSystem,
    );

    // @NOTE passing args positionally 😕
    return new ProjectData(
      rootPath,
      fileName,
      definition.manifest,
      assetDb,
      sceneDb,
    );
  }
}
