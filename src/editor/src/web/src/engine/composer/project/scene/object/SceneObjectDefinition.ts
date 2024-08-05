import { SceneObjectComponentDefinition } from "./component";
import { Vector3 } from "@app/engine/composer/project/util";


// @TODO rename?
export interface SceneObjectDefinition {
  id: string;
  name: string;
  transform: {
    position: Vector3;
  },
  components: SceneObjectComponentDefinition[];
}
