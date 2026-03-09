import { viteStaticCopy } from 'vite-plugin-static-copy';
import { defineConfig } from 'wxt';

import sites from './components/sites';
import { stripCdnPlugin } from './components/stripCdnPlugin';
import { version } from './package.json';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [
      stripCdnPlugin(),
      viteStaticCopy({
        targets: [
          {
            src: 'node_modules/tesseract.js/dist/worker.min.js',
            dest: 'tesseract',
          },
          {
            src: 'node_modules/tesseract.js-core/tesseract-core.wasm',
            dest: 'tesseract',
          },
          {
            src: 'node_modules/tesseract.js-core/tesseract-core.wasm.js',
            dest: 'tesseract',
          },
          {
            src: 'node_modules/tesseract.js-core/tesseract-core-simd.wasm',
            dest: 'tesseract',
          },
        ],
      }),
    ],
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
  }),
  manifest: ({ browser }) => {
    const permissions: string[] = ['storage', 'scripting', 'tabs', 'webRequest', 'webRequestBlocking'];
    switch (browser) {
      case 'chrome':
        permissions.push('declarativeContent');
        break;
      case 'firefox':
        permissions.push('declarativeNetRequest');
        break;
    }
    return {
      permissions,
      host_permissions: sites.map((site) => site.urlScope),
      web_accessible_resources: [
        {
          resources: ['tesseract/*'],
          matches: ['<all_urls>'],
        },
      ],
      content_security_policy: {
        extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';",
      },
    };
  },
});
