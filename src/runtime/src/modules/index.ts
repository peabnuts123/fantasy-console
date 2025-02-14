import { IModule } from '@polyzone/core/src/modules/IModule';
import { Input } from '@polyzone/core/src/modules/Input';
import { World } from '@polyzone/core/src/modules/World';

export * from './BabylonInputManager';

// // type ClassConstructor = new (...args: any) => any;

// export class Modules {
//   private modules = new Map<string, any>();

//   // export function injectableModule(identifier: string) {
//   //   return function injectableModuleDecorator<TClass extends ClassConstructor>(target: TClass, context: ClassDecoratorContext<TClass>) {
//   //     // Replace class with subclass that registers itself
//   //     return class RegisteredModule extends target {
//   //       constructor(...args: any) {
//   //         super(...args);
//   //         if (modules.has(identifier)) {
//   //           console.warn(`[@injectableModule] (RegisteredModule) Constructing second instance of module '${identifier}'. Modules are expected to be singletons. Previous cached instance will be overwritten.`)
//   //         }
//   //         console.log(`Registered module '${identifier}':`, this);
//   //         modules.set(identifier, this);
//   //       }
//   //     }
//   //   }
//   // }

//   // public inject(identifier: string) {
//   //   // console.log(`[RAMBOTAN] @inject outer`);

//   //   return function injectDecorator<TThis, TValue>(_target: undefined, context: ClassFieldDecoratorContext<TThis, TValue>) {
//   //     // console.log(`[RAMBOTAN] @inject middle`);

//   //     return function (this: unknown, ...args: any[]): TValue {
//   //       // console.log(`[RAMBOTAN] @inject initializer`);
//   //       // console.log(`initializer this: `, this);
//   //       // console.log(`initializer args:`, ...args);

//   //       let module = modules.get(identifier);
//   //       if (module === undefined) {
//   //         throw new Error(`Cannot inject module with unknown ID: '${identifier}'`);
//   //       } else {
//   //         return module as TValue;
//   //       }
//   //     }
//   //   }
//   // }
// }

class Modules {
  private modules: IModule[] = [
    Input,
    World,
  ]

  public onInit(): void {
    this.modules.forEach((module) => module.onInit());
  }

  public onUpdate(deltaTime: number): void {
    this.modules.forEach((module) => module.onUpdate(deltaTime));
  }

  public dispose() {
    this.modules.forEach((module) => module.dispose());
  }
}

export default new Modules();
