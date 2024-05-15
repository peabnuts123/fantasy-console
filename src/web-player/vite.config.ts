import { UserConfigExport, defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';


// https://vitejs.dev/config/
export default defineConfig(async (env) => {
  const config: UserConfigExport = {
    clearScreen: false,
    publicDir: "../sample-cartridge/content",
    server: {
      port: 1420,
    },
    plugins: [
      tsconfigPaths({
        root: "..",
        projects: ["web-player", "runtime"],
      }),
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
