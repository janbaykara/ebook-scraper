// Vite plugin to strip all references to "https://cdnjs.cloudflare.com" from build output
import type { Plugin } from 'vite';

export function stripCdnPlugin(): Plugin {
  return {
    name: 'strip-cdnjs',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'asset' && typeof file.source === 'string') {
          file.source = file.source.split('https://cdnjs.cloudflare.com').join('');
        } else if (file.type === 'chunk' && typeof file.code === 'string') {
          file.code = file.code.split('https://cdnjs.cloudflare.com').join('');
        }
      }
    },
  };
}
