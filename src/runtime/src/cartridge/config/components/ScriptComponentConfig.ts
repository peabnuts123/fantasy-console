import type { AssetConfig } from "../AssetConfig";
import { AssetType } from "../AssetType";

import { ComponentConfig } from "./ComponentConfig";

/**
 * Configuration data for a custom component script written by the user.
 * i.e. loaded from the raw cartridge file but not yet loaded into the game.
 */
export class ScriptComponentConfig extends ComponentConfig {
  /**
   * {@link VirtualFile} containing the script asset.
   */
  public readonly scriptAsset: AssetConfig;
  public constructor(scriptAsset: AssetConfig) {
    super();

    // Validate
    if (scriptAsset.type !== AssetType.Script) {
      throw new Error(`Cannot construct ScriptComponent from non-script asset ${scriptAsset}`);
    }

    this.scriptAsset = scriptAsset;
  }
}
