import { AnyVector } from './index';
import { Vector3 } from "./Vector3";

export class Vector2 {
  private _x: number;
  private _y: number;

  public constructor(x: number, y: number) {
    this._x = x;
    this._y = y;
  }

  public addSelf(value: AnyVector): Vector2 {
    this.x += value.x;
    this.y += value.y;
    return this;
  }
  public add(value: AnyVector): Vector2 {
    return new Vector2(
      this.x + value.x,
      this.y + value.y,
    )
  }

  public subtractSelf(value: AnyVector): Vector2 {
    this.x -= value.x;
    this.y -= value.y;
    return this;
  }
  public subtract(value: AnyVector): Vector2 {
    return new Vector2(
      this.x - value.x,
      this.y - value.y,
    )
  }

  public multiplySelf(factor: number): Vector2;
  public multiplySelf(other: Vector2): Vector2;
  public multiplySelf(operand: number | Vector2): Vector2 {
    if (operand instanceof Vector2) {
      this.x *= operand.x;
      this.y *= operand.y;
    } else {
      this.x *= operand;
      this.y *= operand;
    }
    return this;
  }
  public multiply(factor: number): Vector2;
  public multiply(other: Vector2): Vector2;
  public multiply(operand: number | Vector2): Vector2 {
    if (operand instanceof Vector2) {
      return new Vector2(
        this.x * operand.x,
        this.y * operand.y,
      )
    } else {
      return new Vector2(
        this.x * operand,
        this.y * operand,
      )
    }
  }

  public divideSelf(factor: number): Vector2 {
    if (factor === 0) {
      throw new Error(`Cannot divide Vector2 by 0`);
    }
    this.multiplySelf(1 / factor);
    return this;
  }
  public divide(factor: number): Vector2 {
    if (factor === 0) {
      throw new Error(`Cannot divide Vector2 by 0`);
    }
    return this.multiply(1 / factor);
  }

  public length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  public normalizeSelf(): Vector2 {
    const length = this.length();
    if (length === 0) {
      this.x = this.y = 0;
    } else {
      this.x /= length;
      this.y /= length;
    }
    return this;
  }
  public normalize(): Vector2 {
    const length = this.length();
    if (length === 0) {
      return Vector2.zero();
    }
    return this.divide(length);
  }

  public withX(value: number): Vector2 {
    return new Vector2(value, this.y);
  }

  public withY(value: number): Vector2 {
    return new Vector2(this.x, value);
  }
  public get x(): number { return this._x; }
  public set x(value: number) { this._x = value; }

  public get y(): number { return this._y; }
  public set y(value: number) { this._y = value; }

  public static zero(): Vector2 {
    return new Vector2(0, 0);
  }
  public static one(): Vector2 {
    return new Vector2(1, 1);
  }

  public toVector3(): Vector3 {
    return new Vector3(this.x, this.y, 0);
  }
}