
export class MockWindowSystem {
  public static openWindows: Record<string, Window> = {};

  public static open(url: string, name: string): void {
    if (this.openWindows[name]) {
      throw new Error(`Attempted to open new web view with the same name: '${name}'`);
    }

    const width = 640;
    const height = 480;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    const webview = window.open(url, name, `width=${width},height=${height},popup=true,left=${left},top=${top}`)!;

    // Wait for modal to load
    webview.addEventListener('load', () => {
      // Store in dictionary
      this.openWindows[name] = webview;

      // Bind "onClose" event
      webview.addEventListener('beforeunload', (_e) => {
        delete this.openWindows[name];
      });
    });
  }

  public static close(name: string): void {
    // @TODO if we have child windows closing each other, we'll need to make the `main` window
    //  coordinate this through channel messages (because it is just a local cache)
    const webview = MockWindowSystem.openWindows[name];
    if (!webview) {
      throw new Error(`Could not close webview with name '${name}' - No window is open with this name`);
    }
    webview.close();
  }
}
