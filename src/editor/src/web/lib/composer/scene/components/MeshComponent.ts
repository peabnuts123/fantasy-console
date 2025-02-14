import type { AssetContainer } from "@babylonjs/core/assetContainer";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

import { MeshComponent as MeshComponentRuntime } from "@polyzone/runtime/src/world/components";
import type { GameObject } from "@polyzone/runtime/src/world";

import { MeshComponentData } from "@lib/project/data/components";
import type { ISelectableObject } from "./ISelectableObject";
import type { IAssetDependentComponent } from "./IAssetDependentComponent";

export class MeshComponent extends MeshComponentRuntime implements ISelectableObject, IAssetDependentComponent {
  /** Meshes populated into the selection cache */
  private readonly _selectionCacheData: AbstractMesh[];
  /** IDs of assets this component is dependent on */
  private readonly _assetDependencyIds: string[];

  /**
   * @param data Data needed to construct a GameObjectComponent.
   * @param asset Model assets loaded by Babylon
   */
  public constructor(data: MeshComponentData, gameObject: GameObject, asset: AssetContainer) {
    super(data.id, gameObject, asset);

    // Build asset dependency cache
    if (data.meshAsset === undefined) {
      this._assetDependencyIds = [];
    } else {
      this._assetDependencyIds = [data.meshAsset.id];
    }

    // Build selection cache data
    this._selectionCacheData = [];
    this.sceneInstances.rootNodes.forEach((node) => {
      // Add self
      if (node instanceof AbstractMesh) {
        this._selectionCacheData.push(node);
      }
      // Add children
      node.getChildMeshes(false)
        .forEach((child) => this._selectionCacheData.push(child));
    });
  }

  public get allSelectableMeshes(): AbstractMesh[] {
    return this._selectionCacheData;
  }

  public get assetDependencyIds(): string[] {
    return this._assetDependencyIds;
  }
}
