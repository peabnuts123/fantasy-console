import type * as TauriPath from '@tauri-apps/api/path';

import { MockHandlerWith2Args, MockHandlerWithRestArg, throwUnhandled } from "../util";

export class TauriPluginPathMockModule {
  public static handle(action: string, args: any) {
    switch (action) {
      case 'basename':
        return this.basename(args);
      case 'resolve':
        return this.resolve(args);
      default:
        throw throwUnhandled(`[TauriPluginPathMockModule] (handle) Unimplemented action. (action='${action}') args: `, args);
    }
  }

  public static basename: MockHandlerWith2Args<'path', 'ext', typeof TauriPath.basename> = ({ path, ext }) => {
    const segments = path.split(/[\/\\]/);
    let baseName = segments[segments.length - 1];
    if (ext) {
      throw throwUnhandled(`[TauriPluginPathMockModule] (basename) 'ext' param not yet implemented`);
    }
    return baseName;
  }

  public static resolve: MockHandlerWithRestArg<'paths', typeof TauriPath.resolve> = ({ paths }) => {
    let path = paths.join('/');
    return new URL(path, 'http://foo.bar')
      .pathname
      .replaceAll(/(^\/+)|(\/+$)/g, '');
  }
}