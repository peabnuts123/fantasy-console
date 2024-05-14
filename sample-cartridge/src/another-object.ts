import { GameObject } from '@engine';
import { magicString } from './lib/util';

class AnotherObject extends GameObject {
  public name: string;

  constructor() {
    super();
    this.name = "Another object: " + magicString();
  }

  public SayHello(): void {
    console.log(`Hello from ${this.name}`);
  }
}


export default AnotherObject;