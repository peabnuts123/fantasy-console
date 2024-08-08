import { SceneDb } from "./SceneDb";
import { AssetDb } from "./AssetDb";

/**
 * A loaded game Cartridge, containing all the data for the entire game.
 */
export class Cartridge {
  // @TODO game manifest (e.g. game title)
  public readonly sceneDb: SceneDb;
  public readonly assetDb: AssetDb;

  public constructor(sceneDb: SceneDb, assetDb: AssetDb) {
    this.sceneDb = sceneDb;
    this.assetDb = assetDb;
  }
}