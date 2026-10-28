import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],build:{outDir:'dist/public'},server:{proxy:{'/api':'http://127.0.0.1:8787','/oauth':'http://127.0.0.1:8787'}}});
