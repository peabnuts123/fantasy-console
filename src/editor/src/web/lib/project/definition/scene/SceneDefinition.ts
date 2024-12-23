import { SceneDefinition as RuntimeSceneDefinition } from "@fantasy-console/runtime/src/cartridge";

// @NOTE In the editor, `path` comes from the scene's location on disk
// It is not stored as a property on the scene definition.
export type SceneDefinition = Omit<RuntimeSceneDefinition, 'path'>;

/** Convert an editor scene definition to a runtime scene definition by setting its path */
export function toRuntimeSceneDefinition(sceneDefinition: SceneDefinition, path: string): RuntimeSceneDefinition {
  return {
    ...sceneDefinition,
    path,
  };
}
