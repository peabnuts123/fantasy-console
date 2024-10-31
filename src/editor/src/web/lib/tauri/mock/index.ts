import { mockIPC } from "@tauri-apps/api/mocks";

import { BrowserMock } from "./BrowserMock";
import { MockEventSystem } from "./MockEventSystem";

/**
 * Activate the Tauri mock.
 */
export function mockTauri() {
  console.warn(`@NOTE: Mocking Tauri APIs`);
  const mock = new BrowserMock();

  // Smush mocks over the top of __TAURI__INTERNALS__, but don't
  // smush anything that may happen to already exist (reverse merge)
  const TauriInternals = (window as any).__TAURI_INTERNALS__;
  (window as any).__TAURI_INTERNALS__ = Object.assign({
    // @NOTE The `mockConvertFileSrc` function in Tauri's mock API
    // doesn't allow you to customise the behaviour 🤷‍♀️
    // So we have to mock it manually like this.
    convertFileSrc: mock.mockConvertFileSrc.bind(mock),
    metadata: Object.assign({
      currentWindow: Object.assign({
        label: MockEventSystem.windowLabel,
      }, TauriInternals?.metadata?.currentWindow),
      currentWebview: Object.assign({
        label: MockEventSystem.windowLabel,
      }, TauriInternals?.metadata?.currentWebview),
    }, TauriInternals?.metadata),
  }, TauriInternals);

  mockIPC((cmd, args) =>
    mock.handle(cmd, args)
  );
}