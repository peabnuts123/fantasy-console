import { File, FileSystem } from '@app/engine/composer/filesystem';
import { AssetDefinition } from './project/AssetDefinition';
import { AssetType } from './project/AssetType';

export class AssetDb {
  private filesystem: FileSystem;
  private assets: AssetDefinition[];

  public constructor(filesystem: FileSystem, assets: AssetDefinition[]) {
    this.filesystem = filesystem;
    this.assets = assets;
  }

  public async getById(assetId: string, expectedType: AssetType): Promise<File> {
    const asset = this.assets.find((asset) => asset.id === assetId);
    if (asset === undefined) {
      throw new Error(`No asset found in AssetDb with Id: ${assetId}`);
    }
    if (asset.type !== expectedType) {
      throw new Error(`Asset has incorrect type. Expected ${expectedType}. Found: ${asset.type}`);
    }

    return this.filesystem.getByPath(asset.path);
  }
}
