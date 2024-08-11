import { Unzipped, unzip } from 'fflate';

export * from './archive';
export * from './config';

import { RuntimeAssetResolverProtocol } from '../constants';
import { CartridgeArchive } from './archive/CartridgeArchive';
import { AssetDb, Cartridge, SceneDb } from './config';


export async function readCartridgeArchive(cartridgeBytes: ArrayBuffer): Promise<CartridgeArchive> {
  const cartridgeData = await new Promise<Unzipped>((resolve, reject) => {
    unzip(new Uint8Array(cartridgeBytes), (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  return new CartridgeArchive(cartridgeData);
}

/**
 * Fetch and parse a {@link CartridgeArchive} file from a URL.
 * @param url URL for the cartridge archive file
 */
export async function fetchCartridge(url: string): Promise<CartridgeArchive> {
  const response = await fetch(url);
  const cartridgeBytes = await response.arrayBuffer();
  console.log(`Got cartridge data: ${Math.round(cartridgeBytes.byteLength / 1024)}kb`);

  return readCartridgeArchive(cartridgeBytes);
}

/**
 * Load raw data defined in a {@link CartridgeArchive} into a usable format that
 * can be loaded into the game.
 * @param cartridgeArchive {@link CartridgeArchive} file to load.
 */
export async function loadCartridge(cartridgeArchive: CartridgeArchive): Promise<Cartridge> {
  // @TODO validate DTO
  const cartridgeManifest = cartridgeArchive.manifest;

  const assetDb = new AssetDb(cartridgeManifest.assets, cartridgeArchive.fileSystem, RuntimeAssetResolverProtocol);
  const sceneDb = new SceneDb(cartridgeManifest.scenes, assetDb);

  return new Cartridge(sceneDb, assetDb);
}
