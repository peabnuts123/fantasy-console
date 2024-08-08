import { Unzipped } from "fflate";

import { IFileSystem } from "./IFileSystem";
import { VirtualFile } from "./VirtualFile";

export class CartridgeFileSystem implements IFileSystem {
  private readonly cartridgeData: Unzipped;

  public constructor(cartridgeData: Unzipped) {
    this.cartridgeData = cartridgeData;
  }

  public getByPath(path: string): Promise<VirtualFile> {
    return Promise.resolve(this.getByPathSync(path));
  }

  public getByPathSync(path: string): VirtualFile {
    let fileBytes = this.cartridgeData[path];
    if (!fileBytes) {
      throw new NotFoundError(`No file found at path: '${path}'`);
    }
    return new VirtualFile(fileBytes);
  }
}

export class NotFoundError extends Error {
}