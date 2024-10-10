import type { GameObjectComponent } from '@fantasy-console/core/src/world';
import { GameObject as GameObjectCore } from '@fantasy-console/core/src/world';
import type { Vector3 } from '@fantasy-console/core';
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

  addComponent(component: GameObjectComponent): void {
    this.components.push(component);
  }
  init(): void {
    this.components.forEach((component) => component.init());
    this.transform.children.forEach((child) => child.gameObject.init());
  }
  update(deltaTime: number): void {
    this.components.forEach((component) => component.onUpdate(deltaTime));
    this.transform.children.forEach((child) => child.gameObject.update(deltaTime));
  }
  destroy(): void {
    this.transform.children.forEach((child) => child.gameObject.destroy());
    World.destroyObject(this);
  }
  onDestroy(): void {
    this.components.forEach((component) => component.onDestroy());
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
