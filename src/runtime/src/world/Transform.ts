import { Vector3 as Vector3Babylon } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';

import { Vector3 } from '@fantasy-console/core/util/Vector3';
import { Transform } from '@fantasy-console/core/world/Transform';

export class Vector3BabylonShim extends Vector3 {
  private readonly vec: Vector3Babylon;

  public constructor(position: Vector3Babylon) {
    super(position.x, position.y, position.z);
    this.vec = position;
  }

  public get x(): number { return this.vec.x; }
  public set x(value: number) { this.vec.x = value; }

  public get y(): number { return this.vec.y; }
  public set y(value: number) { this.vec.y = value; }

  public get z(): number { return this.vec.z; }
  public set z(value: number) { this.vec.z = value; }
}

export class TransformBabylon extends Transform {
  public readonly node: TransformNode;

  public constructor(transform: TransformNode, position: Vector3) {
    super(new Vector3BabylonShim(transform.position));
    this.node = transform;
    this.position = position;
  }
}