import { Vector3 as ArchiveVector3 } from "@fantasy-console/runtime/src/cartridge/archive/util";
import { Vector3 } from "@fantasy-console/core/src/util";

import { GameObjectConfigComposer } from "@lib/composer/config";
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
    const sceneIndex = SceneViewController.scene.objects.findIndex((object) => object.id === this.gameObject.id);
    const updatedValue: ArchiveVector3 = {
      x: this.rotation.x,
      y: this.rotation.y,
      z: this.rotation.z,
    };
    SceneViewController.sceneJson.mutate((scene) => scene.objects[sceneIndex].transform.rotation, updatedValue);
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