import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";

import { DirectionalLightComponent as DirectionalLightComponentCore } from "@fantasy-console/core/src/world/components";

import { GameObject } from "../GameObject";

export class DirectionalLightComponent extends DirectionalLightComponentCore {
  public readonly id: string;
  public readonly gameObject: GameObject;

  private light: DirectionalLight;

  public constructor(id: string, gameObject: GameObject, light: DirectionalLight) {
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