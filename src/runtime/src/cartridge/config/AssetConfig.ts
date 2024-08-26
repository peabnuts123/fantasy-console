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
   * See {@link babylonFetchUrl} instead.
   */
  public readonly path: string;
  /**
   * Protocol scheme for identifying which resolver handler should resolve this asset.
   * @see {@link Resolver}
   */
  private readonly resolverProtocol: string;

  public constructor(id: string, type: AssetType, path: string, resolverProtocol: string) {
    this.id = id;
    this.type = type;
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
    let match = /\.[^.]+$/.exec(this.path);
    if (match === null) {
      return '';
    } else {
      return match[0];
    }
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
    const pathSegments = this.path.split(/\/+/g);
    // Drop the basename from the path
    pathSegments.pop();
    return pathSegments;
  }

  /**
   * The filename of the asset. e.g. `sprite.png`
   */
  public get baseName(): string {
    return this.path.split(/\/+/g).pop()!;
  }
}
