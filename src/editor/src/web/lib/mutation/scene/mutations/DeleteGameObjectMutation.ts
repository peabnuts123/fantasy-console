import { GameObjectData } from "@lib/composer/data";
import { ISceneMutation } from '../ISceneMutation';
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";

export class DeleteGameObjectMutation implements ISceneMutation {
  // Mutation state
  private readonly gameObjectId: string;
  private readonly gameObjectName: string;

  public constructor(gameObject: GameObjectData) {
    this.gameObjectId = gameObject.id;
    this.gameObjectName = gameObject.name;
  }

  apply({ SceneViewController }: SceneViewMutationArguments): void {
    // Find object's parent - we're going to remove the object from the parent's children
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const gameObjectParentData = SceneViewController.scene.getGameObjectParent(this.gameObjectId);

    // 1. Update Data
    if (gameObjectParentData === undefined) {
      // Top-level object
      SceneViewController.scene.objects = SceneViewController.scene.objects.filter((object) => object.id !== this.gameObjectId);
    } else {
      // Child object
      gameObjectParentData.children = gameObjectParentData.children.filter((object) => object.id !== this.gameObjectId);
    }

    // 2. Update Scene
    const gameObject = gameObjectData.sceneInstance!;
    gameObject.transform.parent = undefined;
    gameObject.destroy();
    if (SceneViewController.selectionManager.selectedObject === gameObjectData) {
      SceneViewController.selectionManager.deselectAll();
    }

    // 3. Update JSONC
    const mutationPath = resolvePathForSceneObjectMutation(
      this.gameObjectId,
      SceneViewController.sceneDefinition,
    );
    SceneViewController.sceneJson.delete(mutationPath);
  }

  undo({ }: SceneViewMutationArguments): void {
    throw new Error("Method not implemented.");
  }

  get description(): string {
    return `Delete '${this.gameObjectName}'`;
  }
}