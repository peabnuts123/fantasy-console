import { modify, JSONPath, ModificationOptions, applyEdits } from 'jsonc-parser';

const DefaultOptions: ModificationOptions = {
  formattingOptions: {},
}

/**
 * A container for more easily manipulating JSONC documents.
 */
export class JsoncContainer<TRawType extends object> {
  private text: string;

  public constructor(jsonc: string) {
    this.text = jsonc;
  }

  public mutate<TValue>(pathSelector: ResolvePathSelector<TRawType>, value: TValue extends undefined ? never : TValue, options?: ModificationOptions) {
    // Validate for sanity (typechecking should disallow, but...)
    if (value === undefined) throw new Error('Cannot set JSON value to `undefined`. Use `delete()` to remove a value, or `null` to set it to null.');

    // Merge options with default options
    options = (options === undefined) ?
      DefaultOptions :
      {
        ...DefaultOptions,
        ...options,
      };

    const path = resolvePath(pathSelector);

    // console.log(`[JsoncContainer] (mutate) Before: `, this.text);

    let edits = modify(this.text, path, value, options);
    this.text = applyEdits(this.text, edits);
    // console.log(`[JsoncContainer] (mutate) After: `, this.text);
  }

  public delete(path: JSONPath) {
    let edits = modify(this.text, path, undefined, DefaultOptions);
    this.text = applyEdits(this.text, edits);
  }

  public toString(): string {
    return this.text;
  }
}

/* ====================
   Path resolving logic
   ==================== */

/** Symbol used by path resolving logic to indicate the end of the sequence */
const ResolvePathTerminatingSymbol = Symbol('TerminatingSymbol');

interface ITerminatableProxy {
  [ResolvePathTerminatingSymbol]: string[];
}

/** A selector function that takes an object and returns some sub-property */
type ResolvePathSelector<TTarget extends object> = (target: TTarget) => any;

/**
 * Use an arrow function to select a path within a given target object type
 * using a type-safe interface.
 * @param selector Arrow function for selecting the path
 * @returns An array of path segments, for interacting with JSON. Numeric path segments will be converted to numbers.
 * @example resolvePath<MyObject>((myObject) => myObject.people[0].name) // Returns ['people', 0, 'name']
 */
export function resolvePath<TTarget extends object>(selector: ResolvePathSelector<TTarget>): (string | number)[] {
  // Create a proxy for the type
  const proxy = createPathProxy<TTarget>();
  // Look up a path within the type (using a lambda function)
  const result = selector(proxy) as ITerminatableProxy;
  // Use special symbol to resolve path from proxy
  return result[ResolvePathTerminatingSymbol];
}

/**
 * Create a path proxy for a given type.
 * Indexing the proxy will return a new path proxy for the sub-property,
 * preserving the `path` state between.
 * Indexing a path proxy with `ResolvePathTerminatingSymbol` will return the path value.
 * @param path Persistent state passed down through recursive calls
 */
function createPathProxy<TTarget extends object>(path: (string | number)[] = []) {
  /* @NOTE Capture `path` in a closure */
  return new Proxy<TTarget>({} as TTarget, {
    get(_, prop) {
      if (prop === ResolvePathTerminatingSymbol) {
        // Resolve path value from proxy
        return path;
      }

      if (typeof prop === 'symbol') {
        throw new Error(`Unimplemented: Cannot resolve symbol property: ${prop.toString()}`);
      }

      // Parse `prop` as a number if possible (for array indexes)
      if (!Number.isNaN(Number(prop))) {
        path.push(Number(prop));
      } else {
        path.push(prop);
      }

      // @NOTE Type laundering
      const propName: keyof TTarget = prop as keyof TTarget;

      // Recursively create a new proxy for the sub property
      // @NOTE Type launder so that if child property is not an object, create a plain proxy
      return createPathProxy<TTarget[typeof propName] extends object ? TTarget[typeof propName] : object>(path);
    }
  });
}
