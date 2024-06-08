import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 as Vector3Babylon } from "@babylonjs/core/Maths/math.vector";

import { GameObjectComponentData } from "@fantasy-console/core/world/GameObjectComponent";
import { CameraComponent } from "@fantasy-console/core/world/components/CameraComponent";
import { Vector3 } from "@fantasy-console/core/util/Vector3";

import { InternalGameObjectComponent } from "../InternalGameObjectComponent";


export class CameraComponentBabylon extends InternalGameObjectComponent implements CameraComponent {
  private camera: FreeCamera;

  public constructor(data: GameObjectComponentData, camera: FreeCamera) {
    super(data);
    this.camera = camera;
    camera.parent = this.gameObject.transform.node;
  }

  public pointAt(target: Vector3) {
    this.camera.setTarget(new Vector3Babylon(target.x, target.y, target.z));
  }

  public override onDestroy(): void {
    super.onDestroy();
    this.camera.dispose();
  }
}