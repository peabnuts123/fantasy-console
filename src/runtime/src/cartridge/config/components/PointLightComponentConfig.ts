import { ComponentConfig } from "./ComponentConfig";

import type { PointLightComponent } from '../../../world/components/PointLightComponent';
import { Color3 } from "@babylonjs/core/Maths/math.color";

/**
 * Configuration data for a {@link PointLightComponent}.
 * i.e. loaded from the raw cartridge file but not yet loaded into the game.
 */
export class PointLightComponentConfig extends ComponentConfig {
  public intensity: number;
  public color: Color3;

  public constructor(intensity: number, color: Color3) {
    super();
    this.intensity = intensity;
    this.color = color;
  }
}
