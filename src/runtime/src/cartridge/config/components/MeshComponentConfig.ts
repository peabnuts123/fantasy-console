import type { MeshComponent } from '@fantasy-console/core/src/world/components';

import type { AssetConfig } from '../AssetConfig';
import { AssetType } from '../AssetType';

import { ComponentConfig } from "./ComponentConfig";


/**
 * Configuration data for a {@link MeshComponent}.
 * i.e. loaded from the raw cartridge file but not yet loaded into the game.
 */
export class MeshComponentConfig extends ComponentConfig {
  /**
   * {@link AssetConfig} containing the mesh asset.
   */
  public readonly meshAsset: AssetConfig;
  public constructor(meshAsset: AssetConfig) {
    super();

    // Validate
    // @NOTE a subclass would give us a guarantee here
    if (meshAsset.type !== AssetType.Mesh) {
      throw new Error(`Cannot construct MeshComponent from non-model asset ${meshAsset}`);
    }

    this.meshAsset = meshAsset;
  }
}