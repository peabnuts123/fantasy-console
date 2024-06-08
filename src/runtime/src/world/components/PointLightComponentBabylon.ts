import { PointLight } from "@babylonjs/core/Lights/pointLight";

import { GameObjectComponentData } from "@fantasy-console/core/world/GameObjectComponent";
import { PointLightComponent } from "@fantasy-console/core/world/components/PointLightComponent";

import { InternalGameObjectComponent } from "../InternalGameObjectComponent";

export class PointLightComponentBabylon extends InternalGameObjectComponent implements PointLightComponent {
  private light: PointLight;

  public constructor(data: GameObjectComponentData, light: PointLight) {
    super(data);
    this.light = light;
    light.parent = this.gameObject.transform.node;
  }

  public override onDestroy(): void {
    super.onDestroy();
    this.light.dispose();
  }
}