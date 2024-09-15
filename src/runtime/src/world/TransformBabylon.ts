import { Vector3 as Vector3Babylon } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Scene as BabylonScene } from '@babylonjs/core/scene';

import { Vector3 } from '@fantasy-console/core/src/util/Vector3';
import { GameObject } from '@fantasy-console/core/src/world/GameObject';
import { Transform } from '@fantasy-console/core/src/world/Transform';
import { TransformConfig } from '../cartridge';
import { toBabylonVector3 } from '../util';

/**
 * A Vector3 that is implemented around wrapping a Babylon Vector3 internally.
 */
export class WrappedBabylonVector3 extends Vector3 {
  /**
   * A function that can access the vector that is being wrapped.
   */
  private readonly getVector: () => Vector3Babylon;

  public constructor(getVector: () => Vector3Babylon) {
    const vector = getVector();
    super(vector.x, vector.y, vector.z);
    this.getVector = getVector;
  }

  public override get x(): number { return this.getVector().x; }
  public override set x(value: number) {
    super.x = value;
    this.getVector().x = value;
  }

  public override get y(): number { return this.getVector().y; }
  public override set y(value: number) {
    super.y = value;
    this.getVector().y = value;
  }

  public override get z(): number { return this.getVector().z; }
  public override set z(value: number) {
    super.z = value;
    this.getVector().z = value;
  }
}

export class TransformBabylon extends Transform {
  public readonly node: TransformNode;
  private _parent: TransformBabylon | undefined;
  private readonly _position: WrappedBabylonVector3;
  private readonly _rotation: WrappedBabylonVector3;
  private readonly _scale: WrappedBabylonVector3;

  /**
   * @HACKS
   * Used to prevent access to instance members before the object has been initialised.
   * This is mostly because TypeScript prevents you from accessing `this` before calling `super()`
   */
  private readonly __hasInitialised: true;

  public constructor(name: string, scene: BabylonScene, parent: TransformBabylon | undefined, transform: TransformConfig) {
    super(parent, transform.position, transform.rotation, transform.scale); // @NOTE setters will be ignored

    // Initialise internal values
    /* Construct new babylon transform (which this type wraps) */
    this.node = new TransformNode(name, scene);
    /* Create new "wrapped babylon vector3" position */
    this._position = new WrappedBabylonVector3(() => this.node.position);
    this._rotation = new WrappedBabylonVector3(() => this.node.rotation);
    this._scale = new WrappedBabylonVector3(() => this.node.scaling);
    this.__hasInitialised = true;

    // Call setters for real this time
    this.parent = parent;
    this.position = transform.position;
    this.rotation = transform.rotation;
    this.scale = transform.scale;
  }

  public setGameObject(gameObject: GameObject): void {
    this._gameObject = gameObject;
  }

  protected getPosition(): Vector3 {
    return this._position;
  }
  protected setPosition(value: Vector3): void {
    if (!this.__hasInitialised) return; // @NOTE workaround for calling setter in super constructor
    this.node.position = toBabylonVector3(value);
  }

  protected getRotation(): Vector3 {
    return this._rotation;
  }
  protected setRotation(value: Vector3): void {
    if (!this.__hasInitialised) return; // @NOTE workaround for calling setter in super constructor
    this.node.rotation = toBabylonVector3(value);
  }

  protected getScale(): Vector3 {
    return this._scale;
  }
  protected setScale(value: Vector3): void {
    if (!this.__hasInitialised) return; // @NOTE workaround for calling setter in super constructor
    this.node.scaling = toBabylonVector3(value);
  }

  protected getParent(): Transform | undefined {
    return this._parent;
  }
  protected setParent(value: Transform | undefined): void {
    if (!this.__hasInitialised) return; // @NOTE workaround for calling setter in super constructor
    const valueBabylon = value as TransformBabylon | undefined;
    if (valueBabylon !== undefined) {
      this.node.setParent(valueBabylon.node);
    } else {
      this.node.setParent(null);
    }

    // Remove this transform from its current parent's children (if applicable)
    if (this._parent !== undefined) {
      this._parent.children.splice(
        this._parent.children.indexOf(this),
        1
      );
    }

    // Set this transform's parent
    this._parent = valueBabylon;
    // Add this transform to the new parent's children
    if (valueBabylon !== undefined) {
      valueBabylon.children.push(this);
    }
  }
}