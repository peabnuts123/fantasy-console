import { makeObservable, observable } from "mobx";
import { AssetType } from "@fantasy-console/runtime/src/cartridge/data";
import { baseName, getFileExtension, toPathList } from "@fantasy-console/runtime/src/util";

export type AssetData = MeshAssetData | MeshSupplementaryAssetData | ScriptAssetData | SoundAssetData | TextureAssetData | UnknownAssetData;
export type AssetDataOfType<TAssetType extends AssetType> = Extract<AssetData, { type: TAssetType }>;

export interface CreateAssetDataArgs {
  id: string;
  path: string;
  hash: string;
  resolverProtocol: string;
}
export function createAssetData(type: AssetType, args: CreateAssetDataArgs): AssetData {
  switch (type) {
    case AssetType.Mesh:
      return new MeshAssetData(args);
    case AssetType.MeshSupplementary:
      return new MeshSupplementaryAssetData(args);
    case AssetType.Script:
      return new ScriptAssetData(args);
    case AssetType.Sound:
      return new SoundAssetData(args);
    case AssetType.Texture:
      return new TextureAssetData(args);
    case AssetType.Unknown:
      return new UnknownAssetData(args);
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
  public path: string;
  /**
   * Hash of the asset's content.
   */
  public hash: string;
  /**
   * Protocol scheme for identifying which resolver handler should resolve this asset.
   * @see {@link Resolver}
   */
  private readonly resolverProtocol: string;

  public constructor({ id, path, hash, resolverProtocol }: CreateAssetDataArgs) {
    this.id = id;
    this.path = path;
    this.hash = hash;
    this.resolverProtocol = resolverProtocol;

    makeObservable(this, {
      id: observable,
      path: observable,
      hash: observable,
    });
  }

  public toString(): string {
    return `Asset(${this.id}, ${this.type}, ${this.path})`;
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
