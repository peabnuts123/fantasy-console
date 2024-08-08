import type { VirtualFile } from "@fantasy-console/runtime/src/filesystem";
import type Resolver from "@fantasy-console/runtime/src/Resolver";

import type { AssetType } from "./AssetType";

// @TODO We should probably just use inheritance instead of having a `type` property
export class AssetConfig {
  /**
   * Unique ID for this asset.
   */
  public readonly id: string;
  /**
   * Asset type.
   */
  public readonly type: AssetType;
  /**
   * The path within the game data wherein this asset lies.
   * @NOTE This property is NOT for fetching the actual data.
   * See {@link fetchUri} instead.
   */
  public readonly path: string;
  /**
   * The file data of this asset.
   */
  public readonly file: VirtualFile;
  /**
   * Protocol scheme for identifying which resolver handler should resolve this asset.
   * @see {@link Resolver}
   */
  private readonly resolverProtocol: string;

  public constructor(id: string, type: AssetType, path: string, file: VirtualFile, resolverProtocol: string) {
    this.id = id;
    this.type = type;
    this.path = path;
    this.file = file;
    this.resolverProtocol = resolverProtocol;
  }

  public toString(): string {
    return `Asset(${this.id}, ${this.type}, ${this.file})`
  }

  /**
   * File extension of this file. Includes the dot e.g. `.txt`.
   * Returns empty string if file has no extension.
   */
  public get fileExtension(): string {
    let match = /\.[^.]+$/.exec(this.path);
    if (match === null) {
      return '';
    } else {
      return match[0];
    }
  }

  /**
   * The URI from which this asset can be fetched.
   * @NOTE different from {@link path}.
   */
  public get fetchUri(): string {
    return `${this.resolverProtocol}${this.path}`;
  }
}
