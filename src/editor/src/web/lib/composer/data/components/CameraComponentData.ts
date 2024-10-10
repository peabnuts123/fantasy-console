import { makeAutoObservable } from "mobx";

import type { IComposerComponentData } from "./IComposerComponentData";

export class CameraComponentData implements IComposerComponentData {
  public readonly id: string;

  public constructor(id: string) {
    this.id = id;
    makeAutoObservable(this);
  }

  get componentName(): string {
    return `Camera`;
  }
}
