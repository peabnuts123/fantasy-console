import { GameObjectData, IComposerComponentData } from "@lib/project/data";
import { ISceneMutation } from "../ISceneMutation";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";
import { isSelectableObject } from "@lib/composer/scene/components";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";

export class AddGameObjectComponentMutation implements ISceneMutation {
  // Mutation parameters
  private readonly gameObjectId: string;
  private readonly newComponent: IComposerComponentData;

  public constructor(gameObject: GameObjectData, newComponent: IComposerComponentData) {
    this.gameObjectId = gameObject.id;
    this.newComponent = newComponent;
  }

  apply({ SceneViewController }: SceneViewMutationArguments): void {
    // 1. Update data
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    gameObjectData.components.push(this.newComponent);

    // 2. Update scene
    const gameObject = gameObjectData.sceneInstance!;
    SceneViewController.createGameObjectComponent(gameObject, this.newComponent).then((component) => {
      if (component !== undefined) {
        if (isSelectableObject(component)) {
          SceneViewController.addToSelectionCache(gameObjectData, component);
        }
        gameObject.addComponent(component);
      }
    });

    // 3. Update JSONC
    const newComponentDefinition = this.newComponent.toComponentDefinition();
    const mutationPath = resolvePathForSceneObjectMutation(
      this.gameObjectId,
      SceneViewController.sceneDefinition,
      (gameObject) => gameObject.components[gameObjectData.components.length]
    );
    SceneViewController.sceneJson.mutate(mutationPath, newComponentDefinition, { isArrayInsertion: true });
  }

  undo(args: SceneViewMutationArguments): void {
    throw new Error("Method not implemented.");
  }

  get description(): string {
    return `Add ${this.newComponent.componentName} component`;
  }
}
