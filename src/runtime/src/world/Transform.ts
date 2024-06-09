import { Vector3 as Vector3Babylon } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Scene as BabylonScene } from '@babylonjs/core/scene';

import { Vector3 } from '@fantasy-console/core/util/Vector3';
import { Transform } from '@fantasy-console/core/world/Transform';

/**
 * A Vector3 that is implemented around wrapping a Babylon Vector3 internally.
 */
export class WrappedBabylonVector3 extends Vector3 {
  private readonly vec: Vector3Babylon;

  public constructor(position: Vector3Babylon) {
    super(position.x, position.y, position.z);
    this.vec = position;
  }

  public override get x(): number { return this.vec.x; }
  public override set x(value: number) {
    // Write to internal value AND wrapped value, just for sanity reasons (has no real effect)
    super.x = value;
    this.vec.x = value;
  }

  public override get y(): number { return this.vec.y; }
  public override set y(value: number) {
    // Write to internal value AND wrapped value, just for sanity reasons (has no real effect)
    super.y = value;
    this.vec.y = value;
  }

  public override get z(): number { return this.vec.z; }
  public override set z(value: number) {
    // Write to internal value AND wrapped value, just for sanity reasons (has no real effect)
    super.z = value;
    this.vec.z = value;
  }
}

export class TransformBabylon extends Transform {
  public readonly node: TransformNode;
  private _parent: TransformBabylon | undefined;
  private readonly _position: WrappedBabylonVector3;

  /**
   * @HACKS
   * Used to prevent access to instance members before the object has been initialised.
   * This is mostly because TypeScript prevents you from accessing `this` before calling `super()`
   */
  private readonly __hasInitialised: true;

  public constructor(name: string, scene: BabylonScene, parent: TransformBabylon | undefined, position: Vector3) {
    super(parent, position); // @NOTE setters will be ignored

    // Initialise internal values
    /* Construct new babylon transform (which this type wraps) */
    this.node = new TransformNode(name, scene);
    /* Create new "wrapped babylon vector3" position */
    this._position = new WrappedBabylonVector3(this.node.position)
    this.__hasInitialised = true;

    // Call setters for real this time
    this.parent = parent;
    this.position = position;
  }

  public getPosition(): Vector3 {
    return this._position;
  }
  public setPosition(value: Vector3): void {
    if (!this.__hasInitialised) return; // @NOTE workaround for calling setter in super constructor
    this._position.x = value.x;
    this._position.y = value.y;
    this._position.z = value.z;
  }

  protected getParent(): Transform | undefined {
    return this._parent;
  }
  protected setParent(value: Transform | undefined): void {
    if (!this.__hasInitialised) return; // @NOTE workaround for calling setter in super constructor
    const valueBabylon = value as TransformBabylon;
    if (valueBabylon !== undefined) {
      this.node.setParent(valueBabylon.node);
    } else {
      this.node.setParent(null);
    }

    this._parent = valueBabylon;
  }
}