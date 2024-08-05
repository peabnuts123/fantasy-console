import type { FileSystem } from './FileSystem';
import { File } from './File';

export class DebugFileSystem implements FileSystem {
  private fileSystemRoot: string;

  public constructor() {
    this.fileSystemRoot = '/project';
  }

  public async getByPath(path: string): Promise<File> {
    const result = await fetch(`${this.fileSystemRoot}/${path}`);
    const fileBytes = await result.arrayBuffer();
    return new File(
      path,
      fileBytes
    );
  }
}
