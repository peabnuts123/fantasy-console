import { VirtualFile } from "./VirtualFile";

export abstract class IFileSystem {
  public readonly resolverProtocol: string;

  protected constructor(resolverProtocolPrefix: string) {
    const uniqueId = generateUniqueId();
    this.resolverProtocol = `${resolverProtocolPrefix}-${uniqueId}://`;
  }

  public abstract getUrlForPath(path: string): string;
  public abstract readFile(path: string): Promise<VirtualFile>;
}

function generateUniqueId(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('');
}