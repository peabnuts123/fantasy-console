import { makeAutoObservable, runInAction } from "mobx";
import * as path from '@tauri-apps/api/path';
import { exists, mkdir, writeTextFile } from '@tauri-apps/plugin-fs';
import { isRunningInBrowser } from "@lib/tauri";
import { ApplicationData, ApplicationDataSchema, createNewApplicationData, loadApplicationData, MAX_RECENT_PROJECTS } from "./ApplicationData";
import { Paths } from "@lib/tauri/mock/config";

const ApplicationDataFileName = 'appData.json';

export class ApplicationDataController {
  private _isLoadingAppData: boolean = false;
  private _appData: ApplicationData = undefined!; // @NOTE loaded async

  public constructor() {
    // Eagerly load app data
    // @TODO I'd rather not have mock stuff laying around - is there a more opaque way we can do this?
    if (isRunningInBrowser()) {
      this.initMockAppData()
    } else {
      this.initAppData();
    }

    makeAutoObservable(this);
  }

  private async initAppData(): Promise<void> {
    this._isLoadingAppData = true;

    // 1. Get data directory (i.e. `%APPDATA%/<bundle-id>`, `$HOME/Library/Application Support/<bundle-id>`, etc.)
    const appDataDir = await path.appDataDir();

    // 2. Ensure directory exists
    const dataDirExists = await exists(appDataDir);
    if (!dataDirExists) {
      await mkdir(appDataDir, {
        recursive: true,
      });
      console.log(`[ApplicationDataController] (initAppData) Created app data directory: ${appDataDir}`);
    } else {
      console.log(`[ApplicationDataController] (initAppData) App data directory exists: ${appDataDir}`);
    }

    // 3. Ensure appData exists
    const appDataPath = await path.join(appDataDir, ApplicationDataFileName);
    const appDataExists = await exists(appDataPath);
    let appData: ApplicationData;
    if (!appDataExists) {
      // No app data - create new
      appData = createNewApplicationData();
      await writeTextFile(appDataPath, JSON.stringify(appData));
      console.log(`[ApplicationDataController] (initAppData) Wrote new app data: ${appDataPath}`);
    } else {
      // App data exists - load it
      appData = await loadApplicationData(appDataPath);
      console.log(`[ApplicationDataController] (initAppData) Loaded existing app data: ${appDataPath}`);
    }

    runInAction(() => {
      this._isLoadingAppData = false;
      this._appData = appData;
    })
  }

  /**
   * Mutate the current app data in memory and on disk using a mutator function.
   * Return the new app data from the mutator function. You don't have to create a fully new app data object,
   * it's safe to just modify the existing reference and return that.
   * @param mutator Mutator function
   */
  public async mutateAppData(mutator: (appData: ApplicationData) => ApplicationData): Promise<void> {
    // Read current app data
    const [appDataDir, appData] = await Promise.all([
      path.appDataDir(),
      this._appData,
    ]);

    // Call mutator function
    let mutatedAppData = appData;
    runInAction(() => {
      mutatedAppData = mutator(mutatedAppData);

      // Manipulate / default new data
      // Sort recent projects by date opened, limited to max number
      appData.recentProjects = appData.recentProjects
        .sort((projectA, projectB) => {
          return projectB.lastOpened.valueOf() - projectA.lastOpened.valueOf()
        })
        .slice(0, MAX_RECENT_PROJECTS);
    });

    // Validate updated app data against schema
    const mutatedAppDataJson = JSON.stringify(mutatedAppData);
    await ApplicationDataSchema.parseAsync(mutatedAppData);

    // Write updated data
    const appDataPath = await path.join(appDataDir, ApplicationDataFileName);
    await writeTextFile(appDataPath, mutatedAppDataJson);

    // Update observed data
    runInAction(() => {
      this._appData = mutatedAppData;
    });
  }

  private initMockAppData(): void {
    // Mock for debugging in browser. Just return a default data set.
    this._appData = makeAutoObservable({
      version: '1.0',
      recentProjects: [
        {
          name: "Sample Project",
          lastOpened: new Date(),
          path: `${Paths.MagicFileRoot}/${Paths.MockProjectFile}`,
        },
        {
          name: "Санкт-Петербург: Origins",
          lastOpened: new Date(),
          path: `${Paths.MagicFileRoot}/${Paths.MockProjectFile}`
        },
        {
          name: "Mystery of Myanmar",
          lastOpened: new Date(),
          path: `${Paths.MagicFileRoot}/${Paths.MockProjectFile}`
        },
      ],
    });
  }

  public get isLoadingAppData() {
    return this._isLoadingAppData;
  }

  public get hasLoadedAppData() {
    return this._appData !== undefined;
  }

  public get appData(): ApplicationData {
    if (this._appData === undefined) {
      throw new AppDataNotLoadedError();
    }
    return this._appData;
  }
}

export class AppDataNotLoadedError extends Error {
  public constructor() {
    super(`App data has not yet finished loading`);
  }
}
