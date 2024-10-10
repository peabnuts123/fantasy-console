import type { Color3 } from "@babylonjs/core/Maths/math.color";

import type { PointLightComponent } from '@fantasy-console/runtime/src/world/components';

import { ComponentData } from "./ComponentData";

/**
 * Configuration data for a {@link PointLightComponent}.
 * i.e. loaded from the raw cartridge file but not yet loaded into the game.
 */
export class PointLightComponentData extends ComponentData {
  public readonly intensity: number;
  public readonly color: Color3; // @TODO From Babylon are you sure?

  public constructor(id: string, intensity: number, color: Color3) {
    super(id);
    this.intensity = intensity;
    this.color = color;
  }
}
