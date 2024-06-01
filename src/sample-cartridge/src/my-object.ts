import { GameObjectComponent, GameObjectComponentData } from '@fantasy-console/core';

import { magicString } from './lib/util';
import add from './lib/math';

interface SomethingModule {
  name: string;
  value: number;
}

interface FakeInputState {
  name: string;
}

const debug_Modules = [
  {
    id: 'Something', value: {
      name: "I am the something module",
      value: 5,
    } satisfies SomethingModule
  },
  {
    id: 'Input', value: {
      name: "I am the input module",
    } satisfies FakeInputState
  }
]

function inject(identifier: string) {
  console.log(`[RAMBOTAN] @inject outer`);

  return function injectDecorator<TThis, TValue>(_target: undefined, context: ClassFieldDecoratorContext<TThis, TValue>) {
    console.log(`[RAMBOTAN] @inject middle`);
    // console.log(`Decorator context: `, context);

    return function (this: unknown, ...args: any[]): TValue {
      console.log(`[RAMBOTAN] @inject initializer`);
      console.log(`initializer this: `, this);
      console.log(`initializer args:`, ...args);

      let module = debug_Modules.find((module) => module.id === identifier);
      if (module === undefined) {
        throw new Error(`Cannot inject module with unknown ID: '${identifier}'`);
      } else {
        return module.value as TValue;
      }
    }
  }
}

class MyObject extends GameObjectComponent {
  @inject("Input")
  private InputProperty!: FakeInputState;

  private time: number;

  constructor(data: GameObjectComponentData) {
    super(data);
    this.time = 0;

    console.log(`[MyObject] (ctor) magic string: ${magicString}`);
    console.log(`[MyObject] (ctor) add(1, 2): ${add(1, 2)}`);

    console.log(`InputProperty`, this.InputProperty);
  }

  public onUpdate(deltaTime: number): void {
    this.time += deltaTime;

    this.gameObject.position.x = Math.sin(this.time / 1.28) * 3;
    this.gameObject.position.z = Math.cos(this.time) * 3;
  }
}

export default MyObject;