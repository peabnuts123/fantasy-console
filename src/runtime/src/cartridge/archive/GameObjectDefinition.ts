import type { GameObjectData } from '@fantasy-console/runtime/src/cartridge'

import type { CartridgeArchive } from './CartridgeArchive';
import { ComponentDefinition } from "./components";
import { Vector3Definition } from "./util";

/**
 * Raw game object data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link GameObjectData}.
 */
export interface GameObjectDefinition {
  id: string;
  name: string;
  transform: {
    position: Vector3Definition;
    rotation: Vector3Definition;
    scale: Vector3Definition;
  }
  components: ComponentDefinition[]; // @TODO Should probably be nullable too - everything should kind of be nullable TBH
  children: GameObjectDefinition[] | undefined;
}