export class VirtualFile {
  /** Raw bytes of this file. */
  public readonly bytes: Uint8Array;

  public constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  public toString(): string {
    return `VirtualFile(${this.bytes.byteLength} bytes)`;
  }

  /**
   * The contents of this file, as UTF-8 encoded text.
   */
  public get textContent(): string {
    return new TextDecoder('utf-8').decode(this.bytes);
  }
}
