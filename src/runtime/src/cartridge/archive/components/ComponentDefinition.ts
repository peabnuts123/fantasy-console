import type { ComponentData } from '@fantasy-console/runtime/src/cartridge';

import type { CartridgeArchive } from '../CartridgeArchive';
import { ComponentDefinitionType } from "./ComponentDefinitionType";

/**
 * Raw game object component data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link ComponentData}.
 */
export interface ComponentDefinition {
  id: string;
  type: ComponentDefinitionType;
}
