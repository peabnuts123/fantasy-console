import { convertFileSrc } from '@tauri-apps/api/tauri';
import { readBinaryFile } from '@tauri-apps/api/fs';

import { IFileSystem, VirtualFile } from "@fantasy-console/runtime/src/filesystem";

export class TauriFileSystem extends IFileSystem {
  private projectRootDir: string;

  public constructor(projectRootDir: string) {
    super(`pzedfs`);
    this.projectRootDir = projectRootDir;
  }

  public getUrlForPath(path: string): string {
    return convertFileSrc(`${this.projectRootDir}/${path}`);
  }

  public async readFile(path: string): Promise<VirtualFile> {
    const fileBytes = await readBinaryFile(`${this.projectRootDir}/${path}`)
    return new VirtualFile(fileBytes);
  }
}