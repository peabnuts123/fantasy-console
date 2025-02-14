import type { AssetContainer, InstantiatedEntries } from "@babylonjs/core/assetContainer";

import { MeshComponent as MeshComponentCore } from "@polyzone/core/src/world/components";
import { debug_modTexture } from "@polyzone/runtime/src";

import { GameObject } from "../GameObject";

/**
 * Loads a mesh for this GameObject
 */
export class MeshComponent extends MeshComponentCore {
  public readonly id: string;
  public readonly gameObject: GameObject;

  /** Instances (clones) of model assets in the scene */
  protected readonly sceneInstances: InstantiatedEntries;

  /**
   * @param data Data needed to construct a GameObjectComponent.
   * @param asset Model assets loaded by Babylon
   */
  public constructor(id: string, gameObject: GameObject, asset: AssetContainer) {
    super();
    this.id = id;
    this.gameObject = gameObject;

    // @TODO Implement a proper shader
    for (const texture of asset.textures) {
      debug_modTexture(texture);
    }

    this.sceneInstances = asset.instantiateModelsToScene();
    this.sceneInstances.rootNodes.forEach((node) => {
      node.parent = this.gameObject.transform.node;
    })
  }

  public override onDestroy(): void {
    this.sceneInstances.dispose();
  }
}
