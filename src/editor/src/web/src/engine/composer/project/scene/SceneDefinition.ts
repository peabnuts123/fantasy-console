import { SceneObjectDefinition } from "./object";
import { Color } from "@app/engine/composer/project/util";

// @TODO rename?
export interface SceneDefinition {
  config: {
    clearColor: Color;
    lighting: {
      ambient: {
        intensity: number;
        color: Color;
      }
    }
  }
  objects: SceneObjectDefinition[];
}
