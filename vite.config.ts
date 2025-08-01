import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { version } from './package.json';
import { manifestTransformPlugin } from './src/manifest/plugin';

export default defineConfig({
  plugins: [react(), manifestTransformPlugin()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  build: {
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/js/popup/index.tsx'),
        eventPage: resolve(__dirname, 'src/js/eventPage/index.ts'),
      },
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
    },
    outDir: 'dist',
    sourcemap: true,
  },
});
