import type { AssetContainer, InstantiatedEntries } from "@babylonjs/core/assetContainer";

import { GameObjectComponentData } from "@fantasy-console/core/world/GameObjectComponent";
import { MeshComponent } from "@fantasy-console/core/world/components/MeshComponent";

import { InternalGameObjectComponent } from "../InternalGameObjectComponent";

/**
 * Loads a mesh for this GameObject
 */
export class MeshComponentBabylon extends InternalGameObjectComponent implements MeshComponent {
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
      node.parent = this.gameObject.transform.node;
    })
  }

  public override onDestroy(): void {
    super.onDestroy();
    this.sceneInstances.dispose();
  }
}

