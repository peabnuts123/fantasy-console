import { ComponentDefinitionType } from "./ComponentDefinitionType";

/**
 * Raw game object component data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link ComponentConfig}.
 */
export interface ComponentDefinition {
  type: ComponentDefinitionType;
}
