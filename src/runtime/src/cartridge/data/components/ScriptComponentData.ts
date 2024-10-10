import type { ScriptAssetData } from "../assets/AssetData";
import { AssetType } from "../assets/AssetType";
import { ComponentData } from "./ComponentData";

/**
 * Configuration data for a custom component script written by the user.
 * i.e. loaded from the raw cartridge file but not yet loaded into the game.
 */
export class ScriptComponentData extends ComponentData {
  /** {@link ScriptAssetData} containing the script asset. */
  public readonly scriptAsset: ScriptAssetData;

  public constructor(id: string, scriptAsset: ScriptAssetData) {
    super(id);

    this.scriptAsset = scriptAsset;
  }
}
