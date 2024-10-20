export * from './Vector2';
export * from './Vector3';
export * from './Color3';
export * from './Color4';

import { Vector2 } from './Vector2';
import { Vector3 } from './Vector3';

export type AnyVector = Vector2 | Vector3;

/**
 * A reference to a class, for passing class types by reference.
 * @example
 * ```typescript
 *  class MyComponent extends Component {
 *    public name: string;
 *    public constructor(name: string) {
 *      super();
 *      this.name = name;
 *    }
 *  }
 *
 *  function getComponent<TComponent extends Component>(componentCtor: ClassReference<TComponent>) {
 *    for (let component of components) {
 *      if (component instanceof componentCtor) {
 *        return component;
 *      }
 *    }
 *    return undefined;
 *  }
 *
 *  getComponent(MyComponent);
 * ```
 */
export type ClassReference<TClass> = abstract new (...args: any[]) => TClass;
