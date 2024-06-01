import { Tools } from '@babylonjs/core';
import { VirtualFileSystem } from './cartridge';

/**
 * Wrapper around Babylon URL resolving to read files from
 * a cartridge's virtual file system instead of external URLs.
 */
class Resolver {
  private virtualFileSystem: VirtualFileSystem | undefined;

  constructor() {
    Tools.PreprocessUrl = this.resolve.bind(this);
  }

  /**
   * Process URLs from Babylon. References to files in the currently bound
   * {@link VirtualFileSystem} will by resolved through that, otherwise URLs
   * will be unmodified.
   * @param url The URL to resolve.
   */
  private resolve(url: string): string {
    // If no binding exists, do nothing
    if (this.virtualFileSystem === undefined) {
      return url;
    }

    // See if request is to a path in the current virtual filesystem
    // If it matches a file, return that instead
    let virtualFile = this.virtualFileSystem.tryGetByPath(url);
    if (virtualFile !== undefined) {
      return virtualFile.url;
    }

    // No match, return unmodified URL
    return url;
  }

  /**
   *
   * @param virtualFileSystem {@link VirtualFileSystem} to bind URL resolution to.
   */
  public bindTo(virtualFileSystem: VirtualFileSystem) {
    this.virtualFileSystem = virtualFileSystem;
  }

  /**
   * Remove any binding to a {@link VirtualFileSystem}.
   */
  public clearBinding() {
    this.virtualFileSystem = undefined;
  }
}

export default new Resolver();