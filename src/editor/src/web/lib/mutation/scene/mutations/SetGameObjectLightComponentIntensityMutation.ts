import { ClassReference } from "@polyzone/core/src/util";
import { GameObjectComponent } from "@polyzone/core/src/world";
import { DirectionalLightComponent, PointLightComponent } from "@polyzone/runtime/src/world";
import { DirectionalLightComponentDefinition, PointLightComponentDefinition } from "@polyzone/runtime/src/cartridge";

import { DirectionalLightComponentData, GameObjectData, IComposerComponentData, PointLightComponentData } from "@lib/project/data";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import { ISceneMutation } from "../ISceneMutation";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";
import { IContinuousSceneMutation } from "../IContinuousSceneMutation";

export interface SetGameObjectLightComponentIntensityMutationUpdateArgs {
  intensity: number;
}

type AnyLightComponentDefinition = DirectionalLightComponentDefinition | PointLightComponentDefinition;
interface AnyLightComponentData extends IComposerComponentData {
  intensity: number;
}
const LightComponentDataTypes: ClassReference<AnyLightComponentData>[] = [DirectionalLightComponentData, PointLightComponentData];
interface AnyLightComponent extends GameObjectComponent {
  intensity: number;
}
const LightComponentTypes: ClassReference<AnyLightComponent>[] = [DirectionalLightComponent, PointLightComponent];

export class SetGameObjectLightComponentIntensityMutation implements ISceneMutation, IContinuousSceneMutation<SetGameObjectLightComponentIntensityMutationUpdateArgs> {
  // Mutation parameters
  private readonly gameObjectId: string;
  private readonly componentId: string;
  private intensity: number | undefined;

  // State
  private _hasBeenApplied: boolean = false;

  // Undo state
  private dataIntensity: number | undefined = undefined;
  private sceneIntensity: number | undefined = undefined;


  public constructor(gameObject: GameObjectData, component: AnyLightComponentData) {
    this.gameObjectId = gameObject.id;
    this.componentId = component.id;
  }

  public begin({ SceneViewController }: SceneViewMutationArguments): void {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentData = gameObjectData.getComponent(this.componentId, LightComponentDataTypes);
    const gameObject = gameObjectData.sceneInstance!;
    const component = gameObject.getComponent(this.componentId, LightComponentTypes);

    // - Store undo values
    this.dataIntensity = componentData.intensity;
    this.sceneIntensity = component.intensity;
  }

  public update({ SceneViewController }: SceneViewMutationArguments, { intensity }: SetGameObjectLightComponentIntensityMutationUpdateArgs): void {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentData = gameObjectData.getComponent(this.componentId, LightComponentDataTypes);
    const gameObject = gameObjectData.sceneInstance!;
    const component = gameObject.getComponent(this.componentId, LightComponentTypes);

    this.intensity = intensity;
    // - 1. Data
    componentData.intensity = intensity;
    // - 2. Babylon state
    component.intensity = intensity;
  }

  public apply({ SceneViewController }: SceneViewMutationArguments): void {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentIndex = gameObjectData.components.findIndex((component) => component.id === this.componentId);

    // - 3. JSONC
    const updatedValue = this.intensity!;
    const mutationPath = resolvePathForSceneObjectMutation(
      this.gameObjectId,
      SceneViewController.sceneDefinition,
      (gameObject) => (gameObject.components[componentIndex] as AnyLightComponentDefinition).intensity,
    );
    SceneViewController.sceneJson.mutate(mutationPath, updatedValue);
  }

  public undo(_args: SceneViewMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  public get description(): string {
    return `Change light intensity`;
  }

  public get hasBeenApplied(): boolean { return this._hasBeenApplied; }
  public set hasBeenApplied(value: boolean) { this._hasBeenApplied = value; }
}
