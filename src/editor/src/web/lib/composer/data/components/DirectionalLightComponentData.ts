import type { Color3 } from "@babylonjs/core/Maths/math.color";
import { makeAutoObservable } from "mobx";

import type { IComposerComponentData } from "./IComposerComponentData";

export class DirectionalLightComponentData implements IComposerComponentData {
  public readonly id: string;
  public intensity: number;
  public color: Color3;

  public constructor(id: string, intensity: number, color: Color3) {
    this.id = id;
    this.intensity = intensity;
    this.color = color;

    makeAutoObservable(this);
  }

  get componentName(): string {
    return `Directional Light`;
  }
}
