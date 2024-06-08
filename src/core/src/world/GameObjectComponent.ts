import { GameObject } from "./GameObject"

/**
 * Data needed to construct a GameObjectComponent.
 */
export interface GameObjectComponentData {
  /** The GameObject this component is attached to */
  gameObject: GameObject;
}

/**
 * A component that lives on a GameObject.
 * Components are used to build up behaviours for GameObjects (which
 * by themselves do nothing).
 * Extend from this class to create a custom Component.
 */
export abstract class GameObjectComponent {
  /** The GameObject this component is attached to */
  private readonly _gameObject: GameObject;

  protected constructor(data: GameObjectComponentData) {
    this._gameObject = data.gameObject;
  }

  /**
   * Called once per frame
   * @param _deltaTime Time (in seconds) since the previous frame
   */
  public onUpdate(_deltaTime: number): void { }
  /**
   * Called right before the GameObject this component is attached to
   * is destroyed.
   */
  public onDestroy(): void { }

  protected get gameObject(): GameObject {
    return this._gameObject;
  }
}