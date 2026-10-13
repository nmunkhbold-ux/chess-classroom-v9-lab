import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({
  base: process.env.GITHUB_PAGES_BASE || '/',
  build: { outDir: 'dist', sourcemap: true,
    rollupOptions: {input: {main: resolve('index.html'),studio: resolve('v10.html'),recording: resolve('v10-output.html')}} },
});
