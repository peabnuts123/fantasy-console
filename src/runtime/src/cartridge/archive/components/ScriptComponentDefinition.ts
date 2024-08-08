import type { CartridgeArchive } from '../CartridgeArchive';
import type { ScriptComponentConfig } from '../../config/components/ScriptComponentConfig';

import { ComponentDefinition } from "./ComponentDefinition";
import { ComponentDefinitionType } from "./ComponentDefinitionType";


/**
 * Raw script component data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link ScriptComponentConfig}.
 */
export interface ScriptComponentDefinition extends ComponentDefinition {
  type: ComponentDefinitionType.Script;
  scriptFileId: string;
}
