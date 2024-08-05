import { Vector3 as RuntimeVector3 } from '@fantasy-console/core/util';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export function toRuntimeVector3(vector: Vector3) {
  return new RuntimeVector3(
    vector.x,
    vector.y,
    vector.z,
  );
}
