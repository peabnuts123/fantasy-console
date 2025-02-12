export function isRunningInBrowser(): boolean {
  return (window as any).__TAURI__ === undefined;
}

export function isRunningInTauri(): boolean {
  return (window as any).__TAURI__ !== undefined;
}
