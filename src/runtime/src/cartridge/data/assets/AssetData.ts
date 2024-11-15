import type Resolver from "@fantasy-console/runtime/src/Resolver";
import { baseName, getFileExtension, toPathList } from "@fantasy-console/runtime/src/util";

import { AssetType } from "./AssetType";

export type AssetData = MeshAssetData | MeshSupplementaryAssetData | ScriptAssetData | SoundAssetData | TextureAssetData | UnknownAssetData;
export type AssetDataOfType<TAssetType extends AssetType> = Extract<AssetData, { type: TAssetType }>;

export function createAssetData(id: string, type: AssetType, path: string, resolverProtocol: string) {
  switch (type) {
    case AssetType.Mesh:
      return new MeshAssetData(id, path, resolverProtocol);
    case AssetType.MeshSupplementary:
      return new MeshSupplementaryAssetData(id, path, resolverProtocol);
    case AssetType.Script:
      return new ScriptAssetData(id, path, resolverProtocol);
    case AssetType.Sound:
      return new SoundAssetData(id, path, resolverProtocol);
    case AssetType.Texture:
      return new TextureAssetData(id, path, resolverProtocol);
    case AssetType.Unknown:
      return new UnknownAssetData(id, path, resolverProtocol);
    default:
      throw new Error(`Unimplemented AssetType: ${type}`);
  }
}

export abstract class BaseAssetData {
  /**
   * Unique ID for this asset.
   */
  public readonly id: string;
  /**
   * The path within the game data wherein this asset lies.
   * @NOTE This property is NOT for fetching the actual data.
   * See {@link babylonFetchUrl} instead.
   */
  public readonly path: string;
  /**
   * Protocol scheme for identifying which resolver handler should resolve this asset.
   * @see {@link Resolver}
   */
  private readonly resolverProtocol: string;

  public constructor(id: string, path: string, resolverProtocol: string) {
    this.id = id;
    this.path = path;
    this.resolverProtocol = resolverProtocol;
  }

  public toString(): string {
    return `Asset(${this.id}, ${this.type}, ${this.path})`
  }

  /**
   * File extension of this file. Includes the dot e.g. `.txt`.
   * Returns empty string if file has no extension.
   */
  public get fileExtension(): string {
    return getFileExtension(this.path);
  }

  /**
   * The URL from which this asset can be fetched by Babylon.
   * @NOTE different from {@link path}.
   */
  public get babylonFetchUrl(): string {
    return `${this.resolverProtocol}${this.path}`;
  }

  /**
   * The asset's virtual path as a list of string path segments,
   * excluding the file's base name itself.
   */
  public get pathList(): string[] {
    return toPathList(this.path);
  }

  /**
   * The filename of the asset. e.g. `sprite.png`
   */
  public get baseName(): string {
    return baseName(this.path);
  }

  public abstract get type(): AssetType;
}

export class MeshAssetData extends BaseAssetData {
  public readonly type: AssetType.Mesh = AssetType.Mesh;
}
export class MeshSupplementaryAssetData extends BaseAssetData {
  public readonly type: AssetType.MeshSupplementary = AssetType.MeshSupplementary;
}
export class ScriptAssetData extends BaseAssetData {
  public readonly type: AssetType.Script = AssetType.Script;
}
export class SoundAssetData extends BaseAssetData {
  public readonly type: AssetType.Sound = AssetType.Sound;
}
export class TextureAssetData extends BaseAssetData {
  public readonly type: AssetType.Texture = AssetType.Texture;
}
export class UnknownAssetData extends BaseAssetData {
  public readonly type: AssetType.Unknown = AssetType.Unknown;
}
