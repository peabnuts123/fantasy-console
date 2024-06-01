import path from 'path';
import { UserConfigExport, defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';


// https://vitejs.dev/config/
export default defineConfig(async (env) => {
  const config: UserConfigExport = {
    clearScreen: false,
    server: {
      port: 1420,
    },
    resolve: {
      alias: {
        '@fantasy-console/runtime': path.resolve(__dirname, "../runtime/src"),
      }
    },
    plugins: [
      wasm(),
      topLevelAwait(),
    ],
  };

  if (env.command !== 'build') {
    console.log(`[Vite] @NOTE Vite running in development mode`);
    // Development-only configuration
  } else {
    console.log(`[Vite] @NOTE Creating a release build`);
    // Release-only configuration
  }

  return config;
});