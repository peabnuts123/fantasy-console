import { PointLight } from "@babylonjs/core/Lights/pointLight";

import { PointLightComponent as PointLightComponentCore } from "@fantasy-console/core/src/world/components";

import { GameObject } from "../GameObject";


export class PointLightComponent extends PointLightComponentCore {
  public readonly id: string;
  public readonly gameObject: GameObject;

  private light: PointLight;

  public constructor(id: string, gameObject: GameObject, light: PointLight) {
    super();
    this.id = id;
    this.gameObject = gameObject;

    this.light = light;
    light.parent = this.gameObject.transform.node;
  }

  public override onDestroy(): void {
    this.light.dispose();
  }
}