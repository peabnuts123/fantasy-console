import type { PointLightComponentData } from '@fantasy-console/runtime/src/cartridge';
import type { CartridgeArchive } from '../CartridgeArchive';
import { ColorDefinition } from "../util";
import { ComponentDefinitionBase } from "./ComponentDefinition";
import { ComponentDefinitionType } from "./ComponentDefinitionType";


/**
 * Raw point light component data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link PointLightComponentData}.
 */
export interface PointLightComponentDefinition extends ComponentDefinitionBase {
  type: ComponentDefinitionType.PointLight;
  intensity: number;
  color: ColorDefinition;
}
