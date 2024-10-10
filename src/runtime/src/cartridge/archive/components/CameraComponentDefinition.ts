import type { CameraComponentData } from '@fantasy-console/runtime/src/cartridge';

import type { CartridgeArchive } from '../CartridgeArchive';

import { ComponentDefinition } from "./ComponentDefinition";
import { ComponentDefinitionType } from "./ComponentDefinitionType";


/**
 * Raw camera component data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link CameraComponentData}.
 */
export interface CameraComponentDefinition extends ComponentDefinition {
  type: ComponentDefinitionType.Camera;
  // FOV ?
}
