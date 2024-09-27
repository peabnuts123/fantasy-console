import { Vector3 as ArchiveVector3 } from "@fantasy-console/runtime/src/cartridge/archive/util";
import { Vector3 } from "@fantasy-console/core/src/util";

import { GameObjectConfigComposer } from "@lib/composer/config";
import { ISceneMutation, SceneMutationArguments } from "../ISceneMutation";
import { IContinuousSceneMutation } from "../IContinuousSceneMutation";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";

interface SetGameObjectScaleMutationDeltaUpdateArgs {
  scaleDelta: Vector3;
}
interface SetGameObjectScaleMutationAbsoluteUpdateArgs {
  scale: Vector3;
}

export type SetGameObjectScaleMutationUpdateArgs = SetGameObjectScaleMutationDeltaUpdateArgs | SetGameObjectScaleMutationAbsoluteUpdateArgs;

export class SetGameObjectScaleMutation implements ISceneMutation, IContinuousSceneMutation<SetGameObjectScaleMutationUpdateArgs> {
  // State
  // @TODO should we look you up by ID or something?
  private readonly gameObject: GameObjectConfigComposer;
  private scale: Vector3;
  private _hasBeenApplied: boolean = false;
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

  update({ SceneViewController }: SceneMutationArguments, updateArgs: SetGameObjectScaleMutationUpdateArgs): void {
    if ('scaleDelta' in updateArgs) {
      const { scaleDelta } = updateArgs;
      this.scale.multiplySelf(scaleDelta);
      // - 1. Config state
      this.gameObject.transform.scale.multiplySelf(scaleDelta);
      // - 2. Babylon state
      this.gameObject.sceneInstance!.transform.scale.multiplySelf(scaleDelta);
    } else {
      const { scale } = updateArgs;
      this.scale = scale;
      // - 1. Config state
      this.gameObject.transform.scale = scale;
      // - 2. Babylon state
      this.gameObject.sceneInstance!.transform.scale = scale;
    }
    SceneViewController.selectionManager.updateGizmos();
  }

  apply({ SceneViewController }: SceneMutationArguments): void {
    // - 3. JSONC
    const updatedValue: ArchiveVector3 = {
      x: this.scale.x,
      y: this.scale.y,
      z: this.scale.z,
    };
    const mutationPath = resolvePathForSceneObjectMutation(this.gameObject.id, SceneViewController.scene, (gameObject) => gameObject.transform.scale);
    SceneViewController.sceneJson.mutate(mutationPath, updatedValue);
  }

  undo(args: SceneMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  get description(): string {
    return `Scale '${this.gameObject.name}'`;
  }

  public get hasBeenApplied() { return this._hasBeenApplied; }
  public set hasBeenApplied(value: boolean) { this._hasBeenApplied = value; }
}