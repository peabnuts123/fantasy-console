import { GameObject, GameObjectData } from '@fantasy-console/core/src/world/GameObject';

import { TransformBabylon } from './TransformBabylon';

/**
 * An object that lives within the game world.
 * Components are used to build up behaviours whereas a GameObject by itself does nothing.
 */
export class GameObjectBabylon extends GameObject {
  // Override concrete type
  public readonly transform: TransformBabylon;

  public constructor(id: number, data: GameObjectData) {
    super(id, data);
    this.transform = data.transform as TransformBabylon;
  }
}
