import { makeAutoObservable } from "mobx";
import { v4 as uuid } from 'uuid';

import { Color3 } from '@fantasy-console/core/src/util';
import { ComponentDefinition, ComponentDefinitionType, PointLightComponentDefinition } from "@fantasy-console/runtime/src/cartridge";
import { toColor3Definition } from "@fantasy-console/runtime/src/util";

import type { IComposerComponentData } from "./IComposerComponentData";

export class PointLightComponentData implements IComposerComponentData {
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
      type: ComponentDefinitionType.PointLight,
      color: toColor3Definition(this.color),
      intensity: this.intensity,
    } satisfies PointLightComponentDefinition as PointLightComponentDefinition;
  }

  public static createDefault(): PointLightComponentData {
    return new PointLightComponentData(
      uuid(),
      1,
      Color3.white(),
    )
  }

  get componentName(): string {
    return `Point Light`;
  }
}
