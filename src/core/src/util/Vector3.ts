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

  public multiplySelf(factor: number): Vector3;
  public multiplySelf(other: Vector3): Vector3;
  public multiplySelf(operand: number | Vector3): Vector3 {
    if (operand instanceof Vector3) {
      this.x *= operand.x;
      this.y *= operand.y;
      this.z *= operand.z;
    } else {

      this.x *= operand;
      this.y *= operand;
      this.z *= operand;
    }
    return this;
  }
  public multiply(factor: number): Vector3;
  public multiply(other: Vector3): Vector3;
  public multiply(operand: number | Vector3): Vector3 {
    if (operand instanceof Vector3) {
      return new Vector3(
        this.x * operand.x,
        this.y * operand.y,
        this.z * operand.z,
      )
    } else {
      return new Vector3(
        this.x * operand,
        this.y * operand,
        this.z * operand,
      )
    }
  }

  public divideSelf(factor: number): Vector3;
  public divideSelf(other: Vector3): Vector3;
  public divideSelf(operand: number | Vector3): Vector3 {
    if (operand instanceof Vector3) {
      if (operand.x === 0 || operand.y === 0 || operand.z === 0) {
        throw new Error(`Cannot divide Vector3 by 0: ${operand}`);
      }
      this.x /= operand.x;
      this.y /= operand.y;
      this.z /= operand.z;
    } else {
      if (operand === 0) {
        throw new Error(`Cannot divide Vector3 by 0`);
      }
      this.x /= operand;
      this.y /= operand;
      this.z /= operand;
    }
    return this;
  }
  public divide(factor: number): Vector3;
  public divide(other: Vector3): Vector3;
  public divide(operand: number | Vector3): Vector3 {
    if (operand instanceof Vector3) {
      if (operand.x === 0 || operand.y === 0 || operand.z === 0) {
        throw new Error(`Cannot divide Vector3 by 0: ${operand}`);
      }
      return new Vector3(
        this.x / operand.x,
        this.y / operand.y,
        this.z / operand.z,
      )
    } else {
      if (operand === 0) {
        throw new Error(`Cannot divide Vector3 by 0`);
      }
      return new Vector3(
        this.x / operand,
        this.y / operand,
        this.z / operand,
      )
    }
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

  public clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }

  public withX(value: number): Vector3 {
    return new Vector3(value, this.y, this.z);
  }

  public withY(value: number): Vector3 {
    return new Vector3(this.x, value, this.z);
  }

  public withZ(value: number): Vector3 {
    return new Vector3(this.x, this.y, value);
  }

  public toString(): string {
    return `(${this.x}, ${this.y}, ${this.z})`;
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
  public static one(): Vector3 {
    return new Vector3(1, 1, 1);
  }
}