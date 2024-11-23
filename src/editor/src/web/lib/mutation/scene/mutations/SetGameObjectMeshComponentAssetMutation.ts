import { AssetContainer } from "@babylonjs/core/assetContainer";

import type { MeshAssetData, MeshComponentDefinition } from "@fantasy-console/runtime/src/cartridge";

import { GameObjectData, MeshComponentData } from "@lib/composer/data";
import { MeshComponent } from "@lib/composer/scene";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
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
    const oldMeshComponent = gameObject.components.find((component) => component.id === this.componentId) as MeshComponent;
    // - Remove from selection cache
    SceneViewController.removeFromSelectionCache(oldMeshComponent);
    // - Cull old assets
    oldMeshComponent.onDestroy();
    // - Load new assets (if applicable)
    let meshAssetPromise: Promise<AssetContainer>;
    if (this.meshAsset !== undefined) {
      // @NOTE Setting mesh to a defined value
      meshAssetPromise = SceneViewController.loadAssetCached(this.meshAsset)
    } else {
      meshAssetPromise = Promise.resolve(new AssetContainer());
    }

    meshAssetPromise.then((newAssetContainer) => {
      const newMeshComponent = new MeshComponent(componentData.id, gameObject, newAssetContainer);
      // - Add to selection cache
      SceneViewController.addToSelectionCache(gameObjectData, newMeshComponent);
      // - Replace old component
      gameObjectData.sceneInstance!.components[componentIndex] = newMeshComponent;
      componentData.componentInstance = newMeshComponent;
      // - Update selection gizmo
      SceneViewController.selectionManager.updateGizmos();
    });

    // 3. Modify JSONC
    // - Replace ID of asset in component definition
    const updatedValue = this.meshAsset?.id ?? null;
    const mutationPath = resolvePathForSceneObjectMutation(
      this.gameObjectId,
      SceneViewController.sceneDefinition,
      (gameObject) => (gameObject.components[componentIndex] as MeshComponentDefinition).meshFileId
    );
    SceneViewController.sceneJson.mutate(mutationPath, updatedValue);

  }
  undo(args: SceneViewMutationArguments): void {
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
