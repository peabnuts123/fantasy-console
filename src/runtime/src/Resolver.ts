import { Tools } from '@babylonjs/core/Misc/tools';
import { IFileSystem } from './filesystem';

/**
 * Wrapper around Babylon URL resolving to read files from
 * a cartridge's virtual file system instead of external URLs.
 */
class Resolver {
  private fileSystems: Map<string, IFileSystem>;

  constructor() {
    Tools.PreprocessUrl = this.resolve.bind(this);
    this.fileSystems = new Map();
  }

  /**
   * Process URLs from Babylon. References to files in the matching
   * {@link AssetDb} (determined by a URL protocol prefix) will by resolved through that, otherwise URLs
   * will be unmodified.
   * @param url The URL to resolve.
   */
  private resolve(url: string): string {
    for (let [protocol, fileSystem] of this.fileSystems) {
      if (url.startsWith(protocol)) {
        // @NOTE lo-fi canonicalisation hack using `decodeURIComponent` + trim leading slash
        // @NOTE crazy bug in browsers (!) non-http protocols are not parsed correctly,
        //  so we must strip the protocol off the URL. See: https://issues.chromium.org/issues/40063064
        let canonical = decodeURIComponent(
          new URL(url.substring(protocol.length), 'http://foo.bar').pathname
        ).replace(/^\//, '');

        return fileSystem.getUrlForPath(canonical);
      }
    }

    // No matching asset DB, return unmodified URL
    return url;
  }

  /**
   * Register an AssetDB that will be used to resolve Urls for a given a URL protocol.
   * @param protocol Url protocol prefix like `runtime://`
   * @param fileSystem AssetDb for resolving Urls with this protocol
   */
  public registerFileSystem(fileSystem: IFileSystem) {
    if (this.fileSystems.has(fileSystem.resolverProtocol)) {
      console.error(`fileSystem is already registered in Resolver: ${fileSystem.resolverProtocol}`)
    }
    this.fileSystems.set(fileSystem.resolverProtocol, fileSystem);
  }

  public deregisterFileSystem(protocol: string) {
    this.fileSystems.delete(protocol);
  }
}

export default new Resolver();
