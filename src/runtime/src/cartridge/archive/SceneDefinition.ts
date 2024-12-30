import type { SceneData } from '@fantasy-console/runtime/src/cartridge';

import type { CartridgeArchive } from './CartridgeArchive';
import { GameObjectDefinition } from "./GameObjectDefinition";
import { ColorDefinition } from "./util";


/**
 * Raw game scene definition within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link SceneData}.
 */
export interface SceneDefinition {
  path: string;
  config: {
    clearColor: ColorDefinition;
    lighting: {
      ambient: {
        intensity: number;
        color: ColorDefinition;
      }
    }
  }
  objects: GameObjectDefinition[];
}
