import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { GameObjectComponent, GameObjectComponentData } from "../GameObjectComponent";

export class DirectionalLightComponent extends GameObjectComponent {
  private light: DirectionalLight;

  public constructor(data: GameObjectComponentData, light: DirectionalLight) {
    super(data);
    this.light = light;
    light.parent = this.gameObject.transform;
  }
}