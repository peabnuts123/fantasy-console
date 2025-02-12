import { AssetDefinition as RuntimeAssetDefinition } from '@fantasy-console/runtime/src/cartridge/archive';

export interface AssetDefinition extends RuntimeAssetDefinition {
  hash: string;
}
