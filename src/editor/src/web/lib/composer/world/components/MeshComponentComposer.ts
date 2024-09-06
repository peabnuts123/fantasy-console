import type { AssetContainer, InstantiatedEntries } from "@babylonjs/core/assetContainer";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

import type { GameObjectComponentData } from "@fantasy-console/core/src/world/GameObjectComponent";
import { MeshComponent } from "@fantasy-console/core/src/world/components/MeshComponent";
import type { GameObjectBabylon } from "@fantasy-console/runtime/src/world/GameObjectBabylon";

import type { ComposerSelectionCache, ISelectableAsset } from "./ISelectableAsset";

/**
 * Loads a mesh for this GameObject
 */
export class MeshComponentComposer extends MeshComponent implements ISelectableAsset {
  /** Instances (clones) of model assets in the scene */
  private readonly sceneInstances: InstantiatedEntries;
  /** Meshes populated into the selection cache */
  private readonly selectionCacheData: AbstractMesh[];

  /**
   * @param data Data needed to construct a GameObjectComponent.
   * @param asset Model assets loaded by Babylon
   */
  public constructor(data: GameObjectComponentData, asset: AssetContainer) {
    super(data);
    this.selectionCacheData = [];
    this.sceneInstances = asset.instantiateModelsToScene();
    this.sceneInstances.rootNodes.forEach((node) => {
      node.parent = this.gameObject.transform.node;

      /* Build selection cache data */
      // Add self
      if (node instanceof AbstractMesh) {
        this.selectionCacheData.push(node);
      }
      // Add children
      node.getChildMeshes(false)
        .forEach((child) => this.selectionCacheData.push(child));
    })
  }

  public addToSelectionCache(cache: ComposerSelectionCache): void {
    this.selectionCacheData.forEach((entry) => {
      cache.set(entry, this.gameObject);
    });
  }

  public removeFromSelectionCache(cache: ComposerSelectionCache): void {
    this.selectionCacheData.forEach((entry) => {
      cache.delete(entry);
    });
  }

  public override onDestroy(): void {
    super.onDestroy();
    this.sceneInstances.dispose();
  }

  // @NOTE override to expose concrete type for internal components
  public get gameObject(): GameObjectBabylon {
    return super.gameObject as GameObjectBabylon;
  }
}
