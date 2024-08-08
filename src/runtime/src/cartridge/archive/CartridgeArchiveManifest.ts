import type { CartridgeArchive } from './CartridgeArchive';

import { AssetDefinition } from "./AssetDefinition";
import { SceneDefinition } from "./SceneDefinition";

/**
 * The raw manifest of a {@link CartridgeArchive} containing all the content in the Cartridge.
 * i.e. the definition of the Cartridge on-disk, before being loaded by the engine.
 */
export interface CartridgeArchiveManifest {
  // @TODO any metadata like THE TITLE OF THE GAME? Lol
  scenes: SceneDefinition[];
  assets: AssetDefinition[];
}