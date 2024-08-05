export class File {
  public readonly path: string;
  public readonly bytes: ArrayBuffer;

  public constructor(path: string, bytes: ArrayBuffer) {
    this.path = path;
    this.bytes = bytes;
  }

  /**
   * File extension of this file. Includes the dot e.g. `.txt`.
   * Returns empty string if file has no extension.
   */
  public get extension(): string {
    let match = /\.[^.]+$/.exec(this.path);
    if (match === null) {
      return '';
    } else {
      return match[0];
    }
  }
}