import type * as PathModule from '@tauri-apps/api/path';
type PathModule = typeof PathModule;

/**
 * @NOTE Wrapper for Tauri's `path` module, using a dynamic import to work around
 * Next.js' pre-rendering.
 * Functions are re-exported using a thin type-safe wrapper that resolves the module
 * asynchronously before invoking it.
 */

export const appCacheDir = wrap('appCacheDir');
export const appConfigDir = wrap('appConfigDir');
export const appDataDir = wrap('appDataDir');
export const appDir = wrap('appDir');
export const appLocalDataDir = wrap('appLocalDataDir');
export const appLogDir = wrap('appLogDir');
export const audioDir = wrap('audioDir');
export const basename = wrap('basename');
export const cacheDir = wrap('cacheDir');
export const configDir = wrap('configDir');
export const dataDir = wrap('dataDir');
export const desktopDir = wrap('desktopDir');
export const dirname = wrap('dirname');
export const documentDir = wrap('documentDir');
export const downloadDir = wrap('downloadDir');
export const executableDir = wrap('executableDir');
export const extname = wrap('extname');
export const fontDir = wrap('fontDir');
export const homeDir = wrap('homeDir');
export const isAbsolute = wrap('isAbsolute');
export const join = wrap('join');
export const localDataDir = wrap('localDataDir');
export const logDir = wrap('logDir');
export const normalize = wrap('normalize');
export const pictureDir = wrap('pictureDir');
export const publicDir = wrap('publicDir');
export const resolve = wrap('resolve');
export const resolveResource = wrap('resolveResource');
export const resourceDir = wrap('resourceDir');
export const runtimeDir = wrap('runtimeDir');
export const templateDir = wrap('templateDir');
export const videoDir = wrap('videoDir');

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
function wrap<TFunction extends AsyncFunctionsOf<PathModule>>(fnName: TFunction): PathModule[TFunction] {
  // @NOTE some type laundering here, but the API is fully type safe
  return (async (...args: Parameters<PathModule[TFunction]>) => {
    const pathModule = await import('@tauri-apps/api/path');
    const api = pathModule[fnName] as (...args: Parameters<PathModule[TFunction]>) => ReturnType<PathModule[TFunction]>;
    return api(...args);
  }) as unknown as PathModule[TFunction];
}