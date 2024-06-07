import { CartridgeArchiveFileReference } from "./CartridgeArchiveFileReference";
import { SceneDefinition } from "./SceneDefinition";

/**
 * The raw manifest of a {@link CartridgeArchive} containing all the content in the Cartridge.
 * i.e. the definition of the Cartridge on-disk, before being loaded by the engine.
 */
export interface CartridgeArchiveManifest {
  scenes: SceneDefinition[];
  files: CartridgeArchiveFileReference[];
}