import { unzip, zip } from 'fflate';

import { TauriCommandArgs, TauriCommandReturnType } from '@lib/util/TauriCommands';

import { Paths } from "../config";
import { promisify, throwUnhandled } from '../util';

const unzipAsync = promisify(unzip);
const zipAsync = promisify(zip);

export class PolyZoneMockModule {
  public static handle(action: string, args: any) {
    switch (action) {
      case 'create_cartridge':
        return this.mockCreateCartridge(args);
      case 'start_watching_project_files':
        return this.mockStartWatchingProjectFiles(args);
      case 'stop_watching_project_assets':
        return this.mockStopWatchingProjectAssets();
      case 'load_project':
        return this.mockLoadProject(args);
      case 'unload_project':
        return this.mockUnloadProject();
      case 'hash_data':
        throw this.mockHashData(args);
      case 'set_path_is_busy':
        return this.mockSetPathIsBusy(args);
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
  public static async mockCreateCartridge(...args: TauriCommandArgs<'create_cartridge'>): Promise<TauriCommandReturnType<'create_cartridge'>> {
    const { manifestFileBytes } = args[0];
    const result = await fetch(Paths.MockCartridgeFile);
    if (result.ok) {
      const cartridgeBytes = await result.arrayBuffer();
      const cartridgeData = await unzipAsync(new Uint8Array(cartridgeBytes));
      cartridgeData['manifest.json'] = new TextEncoder().encode(manifestFileBytes);
      const resultBytes = await zipAsync(cartridgeData);
      return Array.from(resultBytes);
    } else {
      throw throwUnhandled(`[PolyZoneMockModule] (create_cartridge) Failed fetching mock cartridge: `, result);
    }
  }

  public static async mockLoadProject(..._args: TauriCommandArgs<'load_project'>): Promise<TauriCommandReturnType<'load_project'>> {
    // @NOTE No-op.
  }

  public static async mockUnloadProject(..._args: TauriCommandArgs<'unload_project'>): Promise<TauriCommandReturnType<'unload_project'>> {
    // @NOTE No-op.
  }

  public static async mockStartWatchingProjectFiles(...{ }: TauriCommandArgs<'start_watching_project_files'>): Promise<TauriCommandReturnType<'start_watching_project_files'>> {
    console.warn(`[PolyZoneMockModule] (start_watching_project_files) Tauri is mocked - project files will not be watched`);
    return "This command is mocked";
  }

  public static async mockStopWatchingProjectAssets(...{ }: TauriCommandArgs<'stop_watching_project_assets'>): Promise<TauriCommandReturnType<'stop_watching_project_assets'>> {
    // @NOTE No-op.
  }

  public static async mockHashData(..._args: TauriCommandArgs<'hash_data'>): Promise<TauriCommandReturnType<'hash_data'>> {
    return '6f86d7a9413a517d';
  }

  public static async mockSetPathIsBusy(...args: TauriCommandArgs<'set_path_is_busy'>): Promise<TauriCommandReturnType<'set_path_is_busy'>> {
    // @NOTE No-op.
  }
}
