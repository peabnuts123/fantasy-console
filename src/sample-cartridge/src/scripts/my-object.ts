import { GameObjectComponent, GameObjectComponentData, Input, InputButton } from '@fantasy-console/core';

const SPEED_PER_SECOND = 3.0;

/*
  How can we get a reference to a thing?
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
    const delta = { x: 0, y: 0 };

    if (Input.isButtonPressed(InputButton.Right)) delta.x += 1;
    if (Input.isButtonPressed(InputButton.Left)) delta.x -= 1;

    if (Input.isButtonPressed(InputButton.Up)) delta.y += 1;
    if (Input.isButtonPressed(InputButton.Down)) delta.y -= 1;


    // Normalize delta
    if (delta.x !== 0 || delta.y !== 0) {
      delta.x = (delta.x / Math.sqrt(delta.x ** 2 + delta.y ** 2)) * SPEED_PER_SECOND * deltaTime;
      delta.y = (delta.y / Math.sqrt(delta.x ** 2 + delta.y ** 2)) * SPEED_PER_SECOND * deltaTime;
    }

    this.gameObject.position.x += delta.x;
    this.gameObject.position.z += delta.y;
  }
}

export default MyObject;
