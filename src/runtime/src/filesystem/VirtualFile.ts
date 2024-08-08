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
   * "Object URL" that can be used to fetch this file. Created with `URL.createObjectURL()`.
   */
  public get url(): string {
    const objectUrl = URL.createObjectURL(new Blob([this.bytes]));
    // @NOTE release object URL after 10 seconds
    // Is this chill?
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 10_000);
    return objectUrl;
  }
}
