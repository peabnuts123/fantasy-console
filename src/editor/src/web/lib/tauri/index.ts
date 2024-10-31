export function isRunningInBrowser() {
  return (window as any).__TAURI__ === undefined;
}

export function isRunningInTauri() {
  return (window as any).__TAURI__ !== undefined;
}
