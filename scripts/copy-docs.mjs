// Copies the built library and the mascot into docs/ for GitHub Pages.
// Run `npm run build` first (or `npm run docs:build`, which runs everything).
import { cpSync, readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
const lib = readFileSync(new URL('dist/index.js', root), 'utf8');

writeFileSync(
  new URL('docs/graphemely.js', root),
  `// graphemely ${pkg.version}, MIT license, https://github.com/kwy404/graphemely\n// Copied from dist/index.js by scripts/copy-docs.mjs, do not edit by hand.\n${lib}`,
);
cpSync(new URL('assets/mascot.svg', root), new URL('docs/assets/mascot.svg', root));
console.log('docs assets updated');
