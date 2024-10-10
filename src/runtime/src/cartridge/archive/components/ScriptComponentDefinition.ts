import type { ScriptComponentData } from '@fantasy-console/runtime/src/cartridge';
import type { CartridgeArchive } from '../CartridgeArchive';
import { ComponentDefinition } from "./ComponentDefinition";
import { ComponentDefinitionType } from "./ComponentDefinitionType";


/**
 * Raw script component data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link ScriptComponentData}.
 */
export interface ScriptComponentDefinition extends ComponentDefinition {
  type: ComponentDefinitionType.Script;
  scriptFileId: string;
}
