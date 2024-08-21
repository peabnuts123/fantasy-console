import type { AssetDefinition } from '@fantasy-console/runtime/src/cartridge/archive'

import { IFileSystem, VirtualFile } from '../../filesystem';
import { AssetConfig } from './AssetConfig';
import type { AssetType } from './AssetType';

export class AssetDb {
  public readonly assets: AssetConfig[];
  private readonly fileSystem: IFileSystem;

  public constructor(assetDefinitions: AssetDefinition[], fileSystem: IFileSystem) {
    this.fileSystem = fileSystem;
    this.assets = assetDefinitions.map((assetDefinition) => {
      return new AssetConfig(
        assetDefinition.id,
        assetDefinition.type,
        assetDefinition.path,
        fileSystem.resolverProtocol,
      );
    });
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

  public async loadAsset(asset: AssetConfig): Promise<VirtualFile> {
    return this.fileSystem.readFile(asset.path);
  }
}
