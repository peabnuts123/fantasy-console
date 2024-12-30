import { invoke as tauriInvoke } from '@tauri-apps/api/core'

import { AssetDefinition } from '@lib/project/definition';
import { RawProjectScene } from '@lib/project/watcher/scenes';

/**
 * A list of all commands available in Tauri, as well
 * as their params and return types.
 * Use {@link invoke} to call these methods in a typesafe manner.
 */
type TauriCommands = {
  create_cartridge(args: {
    manifestFileBytes: string;
    projectRootPath: string;
    assetPaths: string[];
    scriptPaths: string[];
  }): number[],

  load_project(args: {
    projectFilePath: string;
  }): void,

  unload_project(): void;

  start_watching_project_files(args: {
    projectAssets: AssetDefinition[];
    projectScenes: RawProjectScene[];
  }): string;

  stop_watching_project_assets(): void;

  hash_data(args: {
    data: number[],
  }): string;
}

export type TauriCommandArgs<T extends keyof TauriCommands> = Parameters<TauriCommands[T]>;
export type TauriCommandReturnType<T extends keyof TauriCommands> = ReturnType<TauriCommands[T]>;

export async function invoke<T extends keyof TauriCommands>(
  command: T,
  ...args: TauriCommandArgs<T>
): Promise<TauriCommandReturnType<T>> {
  return tauriInvoke(command, ...args);
}
