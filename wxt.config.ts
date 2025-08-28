import { defineConfig } from 'wxt';

import sites from './components/sites';
import { stripCdnPlugin } from './components/stripCdnPlugin';
import { version } from './package.json';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [stripCdnPlugin()],
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
  }),
  manifest: () => {
    return {
      host_permissions: sites.map((site) => site.urlScope),
    };
  },
});
