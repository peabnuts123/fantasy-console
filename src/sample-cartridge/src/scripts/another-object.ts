import { GameObjectComponent, GameObjectComponentData } from '@fantasy-console/core';
import { magicString } from './lib/util';

class AnotherObject extends GameObjectComponent {
  public name: string;

  constructor(data: GameObjectComponentData) {
    super(data);
    this.name = "Another object: " + magicString();
  }

  public SayHello(): void {
    console.log(`Hello from ${this.name}`);
  }
}


export default AnotherObject;