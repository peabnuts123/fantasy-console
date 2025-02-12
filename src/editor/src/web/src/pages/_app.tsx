import type { FunctionComponent } from 'react';
import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';

import '@app/styles/index.css';
import { createLibrary, LibraryContext } from '@lib/index';
import { mockTauri } from '@lib/tauri/mock'; // @TODO Exclude from production build
import { isRunningInTauri } from '@lib/tauri';

// @NOTE Dear diary, I am so, so sorry for doing this.
__hackNextJsServerSideRenderingForTauri();

/* Mock Tauri IPC if not running in Tauri */
if (typeof window !== "undefined") {
  if (isRunningInTauri()) {
    console.log(`Running in Tauri`);
  } else {
    console.log(`Running in browser`);
    mockTauri();
  }
}

const App: FunctionComponent<AppProps> = ({ Component }) => {
  const Router = useRouter();

  const library = createLibrary();

  const { ProjectController } = library;

  let isRedirecting = false;
  if (
    // ... there is no project loaded (or loading)
    !(ProjectController.hasLoadedProject || ProjectController.isLoadingProject) &&
    // ... and the route is not the home page (project select)
    Router.route !== '/' &&
    // ... and the app is not viewing a modal
    !Router.asPath.startsWith('/modal/') &&
    // ... and the app is not viewing the 404 page
    Router.route !== '/404'
  ) {
    isRedirecting = true;
    if (typeof window !== 'undefined') {
      void Router.push('/');
    }
  }

  useEffect(() => {
    // Add teardown code (to handle things like browser refresh)
    window.addEventListener('pagehide', library.onPageUnload);
  }, []);

  return (<>
    <Head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

      <title>Fantasy Console</title>

      {/* App info */}
      {/* @TODO */}
      {/* <meta name="app-environment" content={Config.EnvironmentId} /> */}
      {/* <meta name="app-version" content={Config.AppVersion} /> */}
    </Head>

    <LibraryContext.Provider value={library}>
      {!isRedirecting && (
        <Component />
      )}
    </LibraryContext.Provider>
  </>);
};

export default App;

/*
  We do this PURELY because some tauri modules operate on `window` at the top
  level. So we need to mock `window` on the global context. Mocking `window` tricks
  a few internal processes (that I guess rely on `typeof window` to detect whether the code
  is being rendered server-side) so a few more things need to be mocked also.
  This shouldn't / doesn't seem to matter (?) as its just fooling the server-side
  rendering of Next.js. I really, genuinely wish I could disable this and just use
  Next.js as a "managed React installation".
*/
function __hackNextJsServerSideRenderingForTauri(): void {
  // `global` is the Node.js global equivalent to `window` (its supported by a few browsers now too)
  if (typeof global !== 'undefined' && typeof window === 'undefined') {
    // "Just enough mocking"
    const mockWindow = {
      location: {
        protocol: 'http://',
        hostname: 'localhost',
        port: '3000',
      },
      document: {
        querySelector: () => { },
      },
      __TAURI_INTERNALS__: {
        metadata: {
          currentWindow: {
            label: "",
          },
          currentWebview: {
            label: "",
          },
        },
      },
    };
    // Define `window`
    (global as any)['window'] = mockWindow;
    // Define all properties of `window` on the global object to simulate `window` containing itself
    for (const prop in mockWindow) {
      try {
        (global as any)[prop] = mockWindow[prop as keyof typeof mockWindow];
      } catch (e) {
        throw new Error(`Failed to mock property '${prop}' on window: ${e}`);
      }
    }
  }
}
