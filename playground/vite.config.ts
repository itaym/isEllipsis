import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const resolve = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Alias the packages to their source so the playground runs (dev, build and the
// Playwright e2e that serves it) without needing the packages built first.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@isellipsis/core': resolve('../packages/core/src/index.ts'),
      '@isellipsis/react': resolve('../packages/react/src/index.ts'),
    },
  },
});
