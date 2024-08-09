import { FunctionComponent } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Link from 'next/link';

import '@app/styles/index.scss';

const App: FunctionComponent<AppProps> = ({ Component }) => {
  return <>
    <Head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

      <title>My Website</title>

      {/* App info */}
      {/* @TODO */}
      {/* <meta name="app-environment" content={Config.EnvironmentId} /> */}
      {/* <meta name="app-version" content={Config.AppVersion} /> */}
    </Head>

    <nav className="u-flex">
      <ul><Link href="/">Home</Link></ul>
      <ul><Link href="/player">Player</Link></ul>
      <ul><Link href="/tauri">Tauri</Link></ul>
    </nav>

    <Component />
  </>;
};

export default App;
