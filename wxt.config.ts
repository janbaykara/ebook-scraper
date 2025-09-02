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
    };
  },
});
