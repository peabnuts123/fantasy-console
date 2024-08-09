import { Unzipped } from "fflate";

import { CartridgeFileSystem } from '@fantasy-console/runtime/src/filesystem';

import { CartridgeArchiveManifest } from "./CartridgeArchiveManifest";

export const CARTRIDGE_MANIFEST_FILENAME = 'manifest.json';

/**
 * The raw archive file of a {@link Cartridge}.
 */
export class CartridgeArchive {
  public readonly fileSystem: CartridgeFileSystem;

  public constructor(unzippedData: Unzipped) {
    this.fileSystem = new CartridgeFileSystem(unzippedData);
  }

  /**
   * The cartridge manifest defining all the data of the game.
   */
  public get manifest(): CartridgeArchiveManifest {
    const file = this.fileSystem.readFileSync(CARTRIDGE_MANIFEST_FILENAME);
    const json = new TextDecoder().decode(file.bytes);
    return JSON.parse(json) as CartridgeArchiveManifest;
  }
}
