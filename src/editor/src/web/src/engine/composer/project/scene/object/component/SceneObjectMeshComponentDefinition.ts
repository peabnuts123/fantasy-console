import { SceneObjectComponentDefinitionBase } from "./SceneObjectComponentDefinitionBase";
import { SceneObjectComponentType } from "./SceneObjectComponentType";

export interface SceneObjectMeshComponentDefinition extends SceneObjectComponentDefinitionBase {
  type: SceneObjectComponentType.Mesh;
  meshFileId: string;
}
