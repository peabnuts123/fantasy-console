import { ClassReference, Color3 } from "@fantasy-console/core/src/util";
import { GameObjectComponent } from "@fantasy-console/core/src/world";
import { DirectionalLightComponent, PointLightComponent } from "@fantasy-console/runtime/src/world";
import { ColorDefinition, DirectionalLightComponentDefinition, PointLightComponentDefinition } from "@fantasy-console/runtime/src/cartridge";

import { DirectionalLightComponentData, GameObjectData, IComposerComponentData, PointLightComponentData } from "@lib/composer/data";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import { ISceneMutation } from "../ISceneMutation";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";
import { IContinuousSceneMutation } from "../IContinuousSceneMutation";

export interface SetGameObjectLightComponentColorMutationUpdateArgs {
  color: Color3;
}

type AnyLightComponentDefinition = DirectionalLightComponentDefinition | PointLightComponentDefinition;
interface AnyLightComponentData extends IComposerComponentData {
  color: Color3;
}
const LightComponentDataTypes: ClassReference<AnyLightComponentData>[] = [DirectionalLightComponentData, PointLightComponentData];
interface AnyLightComponent extends GameObjectComponent {
  color: Color3;
}
const LightComponentTypes: ClassReference<AnyLightComponent>[] = [DirectionalLightComponent, PointLightComponent];

export class SetGameObjectLightComponentColorMutation implements ISceneMutation, IContinuousSceneMutation<SetGameObjectLightComponentColorMutationUpdateArgs> {
  // Mutation parameters
  private readonly gameObjectId: string;
  private readonly componentId: string;
  private color: Color3 | undefined;

  // State
  private _hasBeenApplied: boolean = false;

  // Undo state
  private dataColor: Color3 | undefined = undefined;
  private sceneColor: Color3 | undefined = undefined;


  public constructor(gameObject: GameObjectData, component: AnyLightComponentData) {
    this.gameObjectId = gameObject.id;
    this.componentId = component.id;
  }

  public begin({ SceneViewController }: SceneViewMutationArguments): void {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentData = gameObjectData.getComponent(this.componentId, LightComponentDataTypes);
    const gameObject = gameObjectData.sceneInstance!;
    const component = gameObject.getComponent(this.componentId, LightComponentTypes)

    // - Store undo values
    this.dataColor = componentData.color;
    this.sceneColor = component.color;
  }

  public update({ SceneViewController }: SceneViewMutationArguments, { color }: SetGameObjectLightComponentColorMutationUpdateArgs): void {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentData = gameObjectData.getComponent(this.componentId, LightComponentDataTypes);
    const gameObject = gameObjectData.sceneInstance!;
    const component = gameObject.getComponent(this.componentId, LightComponentTypes)

    this.color = color;
    // - 1. Data
    componentData.color = color;
    // - 2. Babylon state
    component.color = color;
  }

  public apply({ SceneViewController }: SceneViewMutationArguments): void {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentIndex = gameObjectData.components.findIndex((component) => component.id === this.componentId);

    // - 3. JSONC
    const updatedValue: ColorDefinition = { r: this.color!.r, g: this.color!.g, b: this.color!.b };
    const mutationPath = resolvePathForSceneObjectMutation(
      this.gameObjectId,
      SceneViewController.sceneDefinition,
      (gameObject) => (gameObject.components[componentIndex] as AnyLightComponentDefinition).color
    );
    SceneViewController.sceneJson.mutate(mutationPath, updatedValue);
  }

  public undo(args: SceneViewMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  public get description(): string {
    return `Change light color`;
  }

  public get hasBeenApplied() { return this._hasBeenApplied; }
  public set hasBeenApplied(value: boolean) { this._hasBeenApplied = value; }
}