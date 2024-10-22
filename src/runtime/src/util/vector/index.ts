import { Vector3 as Vector3Babylon } from '@babylonjs/core/Maths/math.vector'
import { IVector3Like } from '@babylonjs/core/Maths/math.like';
import { Vector3 as Vector3Core } from '@fantasy-console/core/src/util';
import { Vector3Definition } from '../../cartridge/archive/util/vector';

export * from './WrappedVector3Babylon';

export function toVector3Core(vector: IVector3Like): Vector3Core {
  return new Vector3Core(
    vector.x,
    vector.y,
    vector.z,
  );
}

export function toVector3Babylon(vector: IVector3Like): Vector3Babylon {
  return new Vector3Babylon(
    vector.x,
    vector.y,
    vector.z,
  );
}

export function toVector3Definition(vector: IVector3Like): Vector3Definition {
  return {
    x: vector.x,
    y: vector.y,
    z: vector.z,
  } satisfies Vector3Definition;
}
