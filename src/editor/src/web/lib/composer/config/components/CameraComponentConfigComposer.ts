import { makeObservable } from "mobx";

import { CameraComponentConfig } from "@fantasy-console/runtime/src/cartridge/config";

import { IComposerComponentConfig } from "./IComposerComponentConfig";

export class CameraComponentConfigComposer extends CameraComponentConfig implements IComposerComponentConfig {
  public constructor() {
    super();
    makeObservable(this, {
      // @NOTE No properties at present
    });
  }

  get componentName(): string {
    return `Camera`;
  }
}
