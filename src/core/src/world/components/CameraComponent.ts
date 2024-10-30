import { GameObjectComponent } from '../GameObjectComponent';
import type { GameObject } from '../GameObject';
import type { Vector3 } from '../../util';

export abstract class CameraComponent extends GameObjectComponent {
  /**
   * Point the {@link GameObject} this camera component is attached to towards a position in world space.
   * @param target Position to face (expressed in world coordinates).
   */
  abstract pointAt(target: Vector3): void;
}
