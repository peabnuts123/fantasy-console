import type { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { GameObjectComponent } from './GameObjectComponent';
import { World } from './World';

export interface GameObjectData {
  position: Vector3;
}

/**
 * An object that lives within the game world.
 * Components are used to build up behaviours whereas a GameObject by itself does nothing.
 */
export class GameObject {
  /** Unique identifier for this GameObject */
  private readonly id: number;
  /** Components attached to this GameObject */
  private readonly components: GameObjectComponent[];
  /** Reference to the {@link World} this GameObject lives in */
  private readonly world: World;
  /** {@link TransformNode} this GameObject is tied to */
  public readonly transform: TransformNode;

  public constructor(transform: TransformNode, world: World, id: number, data: GameObjectData) {
    this.components = [];
    this.transform = transform;
    this.world = world;

    this.id = id;
    this.position = data.position;
  }

  public addComponent(component: GameObjectComponent) {
    this.components.push(component);
  }

  /**
   * Called once per frame.
   * @param deltaTime Time (in seconds) since the last frame.
   */
  public update(deltaTime: number) {
    this.components.forEach((component) => component.onUpdate(deltaTime));
  }

  /**
   * Destroy this GameObject, removing it (and all of its components)
   * from the World.
   */
  public destroy() {
    // @NOTE `world.destroyObject()` calls `onDestroy()`
    this.world.destroyObject(this);
  }

  /**
   * Called when this GameObject is destroyed.
   */
  public onDestroy() {
    this.components.forEach((component) => component.onDestroy());
  }

  public get position(): Vector3 {
    return this.transform.position;
  }
  public set position(value: Vector3) {
    this.transform.position = value;
  }

  public toString(): string {
    return `GameObject(${this.id})`;
  }
}
