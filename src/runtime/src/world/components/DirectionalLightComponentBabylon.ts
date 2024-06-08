import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";

import { GameObjectComponentData } from "@fantasy-console/core/world/GameObjectComponent";
import { DirectionalLightComponent } from "@fantasy-console/core/world/components/DirectionalLightComponent";

import { InternalGameObjectComponent } from "../InternalGameObjectComponent";

export class DirectionalLightComponentBabylon extends InternalGameObjectComponent implements DirectionalLightComponent {
  private light: DirectionalLight;

  public constructor(data: GameObjectComponentData, light: DirectionalLight) {
    super(data);
    this.light = light;
    light.parent = this.gameObject.transform.node;
  }

  public override onDestroy(): void {
    super.onDestroy();
    this.light.dispose();
  }
}