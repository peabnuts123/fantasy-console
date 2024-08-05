import { SceneObjectMeshComponentDefinition } from "./SceneObjectMeshComponentDefinition";
import { SceneObjectScriptComponentDefinition } from "./SceneObjectScriptComponentDefinition";
import { SceneObjectDirectionalLightComponentDefinition } from "./SceneObjectDirectionalLightComponentDefinition";

export type SceneObjectComponentDefinition =
  SceneObjectMeshComponentDefinition |
  SceneObjectScriptComponentDefinition |
  SceneObjectDirectionalLightComponentDefinition;
