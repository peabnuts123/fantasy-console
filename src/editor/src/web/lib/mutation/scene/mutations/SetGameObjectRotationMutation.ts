import { Vector3 as ArchiveVector3 } from "@fantasy-console/runtime/src/cartridge/archive/util";
import { Vector3 } from "@fantasy-console/core/src/util";

import { GameObjectConfigComposer } from "@lib/composer/config";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import { ISceneMutation, SceneMutationArguments } from "../ISceneMutation";
import { IContinuousSceneMutation } from "../IContinuousSceneMutation";

export interface SetGameObjectRotationMutationUpdateArgs {
  rotation: Vector3;
}

export class SetGameObjectRotationMutation implements ISceneMutation, IContinuousSceneMutation<SetGameObjectRotationMutationUpdateArgs> {
  // State
  // @TODO should we look you up by ID or something?
  private readonly gameObject: GameObjectConfigComposer;
  private rotation: Vector3;
  private _hasBeenApplied: boolean = false;

  // Undo state
  private configRotation: Vector3 | undefined = undefined;
  private sceneRotation: Vector3 | undefined = undefined;


  public constructor(gameObject: GameObjectConfigComposer) {
    this.gameObject = gameObject;
    this.rotation = gameObject.transform.rotation;
  }

  begin(_args: SceneMutationArguments): void {
    // - Store undo values
    this.configRotation = this.gameObject.transform.rotation;
    this.sceneRotation = this.gameObject.sceneInstance!.transform.rotation;
  }

  update({ SceneViewController }: SceneMutationArguments, { rotation }: SetGameObjectRotationMutationUpdateArgs): void {
    this.rotation = rotation;
    // - 1. Config state
    this.gameObject.transform.rotation = rotation;
    // - 2. Babylon state
    this.gameObject.sceneInstance!.transform.rotation = rotation;
    SceneViewController.selectionManager.updateGizmos();
  }

  apply({ SceneViewController }: SceneMutationArguments): void {
    // - 3. JSONC
    const updatedValue: ArchiveVector3 = {
      x: this.rotation.x,
      y: this.rotation.y,
      z: this.rotation.z,
    };
    const mutationPath = resolvePathForSceneObjectMutation(this.gameObject.id, SceneViewController.scene, (gameObject) => gameObject.transform.rotation);
    SceneViewController.sceneJson.mutate(mutationPath, updatedValue);
  }

  undo(args: SceneMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  get description(): string {
    return `Rotate '${this.gameObject.name}'`;
  }

  public get hasBeenApplied() { return this._hasBeenApplied; }
  public set hasBeenApplied(value: boolean) { this._hasBeenApplied = value; }
}