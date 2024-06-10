import { GameObjectComponent } from '../GameObjectComponent';
import { Vector3 } from '../../util/Vector3';

export abstract class CameraComponent extends GameObjectComponent {
  public abstract pointAt(target: Vector3): void;
}
