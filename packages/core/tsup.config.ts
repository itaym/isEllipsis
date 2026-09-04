import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  globalName: 'isEllipsis',
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : format === 'iife' ? '.global.js' : '.js' };
  },
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2018',
  minify: false,
});
