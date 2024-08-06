import type { AssetContainer, InstantiatedEntries } from "@babylonjs/core/assetContainer";

import { GameObjectComponentData } from "@fantasy-console/core/src/world/GameObjectComponent";
import { MeshComponent } from "@fantasy-console/core/src/world/components/MeshComponent";

import { GameObjectBabylon } from "../GameObjectBabylon";

/**
 * Loads a mesh for this GameObject
 */
export class MeshComponentBabylon extends MeshComponent {
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

  // @NOTE override to expose concrete type for internal components
  public get gameObject(): GameObjectBabylon {
    return super.gameObject as GameObjectBabylon;
  }
}

