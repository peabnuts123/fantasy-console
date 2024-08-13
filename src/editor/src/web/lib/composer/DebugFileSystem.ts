import { IFileSystem, VirtualFile } from "@fantasy-console/runtime/src/filesystem";

export const DebugFileSystemRoot: string = `/project`;

/*
  @TODO In the near future we will write a file system
  based on Tauri.
  We will probably use this for resolving paths:
    https://tauri.app/v1/api/js/tauri/#convertfilesrc

  and we'll probably have to do similar things for reading files too
 */

export class DebugFileSystem implements IFileSystem {
  private fileSystemRoot: string;

  public constructor() {
    this.fileSystemRoot = DebugFileSystemRoot;
  }

  public getUrlForPath(path: string): string {
    return `${this.fileSystemRoot}/${path}`;
  }

  public async readFile(path: string): Promise<VirtualFile> {
    const url = this.getUrlForPath(path);
    const result = await fetch(url);
    const fileBytes = await result.arrayBuffer();
    return new VirtualFile(
      new Uint8Array(fileBytes),
    );
  }
}
