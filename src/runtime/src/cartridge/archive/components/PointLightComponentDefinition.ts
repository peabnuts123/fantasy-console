import type { CartridgeArchive } from '../CartridgeArchive';
import type { PointLightComponentConfig } from '../../config/components/PointLightComponentConfig';
import { Color } from "../util";

import { ComponentDefinition } from "./ComponentDefinition";
import { ComponentDefinitionType } from "./ComponentDefinitionType";


/**
 * Raw point light component data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link PointLightComponentConfig}.
 */
export interface PointLightComponentDefinition extends ComponentDefinition {
  type: ComponentDefinitionType.PointLight;
  intensity: number;
  color: Color;
}
