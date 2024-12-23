import { JsoncContainer } from "@lib/util/JsoncContainer";
import { SceneDefinition } from "@lib/project/definition/scene/SceneDefinition";
import { SceneManifest } from "../definition";

/**
 * Container for scene data loaded from disk before
 * being parsed into anything like `SceneData`.
 * Passed as a reference to new SceneView tabs
 */
export interface RawSceneData {
  jsonc: JsoncContainer<SceneDefinition>;
  manifest: SceneManifest
}
