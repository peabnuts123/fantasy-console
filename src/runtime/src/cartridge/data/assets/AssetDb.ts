import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';

import { ClassReference } from '@fantasy-console/core/src/util';
import type { AssetDefinition } from '@fantasy-console/runtime/src/cartridge/archive'
import { createDirView, getFileExtension } from "@fantasy-console/runtime/src/util";
import { IFileSystem, VirtualFile } from '@fantasy-console/runtime/src/filesystem';

import { createAssetData } from './AssetData';
import { AssetData } from './AssetData';
import { AssetType } from './AssetType';

export type AssetDbVirtualNode = AssetDbVirtualFile | AssetDbVirtualDirectory;

export interface AssetDbVirtualNodeBase {
  id: string;
  name: string;
}

export interface AssetDbVirtualFile extends AssetDbVirtualNodeBase {
  type: 'file';
  data: AssetData;
}

export interface AssetDbVirtualDirectory extends AssetDbVirtualNodeBase {
  type: 'directory';
}

const AssetTypeMap: Record<AssetType, string[]> = {
  [AssetType.Mesh]: ['.obj', '.fbx', '.gltf', '.glb', '.stl'],
  [AssetType.MeshSupplementary]: ['.mtl'],
  [AssetType.Script]: ['.ts', '.js'],
  [AssetType.Sound]: ['.mp3', '.ogg', '.wav'],
  [AssetType.Texture]: ['.png', '.jpg', '.jpeg', '.bmp', '.basis', '.dds'],
  [AssetType.Unknown]: []
}

export class AssetDb {
  public readonly assets: AssetData[];
  private readonly fileSystem: IFileSystem;

  public constructor(assetDefinitions: AssetDefinition[], fileSystem: IFileSystem) {
    this.fileSystem = fileSystem;
    this.assets = assetDefinitions.map((assetDefinition) => {
      return createAssetData(
        assetDefinition.id,
        AssetDb.getAssetType(assetDefinition),
        assetDefinition.path,
        fileSystem.resolverProtocol,
      );
    });
  }

  public getById<TAssetData extends AssetData>(
    assetId: string,
    ExpectedType: ClassReference<TAssetData>,
  ): TAssetData {
    const asset = this.assets.find((asset) => asset.id === assetId);
    if (asset === undefined) {
      throw new Error(`No asset found in AssetDb with Id: ${assetId}`);
    }

    if (!(asset instanceof ExpectedType)) {
      throw new Error(`Asset has incorrect type. Expected ${ExpectedType.name}. Found: ${asset.type}`);
    }

    return asset;
  }

  public async loadAsset(asset: AssetData): Promise<VirtualFile> {
    return this.fileSystem.readFile(asset.path);
  }

  /**
   * List files and directories within a given path inside the asset db.
   * @param pathList Path to show as a list of path segments.
   */
  public dir(pathList: string[]): AssetDbVirtualNode[] {
    return createDirView(
      this.assets,
      pathList,
      (asset) => asset.pathList,
      (asset) => ({
        id: asset.id,
        type: 'file',
        name: asset.baseName,
        data: asset,
      } satisfies AssetDbVirtualFile as AssetDbVirtualFile),
      (directoryName, asset) => ({
        id: asset.id,
        type: 'directory',
        name: directoryName,
      } satisfies AssetDbVirtualDirectory as AssetDbVirtualDirectory),
    )
  }

  /**
   * Resolve the type of asset.
   * @param asset
   */
  public static getAssetType(asset: AssetDefinition): AssetType {
    const fileExtension = getFileExtension(asset.path);

    for (const type of Object.values(AssetType)) {
      if (AssetTypeMap[type].includes(fileExtension)) {
        return type;
      }
    }

    if (SceneLoader.IsPluginForExtensionAvailable(fileExtension)) {
      const babylonPlugin = SceneLoader.GetPluginForExtension(fileExtension);
      console.warn(`Asset with extension '${fileExtension}' is being assigned asset type '${AssetType.Unknown}' despite asset having a well-known Babylon loader: ${babylonPlugin.name}`);
    }

    return AssetType.Unknown;
  }
}
