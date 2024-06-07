import { ComponentDefinition } from "./components/ComponentDefinition";

/**
 * Raw game object data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link GameObjectConfig}.
 */
export interface SceneObjectDefinition {
  id: number;
  position: { x: number, y: number, z: number };
  rotation: number;
  components: ComponentDefinition[];
}