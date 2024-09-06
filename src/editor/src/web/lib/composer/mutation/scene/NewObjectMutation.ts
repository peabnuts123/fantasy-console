import { v4 as uuid } from 'uuid';

import { ComponentDefinitionType, MeshComponentDefinition, SceneObjectDefinition } from "@fantasy-console/runtime/src/cartridge";

import { loadObjectDefinition } from "@lib/composer/config/loadObjectDefinition";
import { ISceneMutation, SceneMutationArguments } from "../ISceneMutation";

export class NewObjectMutation implements ISceneMutation {
  apply({ SceneView, ProjectController }: SceneMutationArguments): void {
    // Create new object
    let newObjectDefinition: SceneObjectDefinition = {
      id: uuid(),
      name: "Ball",
      transform: {
        position: {
          x: 0,
          y: 2,
          z: 0,
        },
      },
      children: [],
      components: [
        {
          type: ComponentDefinitionType.Mesh,
          meshFileId: 'dba91ca4-6ab9-4336-ac9b-b758e59e881e',
        } satisfies MeshComponentDefinition as MeshComponentDefinition
      ]
    };
    const newGameObject = loadObjectDefinition(newObjectDefinition, ProjectController.assetDb);

    // 1. Add to config state
    SceneView.scene.objects.push(newGameObject);

    // 2. Add to babylon scene
    SceneView.createSceneObject(newGameObject);

    // 3. Modify JSONC
    SceneView.sceneJson.mutate((scene) => scene.objects[SceneView.scene.objects.length], newObjectDefinition, { isArrayInsertion: true });
  }

  undo({ }: SceneMutationArguments): void {
    throw new Error("Method not implemented.");
  }
}