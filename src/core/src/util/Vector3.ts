import { AnyVector } from './index';

export class Vector3 {
  private _x: number;
  private _y: number;
  private _z: number;

  public constructor(x: number, y: number, z: number) {
    this._x = x;
    this._y = y;
    this._z = z;
  }

  public addSelf(value: AnyVector): Vector3 {
    this.x += value.x;
    this.y += value.y;
    if ('z' in value) {
      this.z += value.z;
    }
    return this;
  }
  public add(value: AnyVector): Vector3 {
    let zValue = 0;
    if ('z' in value) {
      zValue = value.z;
    }
    return new Vector3(
      this.x + value.x,
      this.y + value.y,
      this.z + zValue,
    )
  }

  public subtractSelf(value: AnyVector): Vector3 {
    this.x -= value.x;
    this.y -= value.y;
    if ('z' in value) {
      this.z -= value.z;
    }
    return this;
  }
  public subtract(value: AnyVector): Vector3 {
    let zValue = 0;
    if ('z' in value) {
      zValue = value.z;
    }
    return new Vector3(
      this.x - value.x,
      this.y - value.y,
      this.z - zValue,
    )
  }

  public multiplySelf(factor: number): Vector3 {
    this.x *= factor;
    this.y *= factor;
    this.z *= factor;
    return this;
  }
  public multiply(factor: number): Vector3 {
    return new Vector3(
      this.x * factor,
      this.y * factor,
      this.z * factor,
    )
  }

  public divideSelf(factor: number): Vector3 {
    if (factor === 0) {
      throw new Error(`Cannot divide Vector3 by 0`);
    }
    this.multiplySelf(1 / factor);
    return this;
  }
  public divide(factor: number): Vector3 {
    if (factor === 0) {
      throw new Error(`Cannot divide Vector3 by 0`);
    }
    return this.multiply(1 / factor);
  }

  public length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  public normalizeSelf(): Vector3 {
    const length = this.length();
    if (length === 0) {
      this.x = this.y = this.z = 0;
    } else {
      this.x /= length;
      this.y /= length;
      this.z /= length;
    }
    return this;
  }
  public normalize(): Vector3 {
    const length = this.length();
    if (length === 0) {
      return Vector3.zero();
    }
    return this.divide(length);
  }

  public get x(): number { return this._x; }
  public set x(value: number) { this._x = value; }

  public get y(): number { return this._y; }
  public set y(value: number) { this._y = value; }

  public get z(): number { return this._z; }
  public set z(value: number) { this._z = value; }

  public static zero(): Vector3 {
    return new Vector3(0, 0, 0);
  }
}