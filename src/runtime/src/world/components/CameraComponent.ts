import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Quaternion } from "@babylonjs/core/Maths/math.vector";

import { CameraComponent as CameraComponentCore } from "@polyzone/core/src/world/components";
import { Vector3 } from "@polyzone/core/src/util";

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
    const direction = toVector3Babylon(target.subtract(this.gameObject.transform.position)).normalize();
    const quaternion = Quaternion.RotationYawPitchRoll(
      Math.atan2(direction.x, direction.z),
      Math.atan2(-direction.y, Math.sqrt(direction.x * direction.x + direction.z * direction.z)),
      0
    );

    // @NOTE Set the rotation of the GameObject itself
    this.gameObject.transform.node.rotationQuaternion = quaternion;
  }

  public override onDestroy(): void {
    this.camera.dispose();
  }
}