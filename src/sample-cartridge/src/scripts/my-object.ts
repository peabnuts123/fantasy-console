import { GameObjectComponent, GameObjectComponentData } from '@fantasy-console/core';
import { Vector2 } from '@fantasy-console/core/util';
import { Input, InputButton } from '@fantasy-console/core/modules/Input';

const SPEED_PER_SECOND = 3.0;

/*
  @TODO How can we get a reference to a thing?
 */
class MyObject extends GameObjectComponent {
  private time: number;

  constructor(data: GameObjectComponentData) {
    super(data);
    this.time = 0;
  }

  public onUpdate(deltaTime: number): void {
    this.time += deltaTime;

    // @TODO vector2 class
    let delta = new Vector2(0, 0);

    if (Input.isButtonPressed(InputButton.Right)) delta.x += 1;
    if (Input.isButtonPressed(InputButton.Left)) delta.x -= 1;

    if (Input.isButtonPressed(InputButton.Up)) delta.y += 1;
    if (Input.isButtonPressed(InputButton.Down)) delta.y -= 1;

    // Normalize to speed per second
    delta.normalizeSelf().multiplySelf(SPEED_PER_SECOND * deltaTime)

    this.gameObject.position.x += delta.x;
    this.gameObject.position.z += delta.y;
  }
}

export default MyObject;
