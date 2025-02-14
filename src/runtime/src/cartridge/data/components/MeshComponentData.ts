import type { MeshComponent } from '@polyzone/runtime/src/world/components';

import type { MeshAssetData } from '../assets/AssetData';

import { ComponentData } from "./ComponentData";

/**
 * Configuration data for a {@link MeshComponent}.
 * i.e. loaded from the raw cartridge file but not yet loaded into the game.
 */
export class MeshComponentData extends ComponentData {
  /** {@link AssetData} containing the mesh asset. */
  public readonly meshAsset?: MeshAssetData;

  public constructor(id: string, meshAsset?: MeshAssetData) {
    super(id);

    this.meshAsset = meshAsset;
  }
}
