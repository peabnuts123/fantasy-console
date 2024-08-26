import type { AssetDefinition } from '@fantasy-console/runtime/src/cartridge/archive'

import { IFileSystem, VirtualFile } from '../../filesystem';
import { AssetConfig } from './AssetConfig';
import type { AssetType } from './AssetType';

export interface AssetDbVirtualNode {
  type: 'file' | 'directory';
  name: string;
}
export interface AssetDbVirtualFile extends AssetDbVirtualNode {
  type: 'file';
  asset: AssetConfig;
}

export interface AssetDbVirtualDirectory extends AssetDbVirtualNode {
  type: 'directory';
}

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

  /**
   * List files and directories within a given path inside the asset db.
   * @param pathList Path to show as a list of path segments.
   */
  public dir(pathList: string[]): AssetDbVirtualNode[] {
    // Find all assets that are at this node or below
    const assetsMatchingPrefix = this.assets.filter((asset) => {
      const assetPath = asset.pathList;

      for (let i = 0; i < pathList.length; i++) {
        if (assetPath[i] != pathList[i]) {
          return false;
        }
      }

      return true;
    });

    // Map nodes into files and directories that are inside this path
    let files: AssetDbVirtualFile[] = [];
    let directories: AssetDbVirtualDirectory[] = [];

    assetsMatchingPrefix.forEach((asset) => {
      let assetPath = asset.pathList.slice(pathList.length);

      if (assetPath.length === 0) {
        // Asset is a file in the directory
        files.push({
          type: 'file',
          name: asset.baseName,
          asset,
        });
      } else {
        // Asset is in a subdirectory
        const subDirectoryName = assetPath[0];
        // Check if we already know about this directory first
        if (!directories.some((directory) => directory.name === subDirectoryName)) {
          directories.push({
            type: 'directory',
            name: subDirectoryName,
          });
        }
      }
    });

    return [
      ...directories,
      ...files,
    ];
  }
}
