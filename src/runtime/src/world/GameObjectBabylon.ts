import { GameObject, GameObjectData } from '@fantasy-console/core/world/GameObject';

import { World } from './World';
import { TransformBabylon } from './Transform';

/**
 * An object that lives within the game world.
 * Components are used to build up behaviours whereas a GameObject by itself does nothing.
 */
export class GameObjectBabylon extends GameObject {
  /** Reference to the {@link World} this GameObject lives in */
  private readonly world: World;
  public readonly transform: TransformBabylon;

  public constructor(world: World, id: number, data: GameObjectData) {
    super(id, data);
    this.world = world;
    this.transform = data.transform as TransformBabylon;
  }

  /**
   * Destroy this GameObject, removing it (and all of its components)
   * from the World.
   */
  public override destroy() {
    // @NOTE `world.destroyObject()` calls `onDestroy()`
    this.world.destroyObject(this);
  }
}
