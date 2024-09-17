import { Vector3 as Vector3Archive } from "@fantasy-console/runtime/src/cartridge/archive/util";
import { Vector3 } from "@fantasy-console/core/src/util";

import { GameObjectConfigComposer } from "@lib/composer/config";
import { ISceneMutation, SceneMutationArguments } from "../ISceneMutation";
import { IContinuousSceneMutation } from "../IContinuousSceneMutation";

export interface SetGameObjectPositionMutationUpdateArgs {
  position: Vector3;
}

export class SetGameObjectPositionMutation implements ISceneMutation, IContinuousSceneMutation<SetGameObjectPositionMutationUpdateArgs> {
  // State
  // @TODO should we look you up by ID or something?
  private readonly gameObject: GameObjectConfigComposer;
  private position: Vector3;

  // Undo state
  private configPosition: Vector3 | undefined = undefined;
  private scenePosition: Vector3 | undefined = undefined;


  public constructor(gameObject: GameObjectConfigComposer) {
    this.gameObject = gameObject;
    this.position = gameObject.transform.position;
  }

  begin(_args: SceneMutationArguments): void {
    // - Store undo values
    this.configPosition = this.gameObject.transform.position;
    this.scenePosition = this.gameObject.sceneInstance!.transform.position;
  }

  update(_args: SceneMutationArguments, { position }: SetGameObjectPositionMutationUpdateArgs): void {
    this.position = position
    // - 1. Config state
    this.gameObject.transform.position = position;
    // - 2. Babylon state
    this.gameObject.sceneInstance!.transform.position = position;
  }

  apply({ SceneViewController }: SceneMutationArguments): void {
    // - 3. JSONC
    const sceneIndex = SceneViewController.scene.objects.findIndex((object) => object.id === this.gameObject.id);
    const updatedValue: Vector3Archive = {
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
    };
    SceneViewController.sceneJson.mutate((scene) => scene.objects[sceneIndex].transform.position, updatedValue);
  }

  undo(args: SceneMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  get description(): string {
    return `Move '${this.gameObject.name}'`;
  }
}