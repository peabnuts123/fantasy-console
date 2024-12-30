import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';

import { ClassReference } from '@fantasy-console/core/src/util';
import { getFileExtension } from "@fantasy-console/runtime/src/util";
import type { IFileSystem, VirtualFile } from '@fantasy-console/runtime/src/filesystem';
import { AssetType, AssetTypeMap } from '@fantasy-console/runtime/src/cartridge/data';

import { AssetData, createAssetData } from './data/AssetData';
import { makeAutoObservable } from 'mobx';
import { AssetDefinition } from './definition';


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

export class AssetDb {
  private readonly assets: AssetData[];
  public readonly fileSystem: IFileSystem;

  public constructor(assetDefinitions: AssetDefinition[], fileSystem: IFileSystem) {
    this.fileSystem = fileSystem;
    this.assets = assetDefinitions.map((assetDefinition) => {
      return createAssetData(
        AssetDb.getAssetType(assetDefinition),
        {
          id: assetDefinition.id,
          path: assetDefinition.path,
          hash: assetDefinition.hash,
          resolverProtocol: fileSystem.resolverProtocol,
        },
      );
    });

    makeAutoObservable(this);
  }

  public getAll(): AssetData[] {
    return this.assets;
  }

  // @TODO I think this should return `undefined` and the caller should handle that
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

  public findById(assetId: string) {
    return this.assets.find((asset) => asset.id === assetId);
  }

  public add(asset: AssetData) {
    this.assets.push(asset);
  }

  public remove(assetId: string) {
    const assetIndex = this.assets.findIndex((asset) => asset.id === assetId);
    if (assetIndex === -1) {
      console.warn(`[AssetDb] (remove) Could not remove asset with ID '${assetId}' from AssetDb - no asset exists with this ID`);
      return;
    }
    this.assets.splice(assetIndex, 1);
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
