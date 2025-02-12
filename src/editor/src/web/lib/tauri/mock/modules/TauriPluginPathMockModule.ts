import type * as TauriPath from '@tauri-apps/api/path';
import { BaseDirectory } from '@tauri-apps/api/path';

import { MockHandlerWith1Arg, MockHandlerWith2Args, MockHandlerWithRestArg, throwUnhandled } from "../util";
import { Paths } from "../config";

export class TauriPluginPathMockModule {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  public static handle(action: string, args: any) {
    switch (action) {
      case 'basename':
        return this.basename(args);
      case 'resolve':
        return this.resolve(args);
      case 'resolve_directory':
        return this.resolveDirectory(args);
      case 'join':
        return this.join(args);
      default:
        throw throwUnhandled(`[TauriPluginPathMockModule] (handle) Unimplemented action. (action='${action}') args: `, args);
    }
  }

  public static basename: MockHandlerWith2Args<'path', 'ext', typeof TauriPath.basename> = ({ path, ext }) => {
    const segments = path.split(/[\/\\]/);
    const baseName = segments[segments.length - 1];
    if (ext) {
      throw throwUnhandled(`[TauriPluginPathMockModule] (basename) 'ext' param not yet implemented`);
    }
    return baseName;
  };

  public static resolve: MockHandlerWithRestArg<'paths', typeof TauriPath.resolve> = ({ paths }) => {
    const path = paths.join('/');
    return new URL(path, 'http://foo.bar')
      .pathname
      .replaceAll(/(^\/+)|(\/+$)/g, '');
  };

  public static resolveDirectory: MockHandlerWith1Arg<'directory', (directory: BaseDirectory) => string> = ({ directory }) => {
    // @NOTE `BaseDirectory` is mounted as an Object with enum values and keys swapped at runtime,
    // so you can resolve the name of the value like this.
    // e.g. `BaseDirectory[BaseDirectory.AppData]` => "AppData"
    return `${Paths.MagicFileRoot}/${BaseDirectory[directory]}`;
  };

  public static join: MockHandlerWithRestArg<'paths', typeof TauriPath.join> = (args) => {
    return this.resolve(args);
  };
}
