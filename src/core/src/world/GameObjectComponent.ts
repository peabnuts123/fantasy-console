import { GameObject } from "./GameObject";

/**
 * A component that lives on a GameObject.
 * Components are used to build up behaviours for GameObjects (which
 * by themselves do nothing).
 * Extend from this class to create a custom Component.
 */
export abstract class GameObjectComponent {
  /**
   * Called once, after the game object is added to the world.
   * When a scene is loaded, all objects are loaded before this is called.
   */
  public init(): void { }

  /**
   * Called once per frame
   * @param deltaTime Time (in seconds) since the previous frame
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onUpdate(deltaTime: number): void { }
  /**
   * Called right before the GameObject this component is attached to
   * is destroyed.
   */
  public onDestroy(): void { }

  /** Unique identifier for this GameObjectComponent */
  public abstract get id(): string;
  /** The GameObject this component is attached to */
  public abstract get gameObject(): GameObject;
}
