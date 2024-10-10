import type { AssetContainer } from "@babylonjs/core/assetContainer";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

import { MeshComponent as MeshComponentRuntime } from "@fantasy-console/runtime/src/world/components";
import type { GameObject } from "@fantasy-console/runtime/src/world";

import type { ISelectableObject } from "./ISelectableObject";

export class MeshComponent extends MeshComponentRuntime implements ISelectableObject {
  /** Meshes populated into the selection cache */
  private readonly _selectionCacheData: AbstractMesh[];

  /**
   * @param data Data needed to construct a GameObjectComponent.
   * @param asset Model assets loaded by Babylon
   */
  public constructor(id: string, gameObject: GameObject, asset: AssetContainer) {
    super(id, gameObject, asset);

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
}
