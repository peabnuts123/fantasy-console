import type { DirectionalLightComponentConfig } from '../../config/components/DirectionalLightComponentConfig';
import type { CartridgeArchive } from '../CartridgeArchive';
import { Color } from "../util";

import { ComponentDefinition } from "./ComponentDefinition";
import { ComponentDefinitionType } from "./ComponentDefinitionType";


/**
 * Raw directional light component data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link DirectionalLightComponentConfig}.
 */
export interface DirectionalLightComponentDefinition extends ComponentDefinition {
  type: ComponentDefinitionType.DirectionalLight;
  intensity: number;
  color: Color;
}
