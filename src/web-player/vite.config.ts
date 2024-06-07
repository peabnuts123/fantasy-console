import path from 'path';
import { UserConfigExport, defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(async (env) => {
  const config: UserConfigExport = {
    clearScreen: false,
    esbuild: {
      target: "es2020"
    },
    server: {
      port: 1420,
    },
    resolve: {
      alias: {
        '@fantasy-console/runtime': path.resolve(__dirname, "../runtime/src"),
      }
    },
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
