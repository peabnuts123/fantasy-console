import { FunctionComponent } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';

import '@app/styles/index.css';

/* Mock Tauri IPC if not running in Tauri */
if (typeof window !== "undefined") {
  if ((window as any).__TAURI_IPC__) {
    console.log(`Running in Tauri`);
  } else {
    console.log(`Running in browser`);
    void import('@lib/tauri/mock').then(({ mockTauri }) => mockTauri())
  }
}

const App: FunctionComponent<AppProps> = ({ Component }) => {
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

    <Component />
  </>;
};

export default App;
