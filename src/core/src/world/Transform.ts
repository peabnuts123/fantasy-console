import { Vector3 } from "../util/Vector3";

export abstract class Transform {
  public constructor(parent: Transform | undefined, position: Vector3) {
    this.parent = parent;
    this.position = position;
  }

  // @NOTE stupid inability for TypeScript to call abstract setters/getters in constructors??
  protected abstract getPosition(): Vector3;
  public get position(): Vector3 {
    return this.getPosition();
  }
  protected abstract setPosition(value: Vector3): void;
  public set position(value: Vector3) {
    this.setPosition(value);
  }

  protected abstract getParent(): Transform | undefined;
  public get parent(): Transform | undefined {
    return this.getParent();
  }
  protected abstract setParent(value: Transform | undefined): void;
  public set parent(value: Transform | undefined) {
    this.setParent(value);
  }
}
