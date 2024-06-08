import { Vector3 } from "../util/Vector3";
import { GameObjectComponent } from "./GameObjectComponent";
import { Transform } from "./Transform";

export interface GameObjectData {
  transform: Transform;
}

/**
 * An object that lives within the game world.
 * Components are used to build up behaviours whereas a GameObject by itself does nothing.
 */
export abstract class GameObject {
  /** Unique identifier for this GameObject */
  protected readonly id: number;
  /** Components attached to this GameObject */
  protected readonly components: GameObjectComponent[];
  /** Position, rotation, scale, hierarchy data */
  public readonly transform: Transform;

  public constructor(id: number, data: GameObjectData) {
    this.components = [];
    this.id = id;
    this.transform = data.transform;
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
  public abstract destroy(): void;

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
    this.transform.position.x = value.x;
    this.transform.position.y = value.y;
    this.transform.position.z = value.z;
  }

  public toString(): string {
    return `GameObject(${this.id})`;
  }
}
