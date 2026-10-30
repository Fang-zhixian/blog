import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: process.cwd(),
  cacheDir: path.resolve(process.cwd(), '.vite-preview-test'),
  test: {
    environment: 'jsdom',
    setupFiles: [path.resolve(process.cwd(), 'src/test/setup.ts')],
  },
});
