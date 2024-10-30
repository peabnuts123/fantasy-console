import { GameObjectData, IComposerComponentData } from "@lib/composer/data";
import { ISceneMutation, SceneMutationArguments } from "../ISceneMutation";
import { isSelectableObject } from "@lib/composer/scene/components";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import { GameObjectComponent } from "@fantasy-console/core";

export class RemoveGameObjectComponentMutation implements ISceneMutation {
  // Mutation parameters
  private readonly gameObjectId: string;
  private readonly componentToRemoveId: string;
  private readonly componentToRemoveName: string;

  public constructor(gameObject: GameObjectData, componentToRemove: IComposerComponentData) {
    this.gameObjectId = gameObject.id;
    this.componentToRemoveId = componentToRemove.id;
    this.componentToRemoveName = componentToRemove.componentName;
  }

  apply({ SceneViewController }: SceneMutationArguments): void {
    // 1. Update data
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentToRemoveDataIndex = gameObjectData.components.findIndex((component) => component.id === this.componentToRemoveId);
    gameObjectData.components.splice(
      componentToRemoveDataIndex,
      1
    )

    // 2. Update scene
    const gameObject = gameObjectData.sceneInstance!;
    const sceneComponent = gameObject.getComponent(this.componentToRemoveId, GameObjectComponent);
    if (isSelectableObject(sceneComponent)) {
      SceneViewController.removeFromSelectionCache(sceneComponent);
    }
    gameObject.removeComponent(this.componentToRemoveId);
    // - Update selection gizmo
    SceneViewController.selectionManager.updateGizmos();

    // 3. Update JSONC
    const mutationPath = resolvePathForSceneObjectMutation(
      this.gameObjectId,
      SceneViewController.sceneDefinition,
      (gameObject) => gameObject.components[componentToRemoveDataIndex]
    );
    SceneViewController.sceneJson.delete(mutationPath);
  }

  undo(args: SceneMutationArguments): void {
    throw new Error("Method not implemented.");
  }

  get description(): string {
    return `Remove ${this.componentToRemoveName} component`;
  }
}
