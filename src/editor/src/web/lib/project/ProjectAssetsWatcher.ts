import { runInAction } from "mobx";
import { UnwatchFn } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

import { TauriCommands } from "@lib/util/TauriCommands";
import { TauriEvents } from "@lib/util/TauriEvents";
import { resolvePath } from "@lib/util/JsoncContainer";
import { AssetDefinition, ProjectDefinition } from "./definition";
import { ProjectController } from "./ProjectController";
import { AssetData, createAssetData } from "./data/AssetData";
import { AssetDb } from "./AssetDb";

export interface RawProjectAsset {
  id: string;
  path: string;
  hash: string;
}

export interface WatchProjectAssetsCommandArgs {
  projectAssets: RawProjectAsset[];
}

// @NOTE These must match `FsEvent` enum in: src/editor/src/app/src/filesystem.rs
export interface RawAssetCreatedEvent {
  create: {
    assetId: string;
    path: string;
    hash: string;
  },
}
export interface RawAssetDeletedEvent {
  delete: {
    assetId: string;
  },
}
export interface RawAssetModifiedEvent {
  modify: {
    assetId: string;
    newHash: string;
  },
}
export interface RawAssetRenamedEvent {
  rename: {
    assetId: string;
    newPath: string;
  },
}
export type RawAssetEvent = RawAssetCreatedEvent | RawAssetDeletedEvent | RawAssetModifiedEvent | RawAssetRenamedEvent;


export enum ProjectAssetEventType {
  Create = "create",
  Delete = "delete",
  Modify = "modify",
  Rename = "rename",
}
export interface ProjectAssetCreatedEvent {
  type: ProjectAssetEventType.Create;
  asset: AssetData;
}
export interface ProjectAssetDeletedEvent {
  type: ProjectAssetEventType.Delete;
  asset: AssetData;
}
export interface ProjectAssetModifiedEvent {
  type: ProjectAssetEventType.Modify;
  asset: AssetData;
  oldHash: string;
}
export interface ProjectAssetRenamedEvent {
  type: ProjectAssetEventType.Rename;
  asset: AssetData;
  oldPath: string;
}
export type ProjectAssetEvent = ProjectAssetCreatedEvent | ProjectAssetDeletedEvent | ProjectAssetModifiedEvent | ProjectAssetRenamedEvent;

type ProjectAssetEventListener = (event: ProjectAssetEvent) => void;

export class ProjectAssetsWatcher {
  private readonly projectController: ProjectController;
  private _stopListeningForAssetEvents: UnwatchFn | undefined = undefined;

  private readonly projectAssetEventListeners: ProjectAssetEventListener[] = [];

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
      this.onProjectAssetsUpdated(e.payload as RawAssetEvent[]);
    })
  }

  public listen(callback: ProjectAssetEventListener) {
    this.projectAssetEventListeners.push(callback);

    // Unlisten function
    return () => {
      const listenerIndex = this.projectAssetEventListeners.indexOf(callback);
      if (listenerIndex !== -1) {
        this.projectAssetEventListeners.splice(listenerIndex, 1);
      }
    }
  }

  private onProjectAssetsUpdated(updates: RawAssetEvent[]) {
    console.log(`[ProjectAssetsWatcher] (onProjectAssetsUpdated)`, updates);

    let events: ProjectAssetEvent[] = [];
    runInAction(() => {
      for (const update of updates) {
        if ('create' in update) {
          events.push(this.applyCreate(update));
        } else if ('delete' in update) {
          events.push(this.applyDelete(update));
        } else if ('modify' in update) {
          events.push(this.applyModify(update));
        } else if ('rename' in update) {
          events.push(this.applyRename(update));
        }
      }
    });

    // Dispatch all events in sequence
    for (const event of events) {
      for (const listener of this.projectAssetEventListeners) {
        listener(event);
      }
    }

    void this.projectController.mutator.persistChanges()

    // @TODO reconcile / check for problems or whatever after mutating
  }

  private applyCreate({ create: event }: RawAssetCreatedEvent): ProjectAssetCreatedEvent {
    const { assetId, path, hash } = event;
    const assetDb = this.projectController.assetDb;

    // 1. Update data
    console.log(`[ProjectAssetsWatcher] (applyCreate) New asset: ${path} (${assetId})`);
    const newAssetDefinition: AssetDefinition = {
      id: assetId,
      path,
      hash,
    };
    const newAsset = createAssetData(
      AssetDb.getAssetType(newAssetDefinition),
      {
        id: newAssetDefinition.id,
        path: newAssetDefinition.path,
        hash: newAssetDefinition.hash,
        resolverProtocol: assetDb.fileSystem.resolverProtocol,
      }
    );
    assetDb.assets.push(newAsset);

    // 2. Update JSON
    let jsonPath = resolvePath((project: ProjectDefinition) => project.assets[assetDb.assets.length]);
    this.projectController.currentProjectJson.mutate(jsonPath, newAssetDefinition, { isArrayInsertion: true });

    return {
      type: ProjectAssetEventType.Create,
      asset: newAsset,
    };
  }

  private applyDelete({ delete: event }: RawAssetDeletedEvent): ProjectAssetDeletedEvent {
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

    return {
      type: ProjectAssetEventType.Delete,
      asset,
    };
  }

  private applyModify({ modify: event }: RawAssetModifiedEvent): ProjectAssetModifiedEvent {
    const { assetId, newHash } = event;
    const assetDb = this.projectController.assetDb;

    // 1. Update data
    const asset = assetDb.assets.find((asset) => asset.id === assetId);
    if (asset === undefined) throw new Error(`Cannot apply 'Modify' event: No asset found in AssetDb with id: ${assetId}`);
    console.log(`[ProjectAssetsWatcher] (applyModify) Asset modified: ${asset.path}`);
    const oldHash = asset.hash;
    asset.hash = newHash;

    // 2. Update JSON
    const jsonIndex = this.projectController.currentProject.assets.findIndex((asset) => asset.id === assetId);
    if (jsonIndex === -1) throw new Error(`Cannot apply 'Modify' event: No asset found in ProjectDefinition with id: ${assetId}`);
    let jsonPath = resolvePath((project: ProjectDefinition) => project.assets[jsonIndex].hash);
    this.projectController.currentProjectJson.mutate(jsonPath, newHash);

    return {
      type: ProjectAssetEventType.Modify,
      asset,
      oldHash,
    };
  }

  private applyRename({ rename: event }: RawAssetRenamedEvent): ProjectAssetRenamedEvent {
    const { assetId, newPath } = event;
    const assetDb = this.projectController.assetDb;

    // 1. Update data
    const asset = assetDb.assets.find((asset) => asset.id === assetId);
    if (asset === undefined) throw new Error(`Cannot apply 'Rename' event: No asset found in AssetDb with id: ${assetId}`);
    console.log(`[ProjectAssetsWatcher] (applyRename) Asset renamed: ${asset.path} -> ${newPath}`);
    const oldPath = asset.path;
    asset.path = newPath;

    // 2. Update JSON
    const jsonIndex = this.projectController.currentProject.assets.findIndex((asset) => asset.id === assetId);
    if (jsonIndex === -1) throw new Error(`Cannot apply 'Rename' event: No asset found in ProjectDefinition with id: ${assetId}`);
    let jsonPath = resolvePath((project: ProjectDefinition) => project.assets[jsonIndex].path);
    this.projectController.currentProjectJson.mutate(jsonPath, newPath);

    return {
      type: ProjectAssetEventType.Rename,
      asset,
      oldPath,
    };
  }

  public onDestroy() {
    // Unsubscribe from asset events
    if (this._stopListeningForAssetEvents) {
      this._stopListeningForAssetEvents();
    }
  }
}
