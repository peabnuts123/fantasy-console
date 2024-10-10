import type { MeshAssetData, MeshComponentDefinition } from "@fantasy-console/runtime/src/cartridge";
import { GameObjectData, MeshComponentData } from "@lib/composer/data";
import { ISceneMutation, SceneMutationArguments } from "../ISceneMutation";
import { MeshComponent } from "@lib/composer/scene";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";

export class SetGameObjectMeshComponentAssetMutation implements ISceneMutation {
  // Mutation parameters
  private readonly gameObjectId: string;
  private readonly componentId: string;
  private readonly meshAsset: MeshAssetData;

  public constructor(gameObject: GameObjectData, component: MeshComponentData, meshAsset: MeshAssetData) {
    this.gameObjectId = gameObject.id;
    this.componentId = component.id;
    this.meshAsset = meshAsset;
  }

  apply({ SceneViewController }: SceneMutationArguments): void {
    // 1. Update config state
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentData = gameObjectData.getComponent(this.componentId, MeshComponentData);
    // - Replace mesh asset reference
    componentData.meshAsset = this.meshAsset;
    const componentIndex = gameObjectData.components.indexOf(componentData);

    // 2. Update babylon scene
    const gameObject = gameObjectData.sceneInstance!;
    const oldMeshComponent = gameObject.components[componentIndex] as MeshComponent;
    // - Remove from selection cache
    SceneViewController.removeFromSelectionCache(oldMeshComponent);
    // - Cull old assets
    oldMeshComponent.onDestroy();
    // - Load new assets
    SceneViewController.loadAssetCached(this.meshAsset).then((newAssetContainer) => {
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
    // - Replace ID of mesh asset in component definition
    const updatedValue = this.meshAsset.id;
    const mutationPath = resolvePathForSceneObjectMutation(
      this.gameObjectId,
      SceneViewController.sceneDefinition,
      (gameObject) => (gameObject.components[componentIndex] as MeshComponentDefinition).meshFileId
    );
    SceneViewController.sceneJson.mutate(mutationPath, updatedValue);

  }
  undo(args: SceneMutationArguments): void {
    throw new Error("Method not implemented.");
  }

  get description(): string {
    return `Change mesh asset`
  }
}
