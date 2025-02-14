import type { Vector3 } from '@polyzone/core/src/util';

export class TransformData {
  public position: Vector3;
  public rotation: Vector3;
  public scale: Vector3;

  public constructor(position: Vector3, rotation: Vector3, scale: Vector3) {
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
  }
}
