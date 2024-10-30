import { makeAutoObservable } from "mobx";

import { ClassReference } from "@fantasy-console/core/src/util";
import type { GameObject as GameObjectRuntime } from "@fantasy-console/runtime/src/world";

import type { IComposerComponentData } from "./components";
import type { TransformData } from "./TransformData";

export class GameObjectData {
  public readonly id: string;
  public name: string;
  public transform: TransformData;
  public components: IComposerComponentData[];
  public children: GameObjectData[];

  // @TODO this is a bit cooked TBH. We should probably have a reference to World or SceneBabylon or something.
  //  I think this is only used by mutations
  // @TODO is it cooked that we're using a Runtime GameObject for this? I can't see any reason why we should
  //  other than "it happens to be the same"
  public sceneInstance: GameObjectRuntime | undefined = undefined;

  public constructor(id: string, name: string, transform: TransformData, components: IComposerComponentData[], children: GameObjectData[]) {
    this.id = id;
    this.name = name;
    this.transform = transform;
    this.components = components;
    this.children = children;

    makeAutoObservable(this);
  }

  /**
   * Get a component on this GameObjectData. If the component cannot be found, an Error is thrown.
   * @param componentId Id of the component to get.
   */
  public getComponent(componentId: string): IComposerComponentData;
  /**
   * Get a component on this GameObjectData. If the component cannot be found or is not of the expected type,
   * an Error is thrown.
   * @param componentId Id of the component to get.
   * @param ExpectedComponentType Expected type of the component.
   */
  public getComponent<TComponent extends IComposerComponentData>(componentId: string, ExpectedComponentType: ClassReference<TComponent>): TComponent;
  /**
   * Get a component on this GameObjectData. If the component cannot be found or is not of the expected type,
   * an Error is thrown.
   * @param componentId Id of the component to get.
   * @param ExpectedComponentType Array of possible expected types of the component.
   */
  public getComponent<TComponent extends IComposerComponentData>(componentId: string, ExpectedComponentTypes: ClassReference<TComponent>[]): TComponent;
  public getComponent<TComponent extends IComposerComponentData>(componentId: string, expectedTypeOrTypes: ClassReference<TComponent> | ClassReference<TComponent>[] | undefined = undefined): TComponent {
    const component = this.components.find((component) => component.id === componentId);

    if (component === undefined) {
      throw new Error(`No component with ID '${componentId}' exists on GameObjectData '${this.name}' (${this.id})`);
    }

    if (expectedTypeOrTypes === undefined) {
      return component as TComponent;
    }

    let expectedComponentTypes: ClassReference<TComponent>[] = [];
    if (Array.isArray(expectedTypeOrTypes)) {
      expectedComponentTypes = expectedTypeOrTypes;
    } else {
      expectedComponentTypes.push(expectedTypeOrTypes);
    }

    const instanceOfAnyComponentType = expectedComponentTypes.some((ComponentType) => component instanceof ComponentType);
    if (!instanceOfAnyComponentType) {
      const expectedComponentTypeNames = expectedComponentTypes.map((x) => x.name).join('|');
      throw new Error(`Component with ID '${componentId}' on GameObjectData '${this.name}' (${this.id}) is not of expected type. (Expected='${expectedComponentTypeNames}') (Actual='${component.constructor.name}')`)
    }

    // Sadly we have to launder as the `instanceof` check is inside a `some()` aggregation
    return component as TComponent;
  }

  /**
   * Find a GameObject in this GameObject's children.
   * @param gameObjectId ID of the GameObject to find.
   */
  public findGameObjectInChildren(gameObjectId: string): GameObjectData | undefined {
    // Iterate children objects
    for (const childObject of this.children) {
      if (childObject.id === gameObjectId) {
        // Found object as direct child
        return childObject;
      } else {
        // Look for object as descendent of child
        const childResult = childObject.findGameObjectInChildren(gameObjectId);
        if (childResult !== undefined) {
          return childResult;
        }
      }
    }

    return undefined;
  }
}
