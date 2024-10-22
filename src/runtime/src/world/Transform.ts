import { Matrix, Quaternion, Vector3 as Vector3Babylon } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Scene as BabylonScene } from '@babylonjs/core/scene';

import { Vector3 } from '@fantasy-console/core/src/util/Vector3';
import { Transform as TransformCore } from '@fantasy-console/core/src/world';

import type { TransformData } from '../cartridge';
import { toVector3Babylon, WrappedVector3Babylon } from '../util';
import type { GameObject } from './GameObject';


const debugLog = (_: string) => {};
// const debugLog = console.log;
// const debugLog = console.trace;

/**
 * Implementation of the `ITransform` interface wrapped around
 * a Babylon `TransformNode`.
 */
export class Transform extends TransformCore {
  public readonly node: TransformNode;
  private _parent: Transform | undefined;
  private _gameObject!: GameObject;
  private _children: Transform[];
  private readonly _position: WrappedVector3Babylon;
  private readonly _localPosition: WrappedVector3Babylon;
  private readonly _rotation: WrappedVector3Babylon;
  private readonly _localRotation: WrappedVector3Babylon;
  private readonly _scale: WrappedVector3Babylon;
  private readonly _localScale: WrappedVector3Babylon;

  public constructor(name: string, scene: BabylonScene, parent: Transform | undefined, transform: TransformData) {
    super();
    /* Construct new babylon transform (which this type wraps) */
    this.node = new TransformNode(name, scene);
    this.node.reIntegrateRotationIntoRotationQuaternion = true;
    this.parent = parent;
    this._children = [];

    /*
      @NOTE Wrap babylon vectors in a wrapper.
      The wrapper does not internalise the vector, it operates on it by reference,
      using the getter / setter lambdas provided.
    */
    /* Position */
    this._position = new WrappedVector3Babylon(
      () => this.node.absolutePosition,
      (value) => {
        debugLog(`[Transform] (position.set): ${value}`);
        this.node.setAbsolutePosition(value);
      },
    );
    this._localPosition = new WrappedVector3Babylon(
      () => this.node.position,
      (value) => {
        debugLog(`[Transform] (localPosition.set): ${value}`);
        this.node.position = value;
      },
    );
    /* Rotation */
    this._rotation = new WrappedVector3Babylon(
      () => this.node.absoluteRotationQuaternion.toEulerAngles(),
      (value) => {
        debugLog(`[Transform] (rotation.set): ${value}`);
        const currentAbsoluteRotation = this.node.absoluteRotationQuaternion;
        const newAbsoluteRotation = Quaternion.FromEulerVector(value);
        const rotationDelta = currentAbsoluteRotation.invert().multiply(newAbsoluteRotation);

        // Ensure rotationQuaternion is defined
        // Once a quaternion is used, you never go back to using euler angles
        if (this.node.rotationQuaternion === null) {
          this.node.rotationQuaternion = this.node.rotation.toQuaternion();
        }

        // @TODO multiplySelf?
        this.node.rotationQuaternion = this.node.rotationQuaternion.multiply(rotationDelta);
      }
    );
    this._localRotation = new WrappedVector3Babylon(
      () => {
        if (this.node.rotationQuaternion === null) {
          return this.node.rotation;
        } else {
          return this.node.rotationQuaternion.toEulerAngles()
        }
      },
      (value) => {
        debugLog(`[Transform] (localRotation.set): ${value}`);
        this.node.rotationQuaternion = Quaternion.FromEulerVector(value);
      },
    );
    /* Scale */
    this._scale = new WrappedVector3Babylon(
      () => this.node.absoluteScaling,
      (value) => {
        debugLog(`[Transform] (scale.set): ${value}`);
        // Temporarily set scale to 1 so that: absolute scale = parent scale
        this.node.scaling = Vector3Babylon.One();
        this.node.computeWorldMatrix(); // @NOTE Force-recompute absolute scale
        const parentScale = this.node.absoluteScaling;


        /*
          For each axis, we have to check whether the object's parent(s) are producing a scale of 0.
          If this is the case, we can't set our local scale to produce a result that equals `value`
          without setting the scale to infinity.
          When this happens, we log a warning and leave the scale value at 1 (an arbitrary non-zero value).
          If the parent(s) scale(s) are then set back to a non-zero value, this will leave our object
          in an unexpected state

          e.g.
          > Parent scale = 0
          > Local scale = 3;
          > Absolute scale = 0 x 3 = 0

          > Set absolute scale to 4
          > Local scale is set to 1 by default because parent scale = 0
          > Absolute scale = 0 x 1 = 0 (absolute scale unchanged)

          > Set parent scale to 1
          > Local scale = 3
          > Absolute scale = 1 x 3 = 3
          > Absolute scale of this object is 3 which is unexpected.
         */
        if (parentScale.x <= Number.EPSILON) console.warn(`Cannot set world scale to '${value}' for object '${this.gameObject?.name}' as its parent(s) scale.x is currently 0. Its local scale.x will be set to 1. This will produce unexpected results if this object's parent(s) are scaled back to a non-zero value.`)
        else {
          this.node.scaling.x = value.x / parentScale.x;
        }
        if (parentScale.y <= Number.EPSILON) console.warn(`Cannot set world scale to '${value}' for object '${this.gameObject?.name}' as its parent(s) scale.y is currently 0. Its local scale.y will be set to 1. This will produce unexpected results if this object's parent(s) are scaled back to a non-zero value.`)
        else {
          this.node.scaling.y = value.y / parentScale.y;
        }
        if (parentScale.z <= Number.EPSILON) console.warn(`Cannot set world scale to '${value}' for object '${this.gameObject?.name}' as its parent(s) scale.z is currently 0. Its local scale.z will be set to 1. This will produce unexpected results if this object's parent(s) are scaled back to a non-zero value.`)
        else {
          this.node.scaling.z = value.z / parentScale.z;
        }

        // @TODO Could we do this more efficiently?
        this.node.scaling = this.node.scaling; // @NOTE mark as dirty
        this.node.computeWorldMatrix(); // @NOTE force re-compute absolute scale
      }
    );
    this._localScale = new WrappedVector3Babylon(
      () => this.node.scaling,
      (value) => {
        debugLog(`[Transform] (localScale.set): ${value}`);
        this.node.scaling = value
      },
    );

    // Initialise wrapped vectors
    // - Set values first
    this._localPosition.initialise(toVector3Babylon(transform.position));
    this._localRotation.initialise(toVector3Babylon(transform.rotation));
    this._localScale.initialise(toVector3Babylon(transform.scale));
    // - Initialise absolute values based on new local values
    // We do this so that the internal state matches
    // @TODO We should probably not have to do this.
    this._position.initialise();
    this._rotation.initialise();
    this._scale.initialise();
  }

  public get position(): Vector3 { return this._position; }
  public set position(value: Vector3) { this._position.setValue(toVector3Babylon(value)); }
  public get localPosition(): Vector3 { return this._localPosition; }
  public set localPosition(value: Vector3) { this._localPosition.setValue(toVector3Babylon(value)); }

  public get rotation(): Vector3 { return this._rotation; }
  public set rotation(value: Vector3) { this._rotation.setValue(toVector3Babylon(value)); }
  public get localRotation(): Vector3 { return this._localRotation; }
  public set localRotation(value: Vector3) { this._localRotation.setValue(toVector3Babylon(value)); }

  public get scale(): Vector3 { return this._scale; }
  public set scale(value: Vector3) { this._scale.setValue(toVector3Babylon(value)); }
  public get localScale(): Vector3 { return this._localScale; }
  public set localScale(value: Vector3) { this._localScale.setValue(toVector3Babylon(value)); }

  public get parent(): TransformCore | undefined { return this._parent; }
  public set parent(valueCore: TransformCore | undefined) {
    // Update relationships between transforms when `parent` is updated
    const value = valueCore as Transform | undefined;

    // Set the babylon node's parent
    if (value !== undefined) {
      this.node.setParent(value.node);
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
    this._parent = value;

    // Add this transform to the new parent's children
    if (value !== undefined) {
      value.children.push(this);
    }
  }

  public get gameObject(): GameObject { return this._gameObject; }
  public set gameObject(value: GameObject) { this._gameObject = value; }

  public get children(): Transform[] { return this._children };
}