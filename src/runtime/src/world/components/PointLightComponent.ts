import { PointLight } from "@babylonjs/core/Lights/pointLight";

import { PointLightComponent as PointLightComponentCore } from "@polyzone/core/src/world/components";
import { Color3 } from "@polyzone/core/src/util";
import { toColor3Babylon, WrappedColor3Babylon } from '@polyzone/runtime/src/util';

import { GameObject } from "../GameObject";


export class PointLightComponent extends PointLightComponentCore {
  public readonly id: string;
  public readonly gameObject: GameObject;

  // Babylon instances
  private light: PointLight;

  // Wrapped state
  private _color: WrappedColor3Babylon;

  public constructor(id: string, gameObject: GameObject, light: PointLight) {
    super();
    this.id = id;
    this.gameObject = gameObject;

    this.light = light;
    light.parent = this.gameObject.transform.node;

    this._color = new WrappedColor3Babylon(
      () => this.light.diffuse,
      (value) => this.light.diffuse = value,
    );
  }

  public override onDestroy(): void {
    this.light.dispose();
  }

  public override get color(): Color3 { return this._color; }
  public override set color(value: Color3) { this._color.setValue(toColor3Babylon(value)); }
  public override get intensity(): number { return this.light.intensity; }
  public override set intensity(value: number) { this.light.intensity = value; }
}