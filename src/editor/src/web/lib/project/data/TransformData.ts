import { makeAutoObservable } from "mobx";
import type { Vector3 } from '@fantasy-console/core/src/util';
import { ObservableVector3 } from "@lib/util/vector";

export class TransformData {
  // @NOTE Opaquely wrap vectors in `ObservableVector3` so that mobx can observe changes to them
  private _position: ObservableVector3;
  private _rotation: ObservableVector3;
  private _scale: ObservableVector3;

  public constructor(position: Vector3, rotation: Vector3, scale: Vector3) {
    this._position = new ObservableVector3(position);
    this._rotation = new ObservableVector3(rotation);
    this._scale = new ObservableVector3(scale);

    makeAutoObservable(this);
  }

  public get position(): Vector3 { return this._position; }
  public set position(value: Vector3) { this._position = new ObservableVector3(value); }

  public get rotation(): Vector3 { return this._rotation; }
  public set rotation(value: Vector3) { this._rotation = new ObservableVector3(value); }

  public get scale(): Vector3 { return this._scale; }
  public set scale(value: Vector3) { this._scale = new ObservableVector3(value); }
}
