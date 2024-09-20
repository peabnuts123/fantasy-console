import { AnyVector, Vector3 } from "@fantasy-console/core/src/util";
import { makeObservable, observable } from "mobx";

/**
 * Thin wrapper for Vector3 that marks its properties as observable properties for mobx
 */
export class ObservableVector3 extends Vector3 {
  constructor(source: Vector3) {
    super(source.x, source.y, source.z);
    makeObservable(this, {
      // @NOTE type laundering because we need to observe private field
      _x: observable,
      _y: observable,
      _z: observable,
    } as any);
  }

  public override add(value: AnyVector): ObservableVector3 {
    return new ObservableVector3(super.add(value));
  }

  public override subtract(value: AnyVector): ObservableVector3 {
    return new ObservableVector3(super.subtract(value));
  }

  public multiply(factor: number): Vector3;
  public multiply(other: Vector3): Vector3;
  public override multiply(operand: number | Vector3): ObservableVector3 {
    if (operand instanceof Vector3) {
      return new ObservableVector3(super.multiply(operand));
    } else {
      return new ObservableVector3(super.multiply(operand));
    }
  }

  public divide(factor: number): ObservableVector3 {
    return new ObservableVector3(super.divide(factor));
  }

  public normalize(): ObservableVector3 {
    return new ObservableVector3(super.normalize());
  }

  public withX(x: number): ObservableVector3 {
    return new ObservableVector3(super.withX(x));
  }

  public withY(y: number): ObservableVector3 {
    return new ObservableVector3(super.withY(y));
  }

  public withZ(z: number): ObservableVector3 {
    return new ObservableVector3(super.withZ(z));
  }

  public static zero(): ObservableVector3 {
    return new ObservableVector3(Vector3.zero());
  }
  public static one(): ObservableVector3 {
    return new ObservableVector3(Vector3.one());
  }
}