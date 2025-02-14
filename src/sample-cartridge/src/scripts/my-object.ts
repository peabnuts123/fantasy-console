import { Vector2, Vector3 } from '@polyzone/core/util';
import { Input, InputButton } from '@polyzone/core/modules/Input';
import { World } from '@polyzone/core/modules/World';
import { CameraComponent, ScriptComponent } from '@polyzone/core/world';

const MOVE_SPEED_PER_SECOND = 3.0;
const GRAVITY_PER_SECOND = 0.3;
const JUMP_POWER = 0.09;
const CAMERA_SPEED = 0.1;

class MyObject extends ScriptComponent {
  private camera!: CameraComponent;
  private velocity: Vector3 = Vector3.zero();
  private jumpRequested: boolean = false;
  private cameraPoint: Vector3 = Vector3.zero();

  public override init(): void {
    this.camera = World.query(({ path }) => path("Main Camera").component(CameraComponent));
  }

  public override onUpdate(deltaTime: number): void {
    let moveDelta = new Vector2(0, 0);

    /* MOVEMENT */
    if (Input.isButtonPressed(InputButton.Right)) moveDelta.x += 1;
    if (Input.isButtonPressed(InputButton.Left)) moveDelta.x -= 1;

    if (Input.isButtonPressed(InputButton.Up)) moveDelta.y += 1;
    if (Input.isButtonPressed(InputButton.Down)) moveDelta.y -= 1;

    if (Input.wasButtonPressed(InputButton.A)) {
      this.requestJump();
    }

    if (this.isOnGround && this.jumpRequested) {
      this.jump();
    }

    // Normalize movement to speed per second
    moveDelta.normalizeSelf().multiplySelf(MOVE_SPEED_PER_SECOND * deltaTime);

    this.gameObject.position.x += moveDelta.x;
    this.gameObject.position.z += moveDelta.y;

    /* GRAVITY */
    const gravityMultiplier = this.velocity.y < 0 ? 1.3 : 1;
    this.velocity.y -= GRAVITY_PER_SECOND * deltaTime * gravityMultiplier;

    if (this.isOnGround && this.velocity.y <= 0) {
      // Snap to ground
      this.gameObject.position.y = 0;
      this.velocity.y = 0;
    } else {
      // Falling
      this.gameObject.position.y += this.velocity.y;
    }

    /* CAMERA */
    let cameraDelta = this.gameObject.position.subtract(this.cameraPoint);
    this.cameraPoint = this.cameraPoint.addSelf(
      cameraDelta.multiplySelf(CAMERA_SPEED)
    );
    this.camera.pointAt(this.cameraPoint);
  }

  private requestJump() {
    this.jumpRequested = true;
    setTimeout(() => {
      this.jumpRequested = false;
    }, 100);
  }

  private jump() {
    this.velocity.y = JUMP_POWER;
    this.jumpRequested = false;
  }

  private get isOnGround(): boolean {
    // @NOTE Treat y=0 as ground (since PolyZone doesn't support collision yet)
    return this.gameObject.position.y < 0.05;
  }
}

export default MyObject;
