import { Unzipped } from "fflate";
import { CartridgeArchiveManifest } from "./CartridgeArchiveManifest";
import { CartridgeArchiveFileReference } from "./CartridgeArchiveFileReference";
import { VirtualFileSystem } from "../config/VirtualFileSystem";
import { VirtualFile, VirtualFileType } from "../config/VirtualFile";

export const CARTRIDGE_MANIFEST_FILENAME = 'manifest.json';

/**
 * The raw archive file of a {@link Cartridge}.
 */
export class CartridgeArchive {
  private unzippedData: Unzipped;

  public constructor(unzippedData: Unzipped) {
    this.unzippedData = unzippedData;
  }

  /**
   * The cartridge manifest defining all the data of the game.
   */
  public get manifest(): CartridgeArchiveManifest {
    let manifestBytes = this.unzippedData[CARTRIDGE_MANIFEST_FILENAME];
    return JSON.parse(new TextDecoder().decode(manifestBytes));
  }

  /**
   * Get the bytes of a {@link VirtualFile} inside this archive.
   * @param path Virtual file path of the file to get.
   * @returns Bytes of virtual file.
   */
  public getFile(path: string): Uint8Array {
    let fileBytes = this.unzippedData[path];
    if (!fileBytes) {
      throw new Error(`No file found at path: '${path}'`);
    }
    return fileBytes;
  }

  /**
   * Construct a {@link VirtualFileSystem} from a set of references to files within this archive.
   * @param fileReferences Array of file references to include in the {@link VirtualFileSystem}
   */
  public createVirtualFileSystem(fileReferences: CartridgeArchiveFileReference[]): VirtualFileSystem {
    let files = fileReferences.map((fileReference) => {
      let fileBytes = this.getFile(fileReference.path);
      return new VirtualFile(fileReference.id, fileReference.type, fileReference.path, fileBytes);
    });
    return new VirtualFileSystem(files);
  }
}
