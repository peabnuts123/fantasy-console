import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { GameObjectComponent, GameObjectComponentData } from "../GameObjectComponent";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export class CameraComponent extends GameObjectComponent {
  private camera: FreeCamera;

  public constructor(data: GameObjectComponentData, camera: FreeCamera) {
    super(data);
    this.camera = camera;
    camera.parent = this.gameObject.transform;
  }

  // @TODO Babylon types what?
  public pointAt(target: Vector3) {
    this.camera.setTarget(target);
  }
}