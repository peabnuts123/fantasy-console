import { Color3 } from "@babylonjs/core/Maths/math.color";
import { makeAutoObservable } from "mobx";
import { v4 as uuid } from 'uuid';

import { ComponentDefinition, ComponentDefinitionType, DirectionalLightComponentDefinition } from "@fantasy-console/runtime/src/cartridge";
import { toColor3Definition } from "@fantasy-console/runtime/src/util";

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

  public toComponentDefinition(): ComponentDefinition {
    return {
      id: this.id,
      type: ComponentDefinitionType.DirectionalLight,
      color: toColor3Definition(this.color),
      intensity: this.intensity,
    } satisfies DirectionalLightComponentDefinition as DirectionalLightComponentDefinition;
  }

  public static createDefault(): DirectionalLightComponentData {
    return new DirectionalLightComponentData(
      uuid(),
      1,
      Color3.White(),
    )
  }

  get componentName(): string {
    return `Directional Light`;
  }
}
