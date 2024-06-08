import { GameObjectComponent } from '../GameObjectComponent';
import { Vector3 } from '../../util/Vector3';

export interface CameraComponent extends GameObjectComponent {
  pointAt(target: Vector3): void;
}
