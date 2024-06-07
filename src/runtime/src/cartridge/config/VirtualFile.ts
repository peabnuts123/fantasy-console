
export enum VirtualFileType {
  Model = 0,
  Texture = 1,
  Script = 2,
}

/**
 * A file in a {@link Cartridge}'s {@link VirtualFileSystem}.
 */
// @TODO should we subclass this instead of using `type` ?
export class VirtualFile {
  /** Unique ID for this file. */
  public readonly id: number;
  /** Type of this file (e.g. Script, Model, etc.) */
  public readonly type: VirtualFileType;
  /** Virtual path of this file. */
  public readonly path: string;
  /** Raw bytes of this file. */
  public readonly bytes: ArrayBuffer;
  /**
   * "Object URL" that can be used to fetch this file. Created with `URL.createObjectURL()`.
   */
  public readonly url: string;

  public constructor(id: number, type: VirtualFileType, path: string, bytes: Uint8Array) {
    this.id = id;
    this.type = type;
    this.path = path;
    this.bytes = bytes;
    // @NOTE create blob URLs for all files in the Virtual FS
    this.url = URL.createObjectURL(new Blob([bytes]));
  }

  public toString(): string {
    return `VirtualFile(${this.id}, ${this.type}, ${this.path})`;
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

