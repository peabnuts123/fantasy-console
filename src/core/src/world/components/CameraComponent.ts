import { GameObjectComponent } from '../GameObjectComponent';
import type { GameObject as _GameObject } from '../GameObject'; // @NOTE Hmm, eslint :/
import type { Vector3 } from '../../util';

export abstract class CameraComponent extends GameObjectComponent {
  /**
   * Point the {@link _GameObject} this camera component is attached to towards a position in world space.
   * @param target Position to face (expressed in world coordinates).
   */
  abstract pointAt(target: Vector3): void;
}
