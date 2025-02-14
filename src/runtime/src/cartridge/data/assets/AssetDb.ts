import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';

import { ClassReference } from '@polyzone/core/src/util';
import type { AssetDefinition } from '@polyzone/runtime/src/cartridge/archive'
import { getFileExtension } from "@polyzone/runtime/src/util";
import type { IFileSystem, VirtualFile } from '@polyzone/runtime/src/filesystem';

import { createAssetData } from './AssetData';
import type { AssetData } from './AssetData';
import { AssetType } from './AssetType';

// @NOTE Keep in sync with Rust backend
// See: src/editor/src/app/src/filesystem.rs
// @TODO Could we get this data from the rust backend
export const AssetTypeMap: Record<AssetType, string[]> = {
  [AssetType.Mesh]: ['.obj', '.fbx', '.gltf', '.glb', '.stl'],
  [AssetType.MeshSupplementary]: ['.mtl'],
  [AssetType.Script]: ['.ts', '.js'],
  [AssetType.Sound]: ['.mp3', '.ogg', '.wav'],
  [AssetType.Texture]: ['.png', '.jpg', '.jpeg', '.bmp', '.basis', '.dds'],
  [AssetType.Unknown]: []
}

export class AssetDb {
  public readonly assets: AssetData[];
  public readonly fileSystem: IFileSystem;

  public constructor(assetDefinitions: AssetDefinition[], fileSystem: IFileSystem) {
    this.fileSystem = fileSystem;
    this.assets = assetDefinitions.map((assetDefinition) => {
      return createAssetData(
        AssetDb.getAssetType(assetDefinition),
        {
          id: assetDefinition.id,
          path: assetDefinition.path,
          resolverProtocol: fileSystem.resolverProtocol,
        }
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
