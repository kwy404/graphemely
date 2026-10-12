// Measures the minified and compressed size of the published library.
// Run `npm run build` first.
import { build } from 'esbuild';
import { brotliCompressSync, gzipSync } from 'node:zlib';

async function measure(label, contents) {
  const result = await build({
    stdin: { contents, resolveDir: process.cwd(), loader: 'js' },
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    target: 'es2020',
  });
  const code = result.outputFiles[0].contents;
  const kb = (n) => `${(n / 1024).toFixed(2)} kB`;
  console.log(
    `${label.padEnd(36)} min ${kb(code.length).padStart(9)}   gzip ${kb(gzipSync(code, { level: 9 }).length).padStart(8)}   brotli ${kb(brotliCompressSync(code).length).padStart(8)}`,
  );
}

await measure('graphemely (all exports)', "export * from './dist/index.js';");
await measure('graphemely { truncate }', "export { truncate } from './dist/index.js';");
await measure('graphemely { isWellFormed }', "export { isWellFormed } from './dist/index.js';");
