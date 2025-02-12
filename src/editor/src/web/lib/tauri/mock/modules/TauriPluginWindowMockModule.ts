
import { throwUnhandled } from "../util";
import { MockEventSystem } from "../MockEventSystem";
import { MockWindowSystem } from "../MockWindowSystem";

export class TauriPluginWindowMockModule {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  public static handle(action: string, args: any) {
    switch (action) {
      case 'close':
        return this.close(args);
      default:
        throw throwUnhandled(`[TauriPluginWindowMockModule] (handle) Unimplemented action. (action='${action}') args: `, args);
    }
  }

  private static close({ label }: { label: string | undefined }): void {
    console.log(`[TauriPluginWindowMockModule] (close) Closing window: (label='${label}')`);
    if (label === undefined || label === MockEventSystem.windowLabel) {
      // Closing self
      window.close();
    } else {
      // Trying to close another window (that presumably this instance opened)
      MockWindowSystem.close(label);
    }
  }
}
