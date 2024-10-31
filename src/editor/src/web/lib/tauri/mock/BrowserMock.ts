import { Paths } from "./config";
import {
  PolyZoneMockModule,
  TauriPluginDialogMockModule,
  TauriPluginEventMockModule,
  TauriPluginFsMockModule,
  TauriPluginMenuMockModule,
  TauriPluginPathMockModule,
  TauriPluginWebviewMockModule,
  TauriPluginWindowMockModule,
} from "./modules";
import { throwUnhandled } from "./util";

interface TauriPluginCommand {
  isPlugin: true;
  plugin: string;
  action: string;
}
interface TauriPlainCommand {
  isPlugin: false;
  command: string;
}
type ParsedTauriCommand = TauriPluginCommand | TauriPlainCommand;

/**
 * A class that mocks the Tauri APIs when running in the browser, at least
 * good enough for the app to run somewhat.
 */
export class BrowserMock {
  public handle(cmd: string, args: any): any | Promise<any> {
    const parsed = this.parseCommand(cmd);
    console.log(`[DEBUG] [BrowserMock] (handle) parsed: `, parsed, args);

    if (parsed.isPlugin) {
      switch (parsed.plugin) {
        case 'dialog':
          return TauriPluginDialogMockModule.handle(parsed.action, args);
        case 'path':
          return TauriPluginPathMockModule.handle(parsed.action, args);
        case 'fs':
          return TauriPluginFsMockModule.handle(parsed.action, args);
        case 'event':
          return TauriPluginEventMockModule.handle(parsed.action, args);
        case 'webview':
          return TauriPluginWebviewMockModule.handle(parsed.action, args);
        case 'window':
          return TauriPluginWindowMockModule.handle(parsed.action, args);
        case 'menu':
          return TauriPluginMenuMockModule.handle(parsed.action, args);
        default:
          throw throwUnhandled(`[BrowserMock] (handle) Unimplemented plugin. (plugin='${parsed.plugin}') (action='${parsed.action}') args: `, args);
      }
    } else {
      switch (parsed.command) {
        case 'create_cartridge':
          return PolyZoneMockModule.mockCreateCartridge(args);
        default:
          throw throwUnhandled(`[BrowserMock] (handle) Unimplemented module. (module='${parsed.command}') args: `, args);
      }
    }
  }

  private parseCommand(cmd: string): ParsedTauriCommand {
    // plugin:dialog|open
    const match = /^plugin:(\w+)\|(\w+)$/.exec(cmd);
    if (match !== null) {
      return {
        isPlugin: true,
        plugin: match[1]!,
        action: match[2]!,
      } satisfies TauriPluginCommand;
    } else {
      return {
        isPlugin: false,
        command: cmd,
      } satisfies TauriPlainCommand;
    }
  }

  public mockConvertFileSrc(filePath: string, protocol: string = 'asset'): string {
    return filePath.replace(Paths.MagicFileRoot, '');
  }
}