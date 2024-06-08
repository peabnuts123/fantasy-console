import { Vector3 } from "../util/Vector3";

export abstract class Transform {
  private _position: Vector3;

  public constructor(position: Vector3) {
    this._position = position;
  }
  public get position(): Vector3 {
    return this._position;
  }
  public set position(value: Vector3) {
    this._position.x = value.x;
    this._position.y = value.y;
    this._position.z = value.z;
  }
}
