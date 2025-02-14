import { Vector3Definition as ArchiveVector3 } from "@polyzone/runtime/src/cartridge/archive/util";
import { Vector3 } from "@polyzone/core/src/util";

import { GameObjectData } from "@lib/project/data";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import { ISceneMutation } from "../ISceneMutation";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";
import { IContinuousSceneMutation } from "../IContinuousSceneMutation";

export interface SetGameObjectRotationMutationUpdateArgs {
  rotation: Vector3;
  resetGizmo?: boolean;
}

export class SetGameObjectRotationMutation implements ISceneMutation, IContinuousSceneMutation<SetGameObjectRotationMutationUpdateArgs> {
  // State
  // @TODO should we look you up by ID or something?
  private readonly gameObject: GameObjectData;
  private rotation: Vector3;
  private _hasBeenApplied: boolean = false;

  // Undo state
  private configRotation: Vector3 | undefined = undefined;
  private sceneRotation: Vector3 | undefined = undefined;


  public constructor(gameObject: GameObjectData) {
    this.gameObject = gameObject;
    this.rotation = gameObject.transform.rotation;
  }

  begin(_args: SceneViewMutationArguments): void {
    // - Store undo values
    this.configRotation = this.gameObject.transform.rotation;
    this.sceneRotation = this.gameObject.sceneInstance!.transform.rotation;
  }

  update({ SceneViewController }: SceneViewMutationArguments, { rotation, resetGizmo }: SetGameObjectRotationMutationUpdateArgs): void {
    this.rotation = rotation;
    // - 1. Update Data
    this.gameObject.transform.rotation = rotation;
    // - 2. Update Scene
    this.gameObject.sceneInstance!.transform.localRotation = rotation;
    if (resetGizmo) {
      SceneViewController.selectionManager.updateGizmos();
    }
  }

  apply({ SceneViewController }: SceneViewMutationArguments): void {
    // - 3. Update JSONC
    const updatedValue: ArchiveVector3 = {
      x: this.rotation.x,
      y: this.rotation.y,
      z: this.rotation.z,
    };
    const mutationPath = resolvePathForSceneObjectMutation(this.gameObject.id, SceneViewController.sceneDefinition, (gameObject) => gameObject.transform.rotation);
    SceneViewController.sceneJson.mutate(mutationPath, updatedValue);
  }

  undo(_args: SceneViewMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  get description(): string {
    return `Rotate '${this.gameObject.name}'`;
  }

  public get hasBeenApplied(): boolean { return this._hasBeenApplied; }
  public set hasBeenApplied(value: boolean) { this._hasBeenApplied = value; }
}
