import { SceneObjectDefinition } from "./SceneObjectDefinition";

import type { SceneConfig } from '../config/SceneConfig';

export interface SceneAmbientLightDefinition {
  intensity: number;
  color: {
    r: number;
    g: number;
    b: number;
  };
}

/**
 * Raw game scene definition within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link SceneConfig}.
 */
export interface SceneDefinition {
  id: number;
  objects: SceneObjectDefinition[];
  ambientLight: SceneAmbientLightDefinition;
  clearColor: { r: number, g: number, b: number };
}
