import { GameObjectComponent } from "./GameObjectComponent";
import { Transform } from "./Transform";
import { World } from "../modules/World";
import { Vector3 } from "../util/Vector3";

export interface GameObjectData {
  name: string;
  transform: Transform;
}

/**
 * An object that lives within the game world.
 * Components are used to build up behaviours whereas a GameObject by itself does nothing.
 */
export abstract class GameObject {
  /** Unique identifier for this GameObject */
  public readonly id: string;
  /** Human-friendly name for this object */
  public readonly name: string;
  /** Components attached to this GameObject */
  public readonly components: GameObjectComponent[];
  /** Position, rotation, scale, hierarchy data */
  public readonly transform: Transform;

  public constructor(id: string, data: GameObjectData) {
    this.components = [];
    this.id = id;
    this.name = data.name;
    this.transform = data.transform;
  }

  public addComponent(component: GameObjectComponent) {
    this.components.push(component);
  }

  /**
   * Called once, after the game is added to the world.
   * When a scene is loaded, all objects are loaded before this is called.
   */
  public init() {
    this.components.forEach((component) => component.init());
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
    // @NOTE `World.destroyObject()` calls `onDestroy()`
    World.destroyObject(this);
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
    return `GameObject(${this.name})`;
  }
}
