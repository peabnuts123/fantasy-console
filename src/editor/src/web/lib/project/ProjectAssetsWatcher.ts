import { UnwatchFn } from "@tauri-apps/plugin-fs";
import { ProjectController } from "./ProjectController";
import { TauriCommands } from "@lib/util/TauriCommands";
import { invoke } from "@tauri-apps/api/core";
import { AssetDefinition, ProjectDefinition } from "./definition";
import { listen } from "@tauri-apps/api/event";
import { TauriEvents } from "@lib/util/TauriEvents";
import { AssetDb, createAssetData } from "@fantasy-console/runtime/src/cartridge/data";
import { resolvePath } from "@lib/util/JsoncContainer";
import { runInAction } from "mobx";

export interface RawProjectAsset {
  id: string;
  path: string;
  hash: string;
}

export interface WatchProjectAssetsCommandArgs {
  projectAssets: RawProjectAsset[];
}

// @NOTE These must match `FsEvent` enum in: src/editor/src/app/src/filesystem.rs
export interface ProjectAssetCreatedEvent {
  create: {
    assetId: string;
    path: string;
    hash: string;
  },
}
export interface ProjectAssetDeletedEvent {
  delete: {
    assetId: string;
  },
}
export interface ProjectAssetModifiedEvent {
  modify: {
    assetId: string;
    newHash: string;
  },
}
export interface ProjectAssetRenamedEvent {
  rename: {
    assetId: string;
    newPath: string;
  },
}
export type ProjectAssetEvent = ProjectAssetCreatedEvent | ProjectAssetDeletedEvent | ProjectAssetModifiedEvent | ProjectAssetRenamedEvent;


export class ProjectAssetsWatcher {
  private readonly projectController: ProjectController;
  private _stopListeningForAssetEvents: UnwatchFn | undefined = undefined;

  public constructor(projectController: ProjectController) {
    this.projectController = projectController;
  }

  public async watch(project: ProjectDefinition) {
    // Start watching project for file changes on disk
    await invoke<string>(TauriCommands.StartWatchingProjectAssets, {
      projectAssets: project.assets.map((asset) => ({
        id: asset.id,
        path: asset.path,
        hash: asset.hash,
      })),
    } satisfies WatchProjectAssetsCommandArgs);

    // Listen for asset events from backend
    this._stopListeningForAssetEvents = await listen(TauriEvents.OnProjectAssetsUpdated, (e) => {
      this.onProjectAssetsUpdated(e.payload as ProjectAssetEvent[]);
    })
  }

  private onProjectAssetsUpdated(updates: ProjectAssetEvent[]) {
    console.log(`[ProjectAssetsWatcher] (onProjectAssetsUpdated)`, updates);

    runInAction(() => {
      for (const update of updates) {
        if ('create' in update) {
          this.applyCreate(update);
        } else if ('delete' in update) {
          this.applyDelete(update);
        } else if ('modify' in update) {
          this.applyModify(update);
        } else if ('rename' in update) {
          this.applyRename(update);
        }
      }
    });

    void this.projectController.mutator.persistChanges()

    // @TODO reconcile / check for problems or whatever after mutating
  }

  private applyCreate({ create: event }: ProjectAssetCreatedEvent) {
    const { assetId, path, hash } = event;
    const assetDb = this.projectController.assetDb;

    // 1. Update data
    console.log(`[ProjectAssetsWatcher] (applyCreate) New asset: ${path} (${assetId})`);
    const newAssetDefinition: AssetDefinition = {
      id: assetId,
      path,
      hash,
    };
    assetDb.assets.push(createAssetData(
      newAssetDefinition.id,
      AssetDb.getAssetType(newAssetDefinition),
      newAssetDefinition.path,
      assetDb.fileSystem.resolverProtocol,
    ));

    // 2. Update JSON
    let jsonPath = resolvePath((project: ProjectDefinition) => project.assets[assetDb.assets.length]);
    this.projectController.currentProjectJson.mutate(jsonPath, newAssetDefinition, { isArrayInsertion: true });
  }

  private applyDelete({ delete: event }: ProjectAssetDeletedEvent) {
    const { assetId } = event;
    const assetDb = this.projectController.assetDb;

    // 1. Update data
    const assetIndex = assetDb.assets.findIndex((asset) => asset.id === assetId);
    if (assetIndex === -1) throw new Error(`Cannot apply 'Delete' event: No asset found in AssetDb with id: ${assetId}`);
    const asset = assetDb.assets[assetIndex];
    console.log(`[ProjectAssetsWatcher] (applyDelete) Asset deleted: ${asset.path}`);
    assetDb.assets.splice(assetIndex, 1);

    // 2. Update JSON
    const jsonIndex = this.projectController.currentProject.assets.findIndex((asset) => asset.id === assetId);
    if (jsonIndex === -1) throw new Error(`Cannot apply 'Delete' event: No asset found in ProjectDefinition with id: ${assetId}`);
    let jsonPath = resolvePath((project: ProjectDefinition) => project.assets[jsonIndex]);
    this.projectController.currentProjectJson.delete(jsonPath);
  }

  private applyModify({ modify: event }: ProjectAssetModifiedEvent) {
    const { assetId, newHash } = event;

    // 1. Update data
    // @NOTE No-op. Hash is not used in-memory - it only exists on disk
    console.log(`[ProjectAssetsWatcher] (applyModify) Asset modified: ${assetId}`);

    // 2. Update JSON
    const jsonIndex = this.projectController.currentProject.assets.findIndex((asset) => asset.id === assetId);
    if (jsonIndex === -1) throw new Error(`Cannot apply 'Modify' event: No asset found in ProjectDefinition with id: ${assetId}`);
    let jsonPath = resolvePath((project: ProjectDefinition) => project.assets[jsonIndex].hash);
    this.projectController.currentProjectJson.mutate(jsonPath, newHash);
  }

  private applyRename({ rename: event }: ProjectAssetRenamedEvent) {
    const { assetId, newPath } = event;
    const assetDb = this.projectController.assetDb;

    // 1. Update data
    const asset = assetDb.assets.find((asset) => asset.id === assetId);
    if (asset === undefined) throw new Error(`Cannot apply 'Rename' event: No asset found in AssetDb with id: ${assetId}`);
    console.log(`[ProjectAssetsWatcher] (applyRename) Asset renamed: ${asset.path} -> ${newPath}`);
    asset.path = newPath;

    // 2. Update JSON
    const jsonIndex = this.projectController.currentProject.assets.findIndex((asset) => asset.id === assetId);
    if (jsonIndex === -1) throw new Error(`Cannot apply 'Rename' event: No asset found in ProjectDefinition with id: ${assetId}`);
    let jsonPath = resolvePath((project: ProjectDefinition) => project.assets[jsonIndex].path);
    this.projectController.currentProjectJson.mutate(jsonPath, newPath);
  }

  public onDestroy() {
    // Unsubscribe from asset events
    if (this._stopListeningForAssetEvents) {
      this._stopListeningForAssetEvents();
    }
  }
}
