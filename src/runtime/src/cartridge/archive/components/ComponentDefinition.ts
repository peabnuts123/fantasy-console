/* @TODO space these out like 100, 200, etc. */
export enum ComponentDefinitionType {
  Mesh = 0,
  Script = 1,
  Camera = 2,
  DirectionalLight = 3,
  PointLight = 4,
}

/**
 * Raw game object component data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link ComponentConfig}.
 */
export interface ComponentDefinition {
  type: ComponentDefinitionType;
}
