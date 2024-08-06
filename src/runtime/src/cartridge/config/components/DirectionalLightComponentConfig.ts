import { Color3 } from "@babylonjs/core/Maths/math.color";

import type { DirectionalLightComponent } from '@fantasy-console/core/src/world/components/DirectionalLightComponent';

import { ComponentConfig } from "./ComponentConfig";

/**
 * Configuration data for a {@link DirectionalLightComponent}.
 * i.e. loaded from the raw cartridge file but not yet loaded into the game.
 */
export class DirectionalLightComponentConfig extends ComponentConfig {
  public intensity: number;
  public color: Color3;

  public constructor(intensity: number, color: Color3) {
    super();
    this.intensity = intensity;
    this.color = color;
  }
}
