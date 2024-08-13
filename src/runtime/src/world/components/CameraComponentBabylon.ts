import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 as Vector3Babylon } from "@babylonjs/core/Maths/math.vector";

import { GameObjectComponentData } from "@fantasy-console/core/src/world/GameObjectComponent";
import { CameraComponent } from "@fantasy-console/core/src/world/components/CameraComponent";
import { Vector3 } from "@fantasy-console/core/src/util/Vector3";

import { GameObjectBabylon } from "../GameObjectBabylon";


export class CameraComponentBabylon extends CameraComponent {
  private camera: FreeCamera;

  public constructor(data: GameObjectComponentData, camera: FreeCamera) {
    super(data);
    this.camera = camera;
    camera.parent = this.gameObject.transform.node;
  }

  public pointAt(target: Vector3) {
    this.camera.setTarget(this.toLocalCoordinates(new Vector3Babylon(target.x, target.y, target.z)));
  }

  public override onDestroy(): void {
    super.onDestroy();
    this.camera.dispose();
  }

  // @NOTE override to expose concrete type for internal components
  public get gameObject(): GameObjectBabylon {
    return super.gameObject as GameObjectBabylon;
  }

  private toLocalCoordinates(worldVector: Vector3Babylon): Vector3Babylon {
    return worldVector.subtract(this.gameObject.transform.node.position);
  }
}