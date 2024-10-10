import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 as Vector3Babylon } from "@babylonjs/core/Maths/math.vector";

import { CameraComponent as CameraComponentCore } from "@fantasy-console/core/src/world/components";
import { Vector3 } from "@fantasy-console/core/src/util";

import { GameObject } from "../GameObject";
import { toVector3Babylon } from "../../util";


export class CameraComponent extends CameraComponentCore {
  public readonly id: string;
  public readonly gameObject: GameObject;

  private camera: FreeCamera;

  public constructor(id: string, gameObject: GameObject, camera: FreeCamera) {
    super();
    this.id = id;
    this.gameObject = gameObject;

    this.camera = camera;
    camera.parent = this.gameObject.transform.node;
  }

  public pointAt(target: Vector3) {
    this.camera.setTarget(this.toLocalCoordinates(toVector3Babylon(target)));
  }

  public override onDestroy(): void {
    this.camera.dispose();
  }

  private toLocalCoordinates(worldVector: Vector3Babylon): Vector3Babylon {
    return worldVector.subtract(this.gameObject.transform.node.position);
  }
}