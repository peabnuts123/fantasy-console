import { PointLight } from "@babylonjs/core/Lights/pointLight";

import { GameObjectComponentData } from "@fantasy-console/core/world/GameObjectComponent";
import { PointLightComponent } from "@fantasy-console/core/world/components/PointLightComponent";

import { GameObjectBabylon } from "../GameObjectBabylon";


export class PointLightComponentBabylon extends PointLightComponent {
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

  // @NOTE override to expose concrete type for internal components
  public get gameObject(): GameObjectBabylon {
    return super.gameObject as GameObjectBabylon;
  }
}