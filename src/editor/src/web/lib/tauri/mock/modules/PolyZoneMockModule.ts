import { unzip, zip } from 'fflate';

import type { CreateCartridgeCmdArgs } from "@lib/composer/ComposerController";
import type { WatchProjectAssetsCommandArgs } from '@lib/project/ProjectAssetsWatcher';

import { Paths } from "../config";
import { promisify, throwUnhandled } from '../util';

const unzipAsync = promisify(unzip);
const zipAsync = promisify(zip);

export class PolyZoneMockModule {
  public static handle(action: string, args: any) {
    switch (action) {
      case 'create_cartridge':
        return this.mockCreateCartridge(args);
      case 'start_watching_project_assets':
        return this.mockStartWatchingProjectAssets(args);
      case 'stop_watching_project_assets':
        return this.mockStopWatchingProjectAssets(args);
      case 'load_project':
        return this.mockLoadProject(args);
      case 'unload_project':
        return this.mockUnloadProject(args);
      default:
        throw throwUnhandled(`[PolyZoneMockModule] (handle) Unimplemented action. (action='${action}') args: `, args);
    }
  }

  /**
   * @NOTE
   * Building a cartridge depends on Rust backend to fully function.
   * This mock requires a sample cartridge (built by the full app) to exist somewhere (specified by {@link Paths.MockCartridgeFile}).
   * This function reads that existing cartridge, replaces its manifest, and then
   * serves that result. This means you can make changes in the Composer and see them
   * reflected when playtesting, but changes to assets will not work.
   * If you add or remove an asset the game likely won't even run. You will have to rebuild
   * the mock cartridge using the full app first.
   */
  public static async mockCreateCartridge({ manifestFileBytes }: CreateCartridgeCmdArgs): Promise<Uint8Array> {
    const result = await fetch(Paths.MockCartridgeFile);
    if (result.ok) {
      const cartridgeBytes = await result.arrayBuffer();
      const cartridgeData = await unzipAsync(new Uint8Array(cartridgeBytes));
      cartridgeData['manifest.json'] = new TextEncoder().encode(manifestFileBytes);
      const resultBytes = await zipAsync(cartridgeData);
      return resultBytes;
    } else {
      throw throwUnhandled(`[PolyZoneMockModule] (create_cartridge) Failed fetching mock cartridge: `, result);
    }
  }

  public static async mockLoadProject(_args: any) {
    // @NOTE No-op.
  }

  public static async mockUnloadProject(_args: any) {
    // @NOTE No-op.
  }

  public static async mockStartWatchingProjectAssets({ }: WatchProjectAssetsCommandArgs): Promise<void> {
    console.warn(`[PolyZoneMockModule] (start_watching_project_assets) Tauri is mocked - project assets will not be watched`);
  }

  public static async mockStopWatchingProjectAssets({ }: WatchProjectAssetsCommandArgs): Promise<void> {
    // @NOTE No-op.
  }
}
