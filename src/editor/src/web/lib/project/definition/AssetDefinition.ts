import { AssetDefinition as RuntimeAssetDefinition } from '@polyzone/runtime/src/cartridge/archive';

export interface AssetDefinition extends RuntimeAssetDefinition {
  hash: string;
}
