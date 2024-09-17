import { Vector3 as ArchiveVector3 } from "@fantasy-console/runtime/src/cartridge/archive/util";
import { Vector3 } from "@fantasy-console/core/src/util";

import { GameObjectConfigComposer } from "@lib/composer/config";
import { ISceneMutation, SceneMutationArguments } from "../ISceneMutation";
import { IContinuousSceneMutation } from "../IContinuousSceneMutation";

export interface SetGameObjectScaleMutationUpdateArgs {
  scaleDelta: Vector3;
}

export class SetGameObjectScaleMutation implements ISceneMutation, IContinuousSceneMutation<SetGameObjectScaleMutationUpdateArgs> {
  // State
  // @TODO should we look you up by ID or something?
  private readonly gameObject: GameObjectConfigComposer;
  private scale: Vector3;

  // Undo state
  private configScale: Vector3 | undefined = undefined;
  private sceneScale: Vector3 | undefined = undefined;


  public constructor(gameObject: GameObjectConfigComposer) {
    this.gameObject = gameObject;
    this.scale = gameObject.transform.scale;
  }

  begin(_args: SceneMutationArguments): void {
    // - Store undo values
    this.configScale = this.gameObject.transform.scale;
    this.sceneScale = this.gameObject.sceneInstance!.transform.scale;
  }

  update(_args: SceneMutationArguments, { scaleDelta }: SetGameObjectScaleMutationUpdateArgs): void {
    this.scale.multiplySelf(scaleDelta);
    // - 1. Config state
    this.gameObject.transform.scale.multiplySelf(scaleDelta);
    // - 2. Babylon state
    this.gameObject.sceneInstance!.transform.scale.multiplySelf(scaleDelta);
  }

  apply({ SceneViewController }: SceneMutationArguments): void {
    // - 3. JSONC
    const sceneIndex = SceneViewController.scene.objects.findIndex((object) => object.id === this.gameObject.id);
    const updatedValue: ArchiveVector3 = {
      x: this.scale.x,
      y: this.scale.y,
      z: this.scale.z,
    };
    SceneViewController.sceneJson.mutate((scene) => scene.objects[sceneIndex].transform.scale, updatedValue);
  }

  undo(args: SceneMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  get description(): string {
    return `Scale '${this.gameObject.name}'`;
  }
}