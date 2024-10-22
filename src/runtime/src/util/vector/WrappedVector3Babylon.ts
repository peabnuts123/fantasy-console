import { Vector3 as Vector3Babylon } from '@babylonjs/core/Maths/math.vector';

import { Vector3 as Vector3Core } from '@fantasy-console/core/src/util/Vector3';

/**
* A Vector3 that is implemented around wrapping a Babylon Vector3 internally.
*/
export class WrappedVector3Babylon extends Vector3Core {
  /**
   * A function that can access the vector that is being wrapped.
   */
  private readonly getValue: () => Vector3Babylon;
  /**
   * A function that can set the value of the vector being wrapped.
   */
  private readonly _setValue: (value: Vector3Babylon) => void;

  public constructor(getValue: () => Vector3Babylon, setValue: (value: Vector3Babylon) => void) {
    const vector = getValue();
    super(vector.x, vector.y, vector.z);
    this.getValue = getValue;
    this._setValue = setValue;
  }

  public override get x(): number { return this.getValue().x; }
  public override set x(value: number) {
    super.x = value;
    this._setValue(new Vector3Babylon(super.x, super.y, super.z));
  }

  public override get y(): number { return this.getValue().y; }
  public override set y(value: number) {
    super.y = value;
    this._setValue(new Vector3Babylon(super.x, super.y, super.z));
  }

  public override get z(): number { return this.getValue().z; }
  public override set z(value: number) {
    super.z = value;
    this._setValue(new Vector3Babylon(super.x, super.y, super.z));
  }

  public setValue(value: Vector3Babylon): void {
    super.x = value.x;
    super.y = value.y;
    super.z = value.z;
    this._setValue(value);
  }

  public toString(): string {
    return `[${this.x}, ${this.y}, ${this.z}]`;
  }

  // @TODO We should probably stop relying on `super.x/y/z`
  // being the same as the underlying value
  // If we could just issue partial updates or always
  // reference the underlying value instead then we wouldn't
  // have to initialise + would prevent a category of bugs
  public initialise(value: Vector3Babylon | undefined = undefined) {
    value ??= this.getValue().clone();
    this.setValue(value);
  }
}