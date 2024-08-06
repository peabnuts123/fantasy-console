import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";

import { GameObjectComponentData } from "@fantasy-console/core/src/world/GameObjectComponent";
import { DirectionalLightComponent } from "@fantasy-console/core/src/world/components/DirectionalLightComponent";

import { GameObjectBabylon } from "../GameObjectBabylon";

export class DirectionalLightComponentBabylon extends DirectionalLightComponent {
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

  // @NOTE override to expose concrete type for internal components
  public get gameObject(): GameObjectBabylon {
    return super.gameObject as GameObjectBabylon;
  }
}