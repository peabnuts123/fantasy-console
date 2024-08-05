import { SceneObjectComponentDefinitionBase } from "./SceneObjectComponentDefinitionBase";
import { SceneObjectComponentType } from "./SceneObjectComponentType";

export interface SceneObjectScriptComponentDefinition extends SceneObjectComponentDefinitionBase {
  type: SceneObjectComponentType.Script;
  scriptFileId: string;
}
