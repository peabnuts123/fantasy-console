/**
 * Error throwing utility. Logs an error and then throws a generic "unmocked API" message.
 * @param details Error message logged to the console before throwing
 * @param detailsArgs Optional arguments to log with the error message
 */
export function throwUnhandled(details: string, ...detailsArgs: any[]): void {
  console.error(details, ...detailsArgs);
  throw new Error(`Attempted to call unmocked Tauri API. ${details}`);
}

export type AsyncCallbackFn<TAsyncError, TAsyncResult> = (err: TAsyncError, result: TAsyncResult) => void;

/**
 * Convert a callback-style async function into a promise-based async function.
 * @param asyncFunction The function to convert.
 * @example
 * ```typescript
 * import { unzip } from 'fflate';
 * const unzipAsync = promisify(unzip);
 * // ...
 * const zipData = await unzipAsync(zipFileBytes);
 * ```
 */
export function promisify<TArgument, TAsyncError, TAsyncResult>(asyncFunction: (arg: TArgument, callback: AsyncCallbackFn<TAsyncError, TAsyncResult>) => any): (arg: TArgument) => Promise<TAsyncResult> {
  return (arg: TArgument) => {
    return new Promise((resolve, reject) => {
      asyncFunction(arg, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
}

/** Utility type that converts any type into Promise/raw type union */
export type OptionalAsync<T> = T extends Promise<infer P> ? P | Promise<P> : T;

/*
 * Utility types for declaring mock handlers.
 * Mock handlers have the functions' arguments passed in
 * as an object instead of an array, so they must be mapped
 * from an array of string names to object keys.
 * The types are inferred from the function's arguments positionally.
 *
 * @TODO for some reason the `Fn extends ____` bit isn't being enforced
 */
export type MockHandlerWith1Arg<
  Arg1Name extends string,
  Fn extends (arg1: any) => any
> = Fn extends (arg1: infer TArg1) => infer TReturn ? (args:
  { [K in Arg1Name]: TArg1 }
) => OptionalAsync<TReturn> : never;

export type MockHandlerWithRestArg<
  Arg1Name extends string,
  Fn extends (...args: any[]) => any
> = Fn extends (...args: infer TArgs) => infer TReturn ? (args:
  { [K in Arg1Name]: TArgs }
) => OptionalAsync<TReturn> : never;

export type MockHandlerWith2Args<
  Arg1Name extends string,
  Arg2Name extends string,
  Fn extends (arg1: any, arg2: any) => any
> = Fn extends (arg1: infer TArg1, arg2: infer TArg2) => infer TReturn ? (args:
  { [K in Arg1Name]: TArg1 } &
  { [K in Arg2Name]: TArg2 }
) => OptionalAsync<TReturn> : never;

export type MockHandlerWith3Args<
  Arg1Name extends string,
  Arg2Name extends string,
  Arg3Name extends string,
  Fn extends (arg1: any, arg2: any, arg3: any) => any
> = Fn extends (arg1: infer TArg1, arg2: infer TArg2, arg3: infer TArg3) => infer TReturn ? (args:
  { [K in Arg1Name]: TArg1 } &
  { [K in Arg2Name]: TArg2 } &
  { [K in Arg3Name]: TArg3 }
) => OptionalAsync<TReturn> : never;
