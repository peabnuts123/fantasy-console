import { Vector3 as RuntimeVector3 } from '@fantasy-console/core/src/util';

/* @TODO these probably need better names */

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
