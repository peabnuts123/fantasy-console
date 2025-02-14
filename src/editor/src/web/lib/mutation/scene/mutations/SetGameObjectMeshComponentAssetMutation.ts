import type { MeshComponentDefinition } from "@polyzone/runtime/src/cartridge";

import { GameObjectData, MeshComponentData } from "@lib/project/data";
import { MeshComponent } from "@lib/composer/scene";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import type { MeshAssetData } from "@lib/project/data/AssetData";
import { ISceneMutation } from "../ISceneMutation";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";

export class SetGameObjectMeshComponentAssetMutation implements ISceneMutation {
  // Mutation parameters
  private readonly gameObjectId: string;
  private readonly componentId: string;
  private readonly meshAsset: MeshAssetData | undefined;

  public constructor(gameObject: GameObjectData, component: MeshComponentData, meshAsset: MeshAssetData | undefined) {
    this.gameObjectId = gameObject.id;
    this.componentId = component.id;
    this.meshAsset = meshAsset;
  }

  apply({ SceneViewController }: SceneViewMutationArguments): void {
    // 1. Update data
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentData = gameObjectData.getComponent(this.componentId, MeshComponentData);
    // - Replace asset reference
    componentData.meshAsset = this.meshAsset;
    const componentIndex = gameObjectData.components.indexOf(componentData);

    // 2. Update babylon scene
    const gameObject = gameObjectData.sceneInstance!;
    const meshComponent = gameObject.components.find((component) => component.id === this.componentId) as MeshComponent;
    /* @NOTE async */ void SceneViewController.reinitializeComponentInstance(meshComponent, gameObjectData);

    // 3. Modify JSONC
    // - Replace ID of asset in component definition
    const updatedValue = this.meshAsset?.id ?? null;
    const mutationPath = resolvePathForSceneObjectMutation(
      this.gameObjectId,
      SceneViewController.sceneDefinition,
      (gameObject) => (gameObject.components[componentIndex] as MeshComponentDefinition).meshFileId,
    );
    SceneViewController.sceneJson.mutate(mutationPath, updatedValue);

  }
  undo(_args: SceneViewMutationArguments): void {
    throw new Error("Method not implemented.");
  }

  get description(): string {
    if (this.meshAsset !== undefined) {
      return `Change mesh asset`;
    } else {
      return `Remove mesh asset`;
    }
  }
}
