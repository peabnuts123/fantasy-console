import { DirectionalLightComponentConfig } from "@fantasy-console/runtime/src/cartridge/config";

import { IComposerComponentConfig } from "./IComposerComponentConfig";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { makeObservable, observable } from "mobx";

export class DirectionalLightComponentConfigComposer extends DirectionalLightComponentConfig implements IComposerComponentConfig {
  public constructor(intensity: number, color: Color3) {
    super(intensity, color);

    makeObservable(this, {
      intensity: observable,
      color: observable,
    });
  }

  get componentName(): string {
    return `Directional Light`;
  }
}
