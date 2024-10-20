import type { ScriptAssetData, ScriptComponentDefinition } from "@fantasy-console/runtime/src/cartridge";

import { GameObjectData, ScriptComponentData } from "@lib/composer/data";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import { ISceneMutation, SceneMutationArguments } from "../ISceneMutation";

export class SetGameObjectScriptComponentAssetMutation implements ISceneMutation {
  // Mutation parameters
  private readonly gameObjectId: string;
  private readonly componentId: string;
  private readonly scriptAsset: ScriptAssetData | undefined;

  public constructor(gameObject: GameObjectData, component: ScriptComponentData, scriptAsset: ScriptAssetData | undefined) {
    this.gameObjectId = gameObject.id;
    this.componentId = component.id;
    this.scriptAsset = scriptAsset;
  }

  apply({ SceneViewController }: SceneMutationArguments): void {
    // 1. Update data
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentData = gameObjectData.getComponent(this.componentId, ScriptComponentData);
    // - Replace asset reference
    componentData.scriptAsset = this.scriptAsset;
    const componentIndex = gameObjectData.components.indexOf(componentData);

    // 2. Update babylon scene
    // @NOTE No need to do anything - script components are not loaded in the composer

    // 3. Modify JSONC
    // - Replace ID of asset in component definition
    const updatedValue = this.scriptAsset?.id ?? null;
    const mutationPath = resolvePathForSceneObjectMutation(
      this.gameObjectId,
      SceneViewController.sceneDefinition,
      (gameObject) => (gameObject.components[componentIndex] as ScriptComponentDefinition).scriptFileId
    );
    SceneViewController.sceneJson.mutate(mutationPath, updatedValue);

  }
  undo(args: SceneMutationArguments): void {
    throw new Error("Method not implemented.");
  }

  get description(): string {
    if (this.scriptAsset !== undefined) {
      return `Change script asset`;
    } else {
      return `Remove script asset`;
    }
  }
}
