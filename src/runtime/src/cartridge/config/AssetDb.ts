import type { AssetDefinition } from '@fantasy-console/runtime/src/cartridge/archive'
import type { IFileSystem } from '@fantasy-console/runtime/src/filesystem'

import { AssetConfig } from './AssetConfig';
import type { AssetType } from './AssetType';

export class AssetDb {
  public readonly assets: AssetConfig[];

  public constructor(assets: AssetConfig[]) {
    this.assets = assets;
  }

  public getById(assetId: string, expectedType: AssetType): AssetConfig {
    const asset = this.assets.find((asset) => asset.id === assetId);
    if (asset === undefined) {
      throw new Error(`No asset found in AssetDb with Id: ${assetId}`);
    }
    if (asset.type !== expectedType) {
      throw new Error(`Asset has incorrect type. Expected ${expectedType}. Found: ${asset.type}`);
    }

    return asset;
  }

  public getByPath(path: string): AssetConfig {
    const asset = this.assets.find((asset) => asset.path === path);
    if (asset === undefined) {
      throw new Error(`No asset found in AssetDb with path: ${path}`);
    }
    return asset;
  }

  public static async build(assetDefinitions: AssetDefinition[], filesystem: IFileSystem, assetResolverProtocol: string): Promise<AssetDb> {
    const assets = await Promise.all(
      assetDefinitions.map(async (assetDefinition) => {
        const file = await filesystem.getByPath(assetDefinition.path);
        return new AssetConfig(
          assetDefinition.id,
          assetDefinition.type,
          assetDefinition.path,
          file,
          assetResolverProtocol,
        );
      })
    );

    return new AssetDb(assets);
  }
}
