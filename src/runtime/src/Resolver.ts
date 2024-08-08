import { Tools } from '@babylonjs/core/Misc/tools';
import { AssetDb } from './cartridge';

/**
 * Wrapper around Babylon URL resolving to read files from
 * a cartridge's virtual file system instead of external URLs.
 */
class Resolver {
  private assetDatabases: Map<string, AssetDb>;

  constructor() {
    Tools.PreprocessUrl = this.resolve.bind(this);
    this.assetDatabases = new Map();
  }

  /**
   * Process URLs from Babylon. References to files in the matching
   * {@link AssetDb} (determined by a URL protocol prefix) will by resolved through that, otherwise URLs
   * will be unmodified.
   * @param url The URL to resolve.
   */
  private resolve(url: string): string {
    for (let [protocol, assetDb] of this.assetDatabases) {
      if (url.startsWith(protocol)) {
        // @NOTE lo-fi canonicalisation hack using `decodeURIComponent` + trim leading slash
        // @NOTE crazy bug in browsers (!) non-http protocols are not parsed correctly,
        //  so we must strip the protocol off the URL. See: https://issues.chromium.org/issues/40063064
        let canonical = decodeURIComponent(
          new URL(url.substring(protocol.length), 'http://foo.bar').pathname
        ).replace(/^\//, '');

        const asset = assetDb.getByPath(canonical);
        return asset.file.url;
      }
    }

    // No matching asset DB, return unmodified URL
    return url;
  }

  /**
   * Register an AssetDB that will be used to resolve Urls for a given a URL protocol.
   * @param protocol Url protocol prefix like `runtime://`
   * @param assetDb AssetDb for resolving Urls with this protocol
   */
  public registerAssetDb(protocol: string, assetDb: AssetDb) {
    if (!/^\w+:\/\/$/.test(protocol)) {
      throw new Error(`Protocol must be in the format 'foo://'`);
    }
    if (this.assetDatabases.has(protocol)) {
      throw new Error(`Resolver already has handler for protocol: ${protocol}`)
    }
    this.assetDatabases.set(protocol, assetDb);
  }

  public deregisterAssetDb(protocol: string) {
    this.assetDatabases.delete(protocol);
  }
}

export default new Resolver();
