import { defineConfig, type Options } from 'tsup';

const shared: Options = {
  format: ['esm', 'cjs'],
  dts: true,
  clean: false,
  sourcemap: false,
  minify: false,
  splitting: false,
  target: 'es2020',
};

export default defineConfig([
  {
    ...shared,
    entry: { index: 'src/index.ts' },
  },
  {
    ...shared,
    entry: { 'eslint-plugin': 'src/eslint-plugin/index.ts' },
    external: ['eslint'],
    // Typings use `export =` so `require('@kwy404/graphemely/eslint-plugin')` is typed as the plugin.
    cjsInterop: true,
    // Make `require('@kwy404/graphemely/eslint-plugin')` return the plugin itself,
    // while `.default` keeps working for transpiled ESM consumers.
    footer: ({ format }) =>
      format === 'cjs'
        ? { js: 'module.exports = module.exports.default;\nmodule.exports.default = module.exports;' }
        : {},
  },
]);
