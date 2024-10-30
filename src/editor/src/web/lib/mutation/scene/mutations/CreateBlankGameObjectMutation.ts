import { v4 as uuid } from 'uuid';

import { GameObjectDefinition } from "@fantasy-console/runtime/src/cartridge";

import { loadObjectDefinition } from "@lib/composer/data";
import { ISceneMutation, SceneMutationArguments } from '../ISceneMutation';

export class CreateBlankGameObjectMutation implements ISceneMutation {
  apply({ SceneViewController, ProjectController }: SceneMutationArguments): void {
    // Create new object
    let newObjectDefinition: GameObjectDefinition = {
      id: uuid(),
      name: "New Object",
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      children: [],
      components: [],
    };
    const newGameObject = loadObjectDefinition(newObjectDefinition, ProjectController.assetDb);

    // 1. Update Data
    SceneViewController.scene.objects.push(newGameObject);

    // 2. Update Scene
    SceneViewController.createGameObject(newGameObject);

    // 3. Update JSONC
    SceneViewController.sceneJson.mutate((scene) => scene.objects[SceneViewController.sceneDefinition.objects.length], newObjectDefinition, { isArrayInsertion: true });
  }

  undo({ }: SceneMutationArguments): void {
    throw new Error("Method not implemented.");
  }

  get description(): string {
    return `Create new object`;
  }
}