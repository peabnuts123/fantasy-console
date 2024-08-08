import type { CartridgeArchive } from '../CartridgeArchive';
import type { MeshComponentConfig } from '../../config/components/MeshComponentConfig';

import { ComponentDefinition } from "./ComponentDefinition";
import { ComponentDefinitionType } from "./ComponentDefinitionType";


/**
 * Raw mesh component data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link MeshComponentConfig}.
 */
export interface MeshComponentDefinition extends ComponentDefinition {
  type: ComponentDefinitionType.Mesh;
  meshFileId: string;
}
