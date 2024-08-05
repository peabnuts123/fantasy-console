import { SceneObjectComponentDefinitionBase } from "./SceneObjectComponentDefinitionBase";
import { SceneObjectComponentType } from "./SceneObjectComponentType";

import { Color } from '@app/engine/composer/project/util';

export interface SceneObjectDirectionalLightComponentDefinition extends SceneObjectComponentDefinitionBase {
  type: SceneObjectComponentType.DirectionalLight;
  intensity: number;
  color: Color
}
