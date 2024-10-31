import type * as TauriFs from '@tauri-apps/plugin-fs';

import { MockHandlerWith2Args, MockHandlerWith3Args, MockHandlerWithRestArg, throwUnhandled } from "../util";
import { Paths } from '../config';

export class TauriPluginFsMockModule {
  public static handle(action: string, args: any) {
    switch (action) {
      case 'read_file':
        return this.readFile(args);
      case 'write_file':
        return this.writeFile(args);
      default:
        throw throwUnhandled(`[TauriPluginFsMockModule] (handle) Unimplemented action. (action='${action}') args: `, args);
    }
  }

  private static readFile: MockHandlerWith2Args<'path', 'options', typeof TauriFs.readFile> = async ({ path, options }) => {
    if (options?.baseDir) {
      throw throwUnhandled(`TauriPluginFsMockModule (readFile) Unimplemented - 'options.baseDir': `, path, options);
    }
    if (path instanceof URL) {
      throw throwUnhandled(`TauriPluginFsMockModule (readFile) Unimplemented - 'path' is instance of URL: `, path, options);
    }
    if (path.startsWith(Paths.MagicFileRoot)) {
      const result = await fetch(path.replace(Paths.MagicFileRoot, ''));
      if (result.ok) {
        const buffer = await result.arrayBuffer();
        return new Uint8Array(buffer);
      } else {
        throw throwUnhandled(`TauriPluginFsMockModule (readFile) Failed to fetch: `, result);
      }
    } else {
      throw throwUnhandled(`TauriPluginFsMockModule (readFile) Unimplemented - Fetching non-magic-root file path: `, path);
    }
  };

  private static writeFile: MockHandlerWith3Args<'path', 'content', 'options', typeof TauriFs.writeFile> = () => {
    console.warn(`TauriPluginFsMockModule (writeFile) Tauri is mocked - no file actually written`);
  }
}