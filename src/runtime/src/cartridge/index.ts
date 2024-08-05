import { Unzipped, unzip } from 'fflate';

export * from './archive';
export * from './config';

import { CartridgeArchive } from './archive/CartridgeArchive';
import { Cartridge } from './config/Cartridge';
import { SceneConfig } from './config/SceneConfig';


/**
 * Fetch and parse a {@link CartridgeArchive} file from a URL.
 * @param url URL for the cartridge archive file
 */
export async function fetchCartridge(url: string): Promise<CartridgeArchive> {
  const response = await fetch(url);
  const cartridgeBytes = await response.arrayBuffer();
  console.log(`Got cartridge data: ${Math.round(cartridgeBytes.byteLength / 1024)}kb`);

  const cartridgeData = await new Promise<Unzipped>((resolve, reject) => {
    unzip(new Uint8Array(cartridgeBytes), (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  return new CartridgeArchive(cartridgeData);
}

/**
 * Load raw data defined in a {@link CartridgeArchive} into a usable format that
 * can be loaded into the game.
 * @param cartridgeArchive {@link CartridgeArchive} file to load.
 */
export async function loadCartridge(cartridgeArchive: CartridgeArchive): Promise<Cartridge> {
  // @TODO validate DTO
  const cartridgeDefinition = cartridgeArchive.manifest;

  // Read the files in the manifest into a virtual file system from cartridge archive data
  const fileSystem = cartridgeArchive.createVirtualFileSystem(cartridgeDefinition.files);

  // Build cartridge from definition
  const scenes: SceneConfig[] = [];
  for (let sceneDefinition of cartridgeDefinition.scenes) {
    scenes.push(new SceneConfig(sceneDefinition, fileSystem));
  }

  return new Cartridge(scenes, fileSystem);
}
