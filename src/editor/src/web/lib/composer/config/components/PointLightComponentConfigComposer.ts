import { PointLightComponentConfig } from "@fantasy-console/runtime/src/cartridge/config";

import { IComposerComponentConfig } from "./IComposerComponentConfig";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { makeObservable, observable } from "mobx";

export class PointLightComponentConfigComposer extends PointLightComponentConfig implements IComposerComponentConfig {
  public constructor(intensity: number, color: Color3) {
    super(intensity, color);

    makeObservable(this, {
      intensity: observable,
      color: observable,
    });
  }

  get componentName(): string {
    return `Point Light`;
  }
}
