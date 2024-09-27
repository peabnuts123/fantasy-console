import { GameObject, GameObjectData } from '@fantasy-console/core/src/world/GameObject';

import { TransformBabylon } from './TransformBabylon';

/**
 * An object that lives within the game world.
 * Components are used to build up behaviours whereas a GameObject by itself does nothing.
 */
export class GameObjectBabylon extends GameObject {
  // @NOTE Override base type
  declare public name: string;
  declare public readonly transform: TransformBabylon;

  public constructor(id: string, data: GameObjectData) {
    super(id, data);
    this.transform = data.transform as TransformBabylon;
  }
}
