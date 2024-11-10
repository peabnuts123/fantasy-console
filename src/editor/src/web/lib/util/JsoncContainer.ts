import { modify, JSONPath, ModificationOptions, applyEdits, parse } from 'jsonc-parser';
import { makeAutoObservable } from 'mobx';

const DefaultOptions: ModificationOptions = {
  formattingOptions: {},
}

const LogMutationDiffs = false;

/**
 * A container for more easily manipulating JSONC documents.
 */
export class JsoncContainer<TRawType extends object> {
  private _text: string;
  private currentValue: TRawType;

  public constructor(jsonc: string) {
    this._text = jsonc;
    this.currentValue = parse(jsonc);
    makeAutoObservable(this);
  }

  public mutate<TValue>(pathSelector: ResolvePathSelector<TRawType, TValue>, value: TValue extends undefined ? never : TValue, options?: ModificationOptions): void;
  public mutate<TValue>(path: MutationPath<TValue>, value: TValue extends undefined ? never : TValue, options?: ModificationOptions): void;
  public mutate<TValue>(pathOrSelector: ResolvePathSelector<TRawType, TValue> | MutationPath<TValue>, value: TValue extends undefined ? never : TValue, options?: ModificationOptions): void {
    // Validate for sanity (typechecking should disallow, but...)
    if (value === undefined) throw new Error('Cannot set JSON value to `undefined`. Use `delete()` to remove a value, or `null` to set it to null.');

    // Merge options with default options
    options = (options === undefined) ?
      DefaultOptions :
      {
        ...DefaultOptions,
        ...options,
      };

    let path: MutationPath<TValue>;
    if (Array.isArray(pathOrSelector)) {
      // Path
      path = pathOrSelector;
    } else {
      // Selector
      path = resolvePath(pathOrSelector);
    }

    if (LogMutationDiffs) console.log(`[JsoncContainer] (mutate) Before: `, this.text);

    let edits = modify(this.text, path, value, options);
    this.text = applyEdits(this.text, edits);
    if (LogMutationDiffs) console.log(`[JsoncContainer] (mutate) After: `, this.text);
  }

  public delete(path: JSONPath) {
    if (LogMutationDiffs) console.log(`[JsoncContainer] (delete) Before: `, this.text);
    let edits = modify(this.text, path, undefined, DefaultOptions);
    this.text = applyEdits(this.text, edits);
    if (LogMutationDiffs) console.log(`[JsoncContainer] (delete) After: `, this.text);
  }

  public toString(): string {
    return this.text;
  }

  private get text(): string { return this._text; }
  private set text(value: string) {
    this._text = value;
    this.currentValue = parse(value);
  }

  public get value(): TRawType { return this.currentValue; }
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
export type ResolvePathSelector<TContext extends object, TTarget> = (target: TContext) => TTarget;

/** An array of path segments. Strings are properties, and numbers are array indices. */
export type MutationPath<_TTarget> = (string | number)[];

/**
 * Use an arrow function to select a path within a given target object type
 * using a type-safe interface.
 * @param selector Arrow function for selecting the path
 * @returns An array of path segments, for interacting with JSON. Numeric path segments will be converted to numbers.
 * @example resolvePath<MyObject>((myObject) => myObject.people[0].name) // Returns ['people', 0, 'name']
 */
export function resolvePath<TContext extends object, TTarget>(selector: ResolvePathSelector<TContext, TTarget>): MutationPath<TTarget> {
  // Create a proxy for the type
  const proxy = createPathProxy<TContext>();
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
function createPathProxy<TTarget extends object>(path: MutationPath<any> = []) {
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
