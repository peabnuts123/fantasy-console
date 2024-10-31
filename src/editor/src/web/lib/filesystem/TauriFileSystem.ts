import { convertFileSrc } from '@tauri-apps/api/core';
import { readFile } from '@tauri-apps/plugin-fs';

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
    const fileBytes = await readFile(`${this.projectRootDir}/${path}`)
    return new VirtualFile(fileBytes);
  }
}