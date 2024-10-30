import type { GameObjectComponent } from '@fantasy-console/core/src/world';
import { GameObject as GameObjectCore } from '@fantasy-console/core/src/world';
import type { ClassReference, Vector3 } from '@fantasy-console/core';
import { World } from '@fantasy-console/core';

import type { Transform } from './Transform';

/**
 * An object that lives within the game world.
 * Components are used to build up behaviours whereas a GameObject by itself does nothing.
 */
export class GameObject extends GameObjectCore {
  private _id: string;
  private _name: string;
  private _components: GameObjectComponent[];
  private _transform: Transform;

  public constructor(id: string, name: string, transform: Transform) {
    super();
    this._id = id;
    this._name = name;
    this._components = [];
    this._transform = transform;
  }

  public addComponent(component: GameObjectComponent): void {
    this.components.push(component);
  }
  public removeComponent(componentId: string): void {
    const index = this.components.findIndex((component) => component.id === componentId);
    if (index === -1) {
      throw new Error(`Cannot remove component from GameObject. No component exists with Id: '${componentId}'`);
    }
    this.components[index].onDestroy();
    this.components.splice(index, 1);
  }
  public init(): void {
    this.components.forEach((component) => component.init());
    this.transform.children.forEach((child) => child.gameObject.init());
  }
  public update(deltaTime: number): void {
    this.components.forEach((component) => component.onUpdate(deltaTime));
    this.transform.children.forEach((child) => child.gameObject.update(deltaTime));
  }
  public destroy(): void {
    this.transform.children.forEach((child) => child.gameObject.destroy());
    World.destroyObject(this);
  }
  public onDestroy(): void {
    this.components.forEach((component) => component.onDestroy());
  }

  /**
     * Get a component on this GameObjectData. If the component cannot be found or is not of the expected type,
     * an Error is thrown.
     * @param componentId Id of the component to get.
     * @param ExpectedComponentType Expected type of the component.
     */
  public getComponent<TComponent extends GameObjectComponent>(componentId: string, ExpectedComponentType: ClassReference<TComponent>): TComponent;
  /**
   * Get a component on this GameObjectData. If the component cannot be found or is not of the expected type,
   * an Error is thrown.
   * @param componentId Id of the component to get.
   * @param ExpectedComponentType Array of possible expected types of the component.
   */
  public getComponent<TComponent extends GameObjectComponent>(componentId: string, ExpectedComponentTypes: ClassReference<TComponent>[]): TComponent;
  public getComponent<TComponent extends GameObjectComponent>(componentId: string, expectedTypeOrTypes: ClassReference<TComponent> | ClassReference<TComponent>[]): TComponent {
    const component = this.components.find((component) => component.id === componentId);

    if (component === undefined) {
      throw new Error(`No component with ID '${componentId}' exists on GameObjectData '${this.name}' (${this.id})`);
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
  public findGameObjectInChildren(gameObjectId: string): GameObject | undefined {
    // Iterate children objects
    for (const childTransform of this.transform.children) {
      const childObject = childTransform.gameObject;
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

  public get id(): string { return this._id; }
  public get name(): string { return this._name; }
  public set name(value: string) { this._name = value; }
  public get components(): GameObjectComponent[] { return this._components; }
  public get transform(): Transform { return this._transform; }
  // @TODO Should I get rid of this or propagate this?
  public get position(): Vector3 { return this.transform.position; }
  public set position(value: Vector3) { this.transform.position = value; }
}
