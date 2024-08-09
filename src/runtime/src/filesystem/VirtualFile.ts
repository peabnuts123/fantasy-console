export class VirtualFile {
  /** Raw bytes of this file. */
  public readonly bytes: ArrayBuffer;

  public constructor(bytes: ArrayBuffer) {
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
