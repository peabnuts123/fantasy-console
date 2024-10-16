import { v4 as uuid } from 'uuid';

import { ComponentDefinitionType, MeshComponentDefinition, GameObjectDefinition } from "@fantasy-console/runtime/src/cartridge";

import { loadObjectDefinition } from "@lib/composer/data";
import { ISceneMutation, SceneMutationArguments } from '../ISceneMutation';

export class NewObjectMutation implements ISceneMutation {
  apply({ SceneViewController, ProjectController }: SceneMutationArguments): void {
    // Create new object
    let newObjectDefinition: GameObjectDefinition = {
      id: uuid(),
      name: "Ball",
      transform: {
        position: {
          x: 0,
          y: 2,
          z: 0,
        },
        rotation: {
          x: 0,
          y: 0,
          z: 0
        },
        scale: {
          x: 1,
          y: 1,
          z: 1
        }
      },
      children: [],
      components: [
        {
          id: uuid(),
          type: ComponentDefinitionType.Mesh,
          meshFileId: 'dba91ca4-6ab9-4336-ac9b-b758e59e881e',
        } satisfies MeshComponentDefinition as MeshComponentDefinition
      ]
    };
    const newGameObject = loadObjectDefinition(newObjectDefinition, ProjectController.assetDb);

    // 1. Add to config state
    SceneViewController.scene.objects.push(newGameObject);

    // 2. Add to babylon scene
    SceneViewController.createGameObject(newGameObject);

    // 3. Modify JSONC
    SceneViewController.sceneJson.mutate((scene) => scene.objects[SceneViewController.scene.objects.length], newObjectDefinition, { isArrayInsertion: true });
  }

  undo({ }: SceneMutationArguments): void {
    throw new Error("Method not implemented.");
  }

  get description(): string {
    return `(Debug) Create object`
  }
}