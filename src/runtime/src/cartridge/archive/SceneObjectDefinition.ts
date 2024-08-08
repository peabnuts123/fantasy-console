import type { GameObjectConfig } from '../config'

import type { CartridgeArchive } from './CartridgeArchive';
import { ComponentDefinition } from "./components";
import { Vector3 } from "./util";

/**
 * Raw game object data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link GameObjectConfig}.
 */
export interface SceneObjectDefinition {
  id: string;
  name: string;
  transform: {
    position: Vector3;
    // rotation: number; // @TODO
  }
  components: ComponentDefinition[];
  children: SceneObjectDefinition[] | undefined;
}