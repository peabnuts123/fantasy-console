import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { run } from 'vite-plugin-run'


// https://vitejs.dev/config/
export default defineConfig(async (env) => {
  const config = {
    clearScreen: false,
    server: {
      // @NOTE tauri expects a fixed port, fail if that port is not available
      port: 1420,
      strictPort: true,
    },
    plugins: [
      tsconfigPaths(),
      wasm(),
      topLevelAwait(),
    ],
  };

  if (env.command !== 'build') {
    console.log(`[Vite] @NOTE Vite running in development mode`);
    // Development-only configuration
    config.plugins.push(
      run([
        {
          name: 'build wasm',
          run: ['npm', 'run', 'build:wasm', '--', '--dev'],
          pattern: ['src/**/*.rs'],
        },
      ])
    );
  } else {
    console.log(`[Vite] @NOTE Creating a production build`);
  }

  return config;
});
