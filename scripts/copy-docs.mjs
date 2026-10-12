// Copies the built library and shared artwork into docs/ for GitHub Pages.
// Run `npm run build` first.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
const lib = readFileSync(new URL('dist/index.js', root), 'utf8');

writeFileSync(
  new URL('docs/graphemely.js', root),
  `// graphemely ${pkg.version}, MIT license, https://github.com/kwy404/graphemely\n// Copied from dist/index.js by scripts/copy-docs.mjs, do not edit by hand.\n${lib}`,
);
mkdirSync(new URL('docs/assets/icons/', root), { recursive: true });
cpSync(new URL('assets/mascot.svg', root), new URL('docs/assets/mascot.svg', root));
cpSync(new URL('assets/icons/', root), new URL('docs/assets/icons/', root), { recursive: true });
console.log('docs assets updated');
