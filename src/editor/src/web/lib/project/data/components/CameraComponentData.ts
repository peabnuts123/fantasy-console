import { makeAutoObservable } from "mobx";
import { v4 as uuid } from 'uuid';

import { CameraComponentDefinition, ComponentDefinition, ComponentDefinitionType } from "@polyzone/runtime/src/cartridge";

import type { IComposerComponentData } from "./IComposerComponentData";

export class CameraComponentData implements IComposerComponentData {
  public readonly id: string;

  public constructor(id: string) {
    this.id = id;
    makeAutoObservable(this);
  }

  public toComponentDefinition(): ComponentDefinition {
    return {
      id: this.id,
      type: ComponentDefinitionType.Camera,
    } satisfies CameraComponentDefinition as CameraComponentDefinition;
  }

  public static createDefault(): CameraComponentData {
    return new CameraComponentData(uuid());
  }

  get componentName(): string {
    return `Camera`;
  }
}
