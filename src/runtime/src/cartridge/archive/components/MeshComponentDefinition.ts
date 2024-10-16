import type { MeshComponentData } from '@fantasy-console/runtime/src/cartridge';

import type { CartridgeArchive } from '../CartridgeArchive';
import { ComponentDefinition } from "./ComponentDefinition";
import { ComponentDefinitionType } from "./ComponentDefinitionType";


/**
 * Raw mesh component data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link MeshComponentData}.
 */
export interface MeshComponentDefinition extends ComponentDefinition {
  type: ComponentDefinitionType.Mesh;
  meshFileId?: string; // @TODO Rename to `meshAssetId`
}
