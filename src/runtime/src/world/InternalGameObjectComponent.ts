import { GameObjectComponent } from '@fantasy-console/core/world/GameObjectComponent';
import { GameObjectBabylon } from './GameObjectBabylon';

export abstract class InternalGameObjectComponent extends GameObjectComponent {
  /* @NOTE Type is overridden to reference concrete type for internal components */
  public get gameObject(): GameObjectBabylon {
    return super.gameObject as GameObjectBabylon;
  }
}