import type { AssetContainer } from "@babylonjs/core/assetContainer";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

import type { GameObjectComponentData } from "@fantasy-console/core/src/world/GameObjectComponent";

import type { ISelectableAsset } from "./ISelectableAsset";
import { MeshComponentBabylon } from "@fantasy-console/runtime/src/world/components";
export class MeshComponentComposer extends MeshComponentBabylon implements ISelectableAsset {
  /** Meshes populated into the selection cache */
  private readonly _selectionCacheData: AbstractMesh[];

  /**
   * @param data Data needed to construct a GameObjectComponent.
   * @param asset Model assets loaded by Babylon
   */
  public constructor(data: GameObjectComponentData, asset: AssetContainer) {
    super(data, asset);

    // Build selection cache data
    this._selectionCacheData = [];
    this.sceneInstances.rootNodes.forEach((node) => {

      // Add self
      if (node instanceof AbstractMesh) {
        this.allSelectableMeshes.push(node);
      }
      // Add children
      node.getChildMeshes(false)
        .forEach((child) => this.allSelectableMeshes.push(child));
    })
  }

  public get allSelectableMeshes(): AbstractMesh[] {
    return this._selectionCacheData;
  }
}
