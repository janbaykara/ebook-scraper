import fs from 'fs';
import path from 'path';

import type { Plugin } from 'vite';

// Import the sites module (must be compatible with Node.js)
import sites from '../js/common/sites';

export function manifestTransformPlugin(): Plugin {
  return {
    name: 'vite-plugin-manifest-transform',
    apply: 'build',
    generateBundle() {
      // Path to the manifest.json template
      const manifestPath = path.resolve(__dirname, 'template.json');
      const manifestRaw = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestRaw) as Record<string, unknown>;

      // Read version from package.json
      const pkgPath = path.resolve(__dirname, '../../package.json');
      const pkgRaw = fs.readFileSync(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgRaw) as Record<string, unknown>;
      manifest.version = pkg.version;

      // Add site-specific permissions
      const siteURLs = sites.map((site) => site.chromeURLScope);
      const nextManifest = { ...manifest, host_permissions: siteURLs };
      const editedJSON = JSON.stringify(nextManifest, null, 2);

      // Emit the new manifest.json to the output directory
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: editedJSON,
      });
    },
  };
}
