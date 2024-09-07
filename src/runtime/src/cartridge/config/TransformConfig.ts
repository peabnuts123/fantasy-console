import type { Vector3 } from '@fantasy-console/core/src/util';

export class TransformConfig {
  public position: Vector3;
  public rotation: number; // @TODO expressed as a 1D angle for now

  public constructor(position: Vector3, rotation: number) {
    this.position = position;
    this.rotation = rotation;
  }
}
