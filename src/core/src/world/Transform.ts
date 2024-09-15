import { Vector3 } from "../util/Vector3";
import { GameObject } from "./GameObject";

export abstract class Transform {
  private _children: Transform[];
  protected _gameObject!: GameObject;

  public constructor(parent: Transform | undefined, position: Vector3, rotation: Vector3, scale: Vector3) {
    this.parent = parent;
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this._children = [];
  }

  // @NOTE stupid inability for TypeScript to call abstract setters/getters in constructors??
  /* Position */
  public get position(): Vector3 { return this.getPosition(); }
  protected abstract getPosition(): Vector3;
  public set position(value: Vector3) { this.setPosition(value); }
  protected abstract setPosition(value: Vector3): void;

  /* Rotation */
  public get rotation(): Vector3 { return this.getRotation(); }
  protected abstract getRotation(): Vector3;
  public set rotation(value: Vector3) { this.setRotation(value); }
  protected abstract setRotation(value: Vector3): void;

  /* Scale */
  public get scale(): Vector3 { return this.getScale(); }
  protected abstract getScale(): Vector3;
  public set scale(value: Vector3) { this.setScale(value); }
  protected abstract setScale(value: Vector3): void;

  /* Parent */
  public get parent(): Transform | undefined { return this.getParent(); }
  protected abstract getParent(): Transform | undefined;
  public set parent(value: Transform | undefined) { this.setParent(value); }
  protected abstract setParent(value: Transform | undefined): void;

  public get children(): Transform[] {
    return this._children;
  }

  public get gameObject(): GameObject {
    return this._gameObject;
  }
}
