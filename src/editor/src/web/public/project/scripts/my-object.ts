import { Vector2 } from '@fantasy-console/core/util';
import { Input, InputButton } from '@fantasy-console/core/modules/Input';
import { World } from '@fantasy-console/core/modules/World';
import { CameraComponent, ScriptComponent } from '@fantasy-console/core/world';

const SPEED_PER_SECOND = 3.0;

class MyObject extends ScriptComponent {
  private camera!: CameraComponent;

  public override init(): void {
    this.camera = World.query(({ path }) => path("Main Camera").component(CameraComponent));
  }

  public override onUpdate(deltaTime: number): void {
    let delta = new Vector2(0, 0);

    if (Input.isButtonPressed(InputButton.Right)) delta.x += 1;
    if (Input.isButtonPressed(InputButton.Left)) delta.x -= 1;

    if (Input.isButtonPressed(InputButton.Up)) delta.y += 1;
    if (Input.isButtonPressed(InputButton.Down)) delta.y -= 1;

    // Normalize to speed per second
    delta.normalizeSelf().multiplySelf(SPEED_PER_SECOND * deltaTime);

    this.gameObject.position.x += delta.x;
    this.gameObject.position.z += delta.y;

    this.camera.pointAt(this.gameObject.position);
  }
}

export default MyObject;
