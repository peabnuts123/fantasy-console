import type { MeshComponentData } from '@polyzone/runtime/src/cartridge';

import type { CartridgeArchive } from '../CartridgeArchive';
import { ComponentDefinitionBase } from "./ComponentDefinition";
import { ComponentDefinitionType } from "./ComponentDefinitionType";


/**
 * Raw mesh component data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link MeshComponentData}.
 */
export interface MeshComponentDefinition extends ComponentDefinitionBase {
  type: ComponentDefinitionType.Mesh;
  meshFileId: string | null; // @TODO Rename to `meshAssetId`
}
