import { AssetContainer, InstantiatedEntries } from "@babylonjs/core";

import { GameObjectComponent, GameObjectComponentData } from "../GameObjectComponent";

/**
 * Loads a mesh for this GameObject
 */
export class MeshComponent extends GameObjectComponent {
  /** Instances (clones) of model assets in the scene */
  private readonly sceneInstances: InstantiatedEntries;

  /**
   * @param data Data needed to construct a GameObjectComponent.
   * @param asset Model assets loaded by Babylon
   */
  public constructor(data: GameObjectComponentData, asset: AssetContainer) {
    super(data);
    this.sceneInstances = asset.instantiateModelsToScene();
    this.sceneInstances.rootNodes.forEach((node) => {
      node.parent = this.gameObject.transform;
    })
  }

  public override onDestroy(): void {
    this.sceneInstances.dispose();
  }
}

