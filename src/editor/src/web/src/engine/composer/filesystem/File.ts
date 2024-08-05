export class File {
  public readonly path: string;
  public readonly bytes: ArrayBuffer;

  public constructor(path: string, bytes: ArrayBuffer) {
    this.path = path;
    this.bytes = bytes;
  }
}