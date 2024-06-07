import { VirtualFile, VirtualFileType } from "./VirtualFile";

/**
 * Files that live on a cartridge.
 */
export class VirtualFileSystem {
  private files: VirtualFile[];

  public constructor(files: VirtualFile[]) {
    this.files = files;
  }

  /**
   * Get a file by its virtual path.
   * @param path The virtual file path of the file to get.
   * @returns {} {@link VirtualFile} if one exists at `path`, `undefined` otherwise.
   */
  public tryGetByPath(path: string): VirtualFile | undefined {
    // @NOTE lo-fi canonicalisation hack using `decodeURIComponent`
    // Trim leading slashes from path
    let canonical = decodeURIComponent(new URL(path, "https://foo.bar").pathname).replace(/^\//, '');
    return this.files.find((file) => file.path === canonical);
  }

  /**
   * Get a file by its ID. Throws an error if no file exists with `id`.
   * @param id The ID of the file to get.
   * @param expectedType (Optional) Validation parameter. The expected type of this {@link VirtualFile}. An error will be thrown if the type does not match.
   * @throws If no file exists with `id`
   */
  public getById(id: number, expectedType: VirtualFileType | undefined = undefined): VirtualFile {
    const file = this.files.find((file) => file.id === id);
    if (!file) {
      throw new Error(`No file found with id: ${id}`);
    }
    if (expectedType !== undefined && file.type !== expectedType) {
      throw new Error(`File has incorrect type. Expected ${expectedType}. ${file}`);
    }
    return file;
  }

  public [Symbol.iterator](): Iterator<VirtualFile> {
    return this.files[Symbol.iterator]();
  }
}
