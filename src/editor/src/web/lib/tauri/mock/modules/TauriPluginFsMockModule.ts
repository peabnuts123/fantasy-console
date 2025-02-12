/* eslint-disable @typescript-eslint/no-unused-vars */
import type * as TauriFs from '@tauri-apps/plugin-fs';

import { MockHandlerWith2Args, throwUnhandled } from "../util";
import { Paths } from '../config';
import { DebouncedWatchOptions, WatchEvent } from '@tauri-apps/plugin-fs';
import { Channel } from '@tauri-apps/api/core';

export class TauriPluginFsMockModule {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  public static handle(action: string, args: any) {
    switch (action) {
      case 'read_file':
        return this.readFile(args);
      case 'write_file':
        return this.writeFile(args);
      case 'write_text_file':
        return this.writeTextFile(args);
      case 'watch':
        return this.watch(args);
      case 'exists':
        return this.exists(args);
      default:
        throw throwUnhandled(`[TauriPluginFsMockModule] (handle) Unimplemented action. (action='${action}') args: `, args);
    }
  }

  private static readFile: MockHandlerWith2Args<'path', 'options', typeof TauriFs.readFile> = async ({ path, options }) => {
    if (options?.baseDir) {
      throw throwUnhandled(`[TauriPluginFsMockModule] (readFile) Unimplemented - 'options.baseDir': `, path, options);
    }
    if (path instanceof URL) {
      throw throwUnhandled(`[TauriPluginFsMockModule] (readFile) Unimplemented - 'path' is instance of URL: `, path, options);
    }
    if (path.startsWith(Paths.MagicFileRoot)) {
      const result = await fetch(path.replace(Paths.MagicFileRoot, ''));
      if (result.ok) {
        const buffer = await result.arrayBuffer();
        return new Uint8Array(buffer);
      } else {
        throw throwUnhandled(`[TauriPluginFsMockModule] (readFile) Failed to fetch: `, result);
      }
    } else {
      throw throwUnhandled(`[TauriPluginFsMockModule] (readFile) Unimplemented - Fetching non-magic-root file path: `, path);
    }
  };

  private static writeFile(data: Uint8Array): void {
    console.warn(`[TauriPluginFsMockModule] (writeFile) Tauri is mocked - no file actually written`);
  }

  private static writeTextFile(data: Uint8Array): void {
    console.warn(`[TauriPluginFsMockModule] (writeTextFile) Tauri is mocked - no file actually written`);
  }

  private static watch({ }: { paths: (string | URL)[], options: DebouncedWatchOptions, onEvent: Channel<WatchEvent> }) {
    console.warn(`[TauriPluginFsMockModule] (watch) Tauri is mocked - file system will not be observed`);
    return () => { /* unwatch() */ };
  }

  private static exists: MockHandlerWith2Args<'path', 'options', typeof TauriFs.exists> = ({ path, options }) => {
    console.warn(`[TauriPluginFsMockModule] (watch) Tauri is mocked - 'exists()' will always return true`);
    return true;
  };
}
