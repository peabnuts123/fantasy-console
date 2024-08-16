import { mockIPC } from "@tauri-apps/api/mocks";

import * as TauriDialog from '@tauri-apps/api/dialog';
import * as TauriPath from '@tauri-apps/api/path';
import * as TauriFs from '@tauri-apps/api/fs';
import { CreateCartridgeCmdArgs } from "@lib/composer/Composer";

/* Configuration */
/**
 * File paths used by mocks.
 * @NOTE These files are assumed to exist in the `public/` directory of
 * the web project.
 */
const Paths = {
  MagicFileRoot: '%%magic_file_root%%',
  MockCartridgeFile: 'sample-cartridge.pzcart',
  MockProjectFile: 'project/sample.pzproj',
}

/**
 * A class that mocks the Tauri APIs when running in the browser, at least
 * good enough for the app to run somewhat. Not all functionality is actually implemented,
 * many functions return I
 */
export class BrowserMock {
  public mockConvertFileSrc(filePath: string, protocol: string = 'asset'): string {
    return filePath.replace(Paths.MagicFileRoot, '');
  }

  public handle(cmd: string, args: any): any | Promise<any> {
    switch (cmd) {
      case 'tauri':
        return this.mockTauri(args);
      case 'create_cartridge':
        return this.mockCreateCartridge(args);
      default:
        throwUnhandled(`[BrowserMock] (handle) Unimplemented Tauri API. cmd: ${cmd}, args: `, args);
    }
  }
  private mockTauri<TModuleName extends TauriMockModuleName>(args: TauriCommandIPCArgs<TModuleName>): any {
    console.log(`[BrowserMock] (mockTauri) args: `, args);

    const mockModule = TauriMock[args.__tauriModule];
    if (mockModule) {
      const handler = mockModule[args.message.cmd] as Function | undefined;
      if (handler) {
        return handler(args.message);
      }
    }

    throw throwUnhandled(`[BrowserMock] (mockTauri) Unimplemented 'tauri' command: `, args);
  }

  private async mockCreateCartridge(_args: CreateCartridgeCmdArgs): Promise<Uint8Array> {
    const result = await fetch(Paths.MockCartridgeFile);
    if (result.ok) {
      const buffer = await result.arrayBuffer();
      return new Uint8Array(buffer);
    } else {
      throw throwUnhandled(`[BrowserMock] (mockCreateCartridge) Failed fetching mock cartridge: `, result);
    }
  }
}

/**
 * Activate the Tauri mock.
 */
export function mockTauri() {
  console.warn(`@NOTE: Mocking Tauri APIs`);
  const mock = new BrowserMock();

  // @NOTE The `mockConvertFileSrc` function in Tauri's mock API
  // doesn't allow you to customise the behaviour 🤷‍♀️
  // So we have to mock it manually like this.
  window.__TAURI__ ??= {
    convertFileSrc: mock.mockConvertFileSrc.bind(mock),
  };

  mockIPC((cmd, args) =>
    mock.handle(cmd, args)
  );
}

/**
 * Error throwing utility. Logs an error and then throws a generic "unmocked API" message.
 * @param details Error message logged to the console before throwing
 * @param detailsArgs Optional arguments to log with the error message
 */
function throwUnhandled(details: string, ...detailsArgs: any[]): void {
  console.error(details, ...detailsArgs);
  throw new Error(`Attempted to call unmocked Tauri API. See error log for request details.`);
}

/*
 * Tauri mock definitions.
 * Declare the function's argument names (as passed by the IPC) and then
 * reference the function's declaration for type inference.
 */
interface ITauriMock {
  Dialog: {
    openDialog: MockHandlerWith1Arg<'options', typeof TauriDialog.open>;
    saveDialog: MockHandlerWith1Arg<'options', typeof TauriDialog.save>;
  },
  Path: {
    basename: MockHandlerWith2Args<'path', 'ext', typeof TauriPath.basename>;
    resolve: MockHandlerWithRestArg<'paths', typeof TauriPath.resolve>;
  },
  Fs: {
    readFile: MockHandlerWith2Args<'path', 'options', typeof TauriFs.readBinaryFile>;
    writeFile: MockHandlerWith3Args<'path', 'content', 'options', typeof TauriFs.writeBinaryFile>;
  }
}

/* Tauri mocks */
const TauriMock: ITauriMock = {
  Dialog: {
    openDialog({ options }) {
      if (options?.filters?.some((filter) => filter.extensions.includes('pzcart'))) {
        return `${Paths.MagicFileRoot}/${Paths.MockCartridgeFile}`;
      } else if (options?.filters?.some((filter) => filter.extensions.includes('pzproj'))) {
        return `${Paths.MagicFileRoot}/${Paths.MockProjectFile}`;
      }
      throw throwUnhandled(`[Dialog] (openDialog) Unhandled request. options: `, options);
    },
    saveDialog({ options }) {
      if (options?.filters?.some((filter) => filter.extensions.includes('pzcart'))) {
        return `${Paths.MagicFileRoot}/${Paths.MockCartridgeFile}`;
      }
      throw throwUnhandled(`[Dialog] (openDialog) Unhandled request. options: `, options);
    },
  },
  Path: {
    basename(args) {
      const { path, ext } = args;
      const segments = path.split(/[\/\\]/);
      let baseName = segments[segments.length - 1];
      if (ext) {
        throw throwUnhandled(`[Path] (basename) 'ext' param not yet implemented`);
      }
      return baseName;
    },
    resolve({ paths }) {
      let path = paths.join('/');
      return new URL(path, 'http://foo.bar')
        .pathname
        .replaceAll(/(^\/+)|(\/+$)/g, '');
    },
  },
  Fs: {
    async readFile(args) {
      const { path, options } = args;
      if (options?.dir) {
        throw throwUnhandled(`[Fs] (readFile) Unimplemented - 'options.dir': `, path, options);
      }
      if (path.startsWith(Paths.MagicFileRoot)) {
        const result = await fetch(path.replace(Paths.MagicFileRoot, ''))
        if (result.ok) {
          const buffer = await result.arrayBuffer();
          return new Uint8Array(buffer);
        } else {
          throw throwUnhandled(`[Fs] (readFile) Failed to fetch: `, result);
        }
      } else {
        throw throwUnhandled(`[Fs] (readFile) Unimplemented - Fetching non-magic-root file path: `, path);
      }
    },
    writeFile({ path, content, options }) {
      console.warn(`[Fs] (writeFile) Tauri is mocked - no file actually written`);
    },
  }
}

/* Type Definitions */

/** The name of any module in the Tauri mock */
type TauriMockModuleName = keyof ITauriMock;

/** Args for tauri commands sent through the IPC bus */
interface TauriCommandIPCArgs<TModuleName extends TauriMockModuleName> {
  __tauriModule: TModuleName,
  message: {
    "cmd": keyof (ITauriMock[TModuleName]),
  } & Record<string, any>
}

/** Utility type that converts any type into Promise/raw type union */
type OptionalAsync<T> = T extends Promise<infer P> ? P | Promise<P> : T;

/*
 * Utility types for declaring mock handlers.
 * Mock handlers have the functions' arguments passed in
 * as an object instead of an array, so they must be mapped
 * from an array of string names to object keys.
 * The types are inferred from the function's arguments positionally.
 *
 * @TODO for some reason the `Fn extends ____` bit isn't being enforced
 */
type MockHandlerWith1Arg<
  Arg1Name extends string,
  Fn extends (arg1: any) => any
> = Fn extends (arg1: infer TArg1) => infer TReturn ? (args:
  { [K in Arg1Name]: TArg1 }
) => OptionalAsync<TReturn> : never;

type MockHandlerWithRestArg<
  Arg1Name extends string,
  Fn extends (...args: any[]) => any
> = Fn extends (...args: infer TArgs) => infer TReturn ? (args:
  { [K in Arg1Name]: TArgs }
) => OptionalAsync<TReturn> : never;

type MockHandlerWith2Args<
  Arg1Name extends string,
  Arg2Name extends string,
  Fn extends (arg1: any, arg2: any) => any
> = Fn extends (arg1: infer TArg1, arg2: infer TArg2) => infer TReturn ? (args:
  { [K in Arg1Name]: TArg1 } &
  { [K in Arg2Name]: TArg2 }
) => OptionalAsync<TReturn> : never;

type MockHandlerWith3Args<
  Arg1Name extends string,
  Arg2Name extends string,
  Arg3Name extends string,
  Fn extends (arg1: any, arg2: any, arg3: any) => any
> = Fn extends (arg1: infer TArg1, arg2: infer TArg2, arg3: infer TArg3) => infer TReturn ? (args:
  { [K in Arg1Name]: TArg1 } &
  { [K in Arg2Name]: TArg2 } &
  { [K in Arg3Name]: TArg3 }
) => OptionalAsync<TReturn> : never;
