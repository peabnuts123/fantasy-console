import { Vector3 } from "@fantasy-console/core/src/util";
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
}