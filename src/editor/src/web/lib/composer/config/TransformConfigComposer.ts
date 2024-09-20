import { makeObservable, observable } from "mobx";
import { TransformConfig } from "@fantasy-console/runtime/src/cartridge/config";
import type { Vector3 } from '@fantasy-console/core/src/util';
import { ObservableVector3 } from "@lib/util/vector";


export class TransformConfigComposer extends TransformConfig {
  declare public position: ObservableVector3;
  declare public rotation: ObservableVector3;
  declare public scale: ObservableVector3;

  public constructor(position: Vector3, rotation: Vector3, scale: Vector3) {
    // @NOTE Opaquely wrap vectors in `ObservableVector3` so that mobx can observe changes to them
    super(
      new ObservableVector3(position),
      new ObservableVector3(rotation),
      new ObservableVector3(scale)
    );

    makeObservable(this, {
      position: observable,
      rotation: observable,
      scale: observable,
    });
  }
}
