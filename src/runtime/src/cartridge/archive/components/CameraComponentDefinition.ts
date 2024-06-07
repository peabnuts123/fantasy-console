import { ComponentDefinition, ComponentDefinitionType } from "./ComponentDefinition";

import { CartridgeArchive } from '../CartridgeArchive';
import type { CameraComponentConfig } from '../../config/components/CameraComponentConfig';

/**
 * Raw camera component data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link CameraComponentConfig}.
 */
export interface CameraComponentDefinition extends ComponentDefinition {
  type: ComponentDefinitionType.Camera;
  // FOV ?
}
