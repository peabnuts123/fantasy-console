import { ComponentDefinition, ComponentDefinitionType } from "./ComponentDefinition";

import type { CartridgeArchive } from '../CartridgeArchive';
import type { DirectionalLightComponentConfig } from '../../config/components/DirectionalLightComponentConfig';

/**
 * Raw directional light component data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link DirectionalLightComponentConfig}.
 */
export interface DirectionalLightComponentDefinition extends ComponentDefinition {
  type: ComponentDefinitionType.DirectionalLight;
  intensity: number;
  color: { r: number, g: number, b: number };
}
