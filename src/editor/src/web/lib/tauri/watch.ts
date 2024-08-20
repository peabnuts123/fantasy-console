import type * as WatchModule from 'tauri-plugin-fs-watch-api';
type WatchModule = typeof WatchModule;

/**
 * @NOTE Wrapper for `tauri-plugin-fs-watch-api`, using a dynamic import to work around
 * Next.js' pre-rendering.
 * Functions are re-exported using a thin type-safe wrapper that resolves the module
 * asynchronously before invoking it.
 */

export const watch = wrap('watch');
export const watchImmediate = wrap('watchImmediate');

/**
 * Any function that returns type T.
 */
type FunctionWithReturnType<T> = (...args: any[]) => T;

/**
 * All keys of properties on `T` which are functions
 * that return a promise.
 */
type AsyncFunctionsOf<T> = {
  [K in keyof T]: T[K] extends FunctionWithReturnType<Promise<any>> ? K : never;
}[keyof T];


/**
 * Wrap a function within the Tauri `path` API to make it based on a dynamic import,
 * allowing it to be used in a pre-rendered Next.js context.
 * @param fnName Name of the function to wrap
 * @returns Wrapped version of the function that is based on a dynamic import
 */
function wrap<TFunction extends AsyncFunctionsOf<WatchModule>>(fnName: TFunction): WatchModule[TFunction] {
  // @NOTE some type laundering here, but the API is fully type safe
  return (async (...args: Parameters<WatchModule[TFunction]>) => {
    const pathModule = await import('tauri-plugin-fs-watch-api');
    const api = pathModule[fnName] as unknown as (...args: Parameters<WatchModule[TFunction]>) => ReturnType<WatchModule[TFunction]>;
    return api(...args);
  }) as unknown as WatchModule[TFunction];
}