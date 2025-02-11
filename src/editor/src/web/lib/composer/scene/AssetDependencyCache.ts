import { makeAutoObservable } from "mobx";

import { GameObjectComponent } from "@fantasy-console/core/src/world";

import { GameObjectData } from "@lib/project/data";
import { ProjectFilesWatcher } from "@lib/project/watcher/ProjectFilesWatcher";
import { ProjectAssetEvent, ProjectAssetEventType } from "@lib/project/watcher/assets";
import { SceneViewController } from "./SceneViewController";

export interface AssetDependency {
  assetIds: string[];
  componentInstance: GameObjectComponent;
  gameObjectData: GameObjectData;
}

export class AssetDependencyCache {
  private readonly sceneViewController: SceneViewController;

  private readonly cacheByAssetId: Map<string, AssetDependency[]>;
  private readonly cacheByComponentId: Map<string, AssetDependency>;

  private readonly projectAssetUnlistenFn: () => void;

  public constructor(sceneViewController: SceneViewController, projectFilesWatcher: ProjectFilesWatcher) {
    this.sceneViewController = sceneViewController;

    this.projectAssetUnlistenFn = projectFilesWatcher.onAssetChanged((e) => this.onProjectAssetChanged(e));

    this.cacheByAssetId = new Map();
    this.cacheByComponentId = new Map();

    makeAutoObservable(this);
  }

  public onDestroy() {
    this.projectAssetUnlistenFn();
  }

  public registerDependency(assetIds: string[], componentInstance: GameObjectComponent, gameObjectData: GameObjectData) {
    if (this.cacheByComponentId.get(componentInstance.id) !== undefined) {
      console.warn(`Overwriting asset dependency cache: ${componentInstance.id}`);
    }

    const assetDependency: AssetDependency = {
      assetIds,
      componentInstance,
      gameObjectData,
    };

    // Add reference by component ID
    this.cacheByComponentId.set(componentInstance.id, assetDependency);

    // Add reference by each asset ID
    // References are stored as an array of dependencies, per asset
    for (const assetId of assetIds) {
      // Look up list of asset's dependents (initialise if not-yet-defined)
      let assetDependents = this.cacheByAssetId.get(assetId) || [];

      let existingDependencyIndex = assetDependents.findIndex((dependency) => dependency.componentInstance.id === componentInstance.id);
      if (existingDependencyIndex !== -1) {
        // Replace reference
        assetDependents[existingDependencyIndex] = assetDependency;
      } else {
        // Add new reference
        assetDependents.push(assetDependency);
      }

      // @NOTE mobx pollutes observed objects with Proxy objects
      // So we must explicitly assign here to trigger an update when
      // a new array is created
      this.cacheByAssetId.set(assetId, assetDependents);
    }
  }

  public unregisterDependency(componentInstance: GameObjectComponent) {
    let assetDependency = this.cacheByComponentId.get(componentInstance.id);
    if (assetDependency === undefined) {
      console.warn(`[AssetDependencyCache] (unregisterDependency) Attempted to unregister component with no dependencies: (component='${componentInstance.id}')`);
      return;
    }

    this.cacheByComponentId.delete(componentInstance.id);

    for (const assetId of assetDependency.assetIds) {
      this.cacheByAssetId.delete(assetId);
    }
  }

  public clear() {
    this.cacheByAssetId.clear();
    this.cacheByComponentId.clear();
  }

  private async onProjectAssetChanged(event: ProjectAssetEvent) {

    switch (event.type) {
      case ProjectAssetEventType.Modify:
      case ProjectAssetEventType.Delete:
        // Remove asset from sceneViewController cache, so that reinitializing the component
        // will load the new asset
        this.sceneViewController.invalidateAssetCache(event.asset.id);

        const assetDependencies = this.cacheByAssetId.get(event.asset.id) || [];
        await Promise.all(assetDependencies.map((assetDependency) => {
          console.log(`[DEBUG] [AssetDependencyCache] (onProjectAssetChanged) Reinitializing component due to asset change: (assetId='${event.asset.id}') (gameObjectId='${assetDependency.gameObjectData.id}')`);
          return this.sceneViewController.reinitializeComponentInstance(assetDependency.componentInstance, assetDependency.gameObjectData)
        }
        ));
        break;
      case ProjectAssetEventType.Create:
      case ProjectAssetEventType.Rename:
        break;
      default:
        console.error(`[AssetDependencyCache] (onProjectAssetChanged) Unimplemented asset event: `, event);
    }
  }
}
