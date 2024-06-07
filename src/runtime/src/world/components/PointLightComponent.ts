import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { GameObjectComponent, GameObjectComponentData } from "../GameObjectComponent";

export class PointLightComponent extends GameObjectComponent {
  private light: PointLight;

  public constructor(data: GameObjectComponentData, light: PointLight) {
    super(data);
    this.light = light;
    light.parent = this.gameObject.transform;
  }
}