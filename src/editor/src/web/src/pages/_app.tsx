import type { FunctionComponent } from 'react';
import { useState } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';

import '@app/styles/index.css';
import Condition from '@app/components/util/condition';
import type { Library } from '@lib/index';
import { createLibrary, LibraryContext } from '@lib/index';
import { mockTauri } from '@lib/tauri/mock'; // @TODO Exclude from production build

/* Mock Tauri IPC if not running in Tauri */
if (typeof window !== "undefined") {
  if ((window as any).__TAURI_IPC__) {
    console.log(`Running in Tauri`);
  } else {
    console.log(`Running in browser`);
    mockTauri();
  }
}

const App: FunctionComponent<AppProps> = ({ Component }) => {
  const Router = useRouter();

  const [library] = useState<Library>(createLibrary());

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
    isRedirecting = true
    if (typeof window !== 'undefined') {
      void Router.push('/');
    }
  }

  return <>
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
      <Condition if={!isRedirecting}
        then={() => (
          <Component />
        )}
      />
    </LibraryContext.Provider>
  </>;
};

export default App;
