import { GameObjectData } from "@lib/composer/data";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import { ISceneMutation } from "../ISceneMutation";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";
import { IContinuousSceneMutation } from "../IContinuousSceneMutation";

export interface SetGameObjectNameMutationUpdateArgs {
  name: string;
}

export class SetGameObjectNameMutation implements ISceneMutation, IContinuousSceneMutation<SetGameObjectNameMutationUpdateArgs> {
  // State
  // @TODO should we look you up by ID or something?
  private readonly gameObject: GameObjectData;
  private name: string;
  private _hasBeenApplied: boolean = false;

  // Undo state
  private configName: string | undefined = undefined;
  private sceneName: string | undefined = undefined;


  public constructor(gameObject: GameObjectData) {
    this.gameObject = gameObject;
    this.name = gameObject.name;
  }

  public begin(_args: SceneViewMutationArguments): void {
    // - Store undo values
    this.configName = this.gameObject.name;
    this.sceneName = this.gameObject.sceneInstance!.name;
  }

  public update({ }: SceneViewMutationArguments, { name }: SetGameObjectNameMutationUpdateArgs): void {
    this.name = name;
    // - 1. Data
    this.gameObject.name = name;
    // - 2. Babylon state
    this.gameObject.sceneInstance!.name = name;
  }

  public apply({ SceneViewController }: SceneViewMutationArguments): void {
    // - 3. JSONC
    const updatedValue = this.name;
    const mutationPath = resolvePathForSceneObjectMutation(this.gameObject.id, SceneViewController.sceneDefinition, (gameObject) => gameObject.name);
    SceneViewController.sceneJson.mutate(mutationPath, updatedValue);
  }

  public undo(args: SceneViewMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  public get description(): string {
    // Old name is dependent on whether this mutation has been applied or not (e.g. if it's been undone)
    let oldName: string;
    if (this.configName) {
      oldName = this.configName;
    } else {
      oldName = this.gameObject.name;
    }
    return `Rename '${oldName}' => '${this.name}'`;
  }

  public get hasBeenApplied() { return this._hasBeenApplied; }
  public set hasBeenApplied(value: boolean) { this._hasBeenApplied = value; }
}