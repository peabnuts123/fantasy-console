import { WindowOptions } from "@tauri-apps/api/window";

import { throwUnhandled } from "../util";
import { WebviewOptions } from "@tauri-apps/api/webview";
import { MockWindowSystem } from "../MockWindowSystem";

export class TauriPluginWebviewMockModule {
  public static handle(action: string, args: any) {
    switch (action) {
      case 'create_webview_window':
        return this.createWebviewWindow(args);
      default:
        throw throwUnhandled(`[TauriPluginWebviewMockModule] (handle) Unimplemented action. (action='${action}') args: `, args);
    }
  }

  // @NOTE the type for `options` here is kind of approximate.
  private static createWebviewWindow = ({ options }: { options: WebviewOptions & WindowOptions & { label: string } }) => {
    console.log(`[TauriPluginWebviewMockModule] (createWebview) Opening: ${options.url}`, options);

    if (options.url === undefined) {
      throw new Error(`Cannot open window - url is undefined (?)`);
    }

    MockWindowSystem.open(options.url, options.label);
  }
}