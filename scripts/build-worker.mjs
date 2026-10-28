import {build} from 'esbuild';
await build({entryPoints:['server/index.ts'],outfile:'dist/worker.js',bundle:true,format:'esm',target:'es2022',platform:'browser',external:['cloudflare:workers','node:async_hooks'],minify:true});
