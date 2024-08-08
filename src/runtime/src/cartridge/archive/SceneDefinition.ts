import type { SceneConfig } from '../config';

import type { CartridgeArchive } from './CartridgeArchive';
import { SceneObjectDefinition } from "./SceneObjectDefinition";
import { Color } from "./util";


/**
 * Raw game scene definition within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link SceneConfig}.
 */
export interface SceneDefinition {
  path: string;
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
