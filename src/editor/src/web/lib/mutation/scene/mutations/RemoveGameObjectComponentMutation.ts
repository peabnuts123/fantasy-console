import { GameObjectComponent } from "@fantasy-console/core";
import { CameraComponentData, GameObjectData, IComposerComponentData, MeshComponentData, ScriptComponentData } from "@lib/project/data";
import { isSelectableObject } from "@lib/composer/scene/components";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import { ISceneMutation } from "../ISceneMutation";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";

// Constants
/** Certain components aren't instantiated in the composer and need to be ignored */
const ComponentTypesThatDontExistInTheComposer = [
  CameraComponentData,
  ScriptComponentData,
];

export class RemoveGameObjectComponentMutation implements ISceneMutation {
  // Mutation parameters
  private readonly gameObjectId: string;
  private readonly componentToRemove: IComposerComponentData;

  public constructor(gameObject: GameObjectData, componentToRemove: IComposerComponentData) {
    this.gameObjectId = gameObject.id;
    this.componentToRemove = componentToRemove;
  }

  apply({ SceneViewController }: SceneViewMutationArguments): void {
    // 1. Update data
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentToRemoveDataIndex = gameObjectData.components.findIndex((component) => component.id === this.componentToRemove.id);
    gameObjectData.components.splice(
      componentToRemoveDataIndex,
      1,
    );

    // 2. Update scene
    // @NOTE Don't need to update scene for certain types (since they aren't instantiated in the composer)
    if (!ComponentTypesThatDontExistInTheComposer.some((Type) => this.componentToRemove instanceof Type)) {
      const gameObject = gameObjectData.sceneInstance!;
      const sceneComponent = gameObject.getComponent(this.componentToRemove.id, GameObjectComponent);
      if (isSelectableObject(sceneComponent)) {
        SceneViewController.removeFromSelectionCache(sceneComponent);
      }
      gameObject.removeComponent(this.componentToRemove.id);

      // - Update selection gizmo if component was a mesh
      if (this.componentToRemove instanceof MeshComponentData) {
        SceneViewController.selectionManager.updateGizmos();
      }
    }

    // 3. Update JSONC
    const mutationPath = resolvePathForSceneObjectMutation(
      this.gameObjectId,
      SceneViewController.sceneDefinition,
      (gameObject) => gameObject.components[componentToRemoveDataIndex],
    );
    SceneViewController.sceneJson.delete(mutationPath);
  }

  undo(_args: SceneViewMutationArguments): void {
    throw new Error("Method not implemented.");
  }

  get description(): string {
    return `Remove ${this.componentToRemove.componentName} component`;
  }
}
