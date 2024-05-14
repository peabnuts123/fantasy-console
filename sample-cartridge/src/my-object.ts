import { GameObject } from '@engine';

class MyObject extends GameObject {
  private time: number;

  constructor() {
    super();
    this.time = 0;
  }

  public onUpdate(deltaTime: number): void {
    this.time += deltaTime;

    let position = this.position;
    position.x = Math.sin(this.time) * 3;
    position.z = Math.cos(this.time) * 3;
    this.position = position;
  }
}

export default MyObject;