import type { GameObjectComponent } from "./GameObjectComponent";
import type { Transform } from "./Transform";
import type { Vector3 } from "../util/Vector3";

/**
 * An object that lives within the game world.
 * Components are used to build up behaviours whereas a GameObject by itself does nothing.
 */
export abstract class GameObject {
  public abstract addComponent(component: GameObjectComponent): void;

  /**
   * Called once, after the game object is added to the world.
   * When a scene is loaded, all objects are loaded before this is called.
   */
  public abstract init(): void;

  /**
   * Called once per frame.
   * @param deltaTime Time (in seconds) since the last frame.
   */
  public abstract update(deltaTime: number): void;

  /**
   * Destroy this GameObject, removing it (and all of its components)
   * from the World.
   */
  public abstract destroy(): void;

  /**
   * Called when this GameObject is destroyed.
   */
  public abstract onDestroy(): void;// {

  /** Unique identifier for this GameObject */
  public abstract get id(): string;
  /** Human-friendly name for this object */
  public abstract get name(): string;
  /** Components attached to this GameObject */
  public abstract get components(): GameObjectComponent[];
  /** Position, rotation, scale, hierarchy data */
  public abstract get transform(): Transform;

  public abstract get position(): Vector3;
  public abstract set position(value: Vector3);
}
