import { GameObjectComponent } from '../GameObjectComponent';
import type { Vector3 } from '../../util';

export abstract class CameraComponent extends GameObjectComponent {
  abstract pointAt(target: Vector3): void;
}
