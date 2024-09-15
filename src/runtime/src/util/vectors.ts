import { Vector3 as Vector3Babylon } from '@babylonjs/core/Maths/math.vector'
import { IVector3Like } from '@babylonjs/core/Maths/math.like';
import { Vector3 as Vector3Core } from '@fantasy-console/core/src/util';
import { Vector3 as Vector3Archive } from '../cartridge/archive/util/Vector3';

export function toCoreVector3(vector: IVector3Like): Vector3Core {
  return new Vector3Core(
    vector.x,
    vector.y,
    vector.z,
  );
}

export function toBabylonVector3(vector: IVector3Like): Vector3Babylon {
  return new Vector3Babylon(
    vector.x,
    vector.y,
    vector.z,
  );
}

export function toArchiveVector3(vector: IVector3Like): Vector3Archive {
  return {
    x: vector.x,
    y: vector.y,
    z: vector.z,
  } satisfies Vector3Archive;
}
