import { IFileSystem, VirtualFile } from "@fantasy-console/runtime/src/filesystem";

export const DebugFileSystemRoot: string = `/project`;

export class DebugFileSystem implements IFileSystem {
  private fileSystemRoot: string;

  public constructor() {
    this.fileSystemRoot = DebugFileSystemRoot;
  }

  public async getByPath(path: string): Promise<VirtualFile> {
    const result = await fetch(`${this.fileSystemRoot}/${path}`);
    const fileBytes = await result.arrayBuffer();
    return new VirtualFile(
      fileBytes
    );
  }
}
