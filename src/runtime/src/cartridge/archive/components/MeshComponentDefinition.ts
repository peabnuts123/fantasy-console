import { ComponentDefinition, ComponentDefinitionType } from "./ComponentDefinition";

import { CartridgeArchive } from '../CartridgeArchive';
import type { MeshComponentConfig } from '../../config/components/MeshComponentConfig';

/**
 * Raw mesh component data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link MeshComponentConfig}.
 */
export interface MeshComponentDefinition extends ComponentDefinition {
  type: ComponentDefinitionType.Mesh;
  meshFileId: number;
}
