import type * as TauriDialog from '@tauri-apps/plugin-dialog';
import { MockHandlerWith1Arg, throwUnhandled } from '../util';
import { Paths } from '../config';

export class TauriPluginDialogMockModule {
  public static handle(action: string, args: any) {
    switch (action) {
      case 'open':
        return this.open(args);
      case 'save':
        return this.save(args);
      default:
        throw throwUnhandled(`[TauriPluginDialogMockModule] (handle) Unimplemented action. (action='${action}') args: `, args);
    }
  }

  private static open: MockHandlerWith1Arg<'options', typeof TauriDialog.open> = ({ options }) => {
    if (options?.filters?.some((filter) => filter.extensions.includes('pzcart'))) {
      return `${Paths.MagicFileRoot}/${Paths.MockCartridgeFile}`;
    } else if (options?.filters?.some((filter) => filter.extensions.includes('pzproj'))) {
      return `${Paths.MagicFileRoot}/${Paths.MockProjectFile}`;
    }
    throw throwUnhandled(`[TauriPluginDialogMockModule] (open) Unhandled request. options: `, options);
  };

  private static save: MockHandlerWith1Arg<'options', typeof TauriDialog.save> = ({ options }) => {
    if (options?.filters?.some((filter) => filter.extensions.includes('pzcart'))) {
      return `${Paths.MagicFileRoot}/${Paths.MockCartridgeFile}`;
    }
    throw throwUnhandled(`[TauriPluginDialogMockModule] (save) Unhandled request. options: `, options);
  };
}

