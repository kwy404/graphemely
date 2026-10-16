// Builds the shared parts of the docs site in place.
//
// Every page in docs/ marks regions with <!-- @name args --> ... <!-- /@name -->.
// This script rewrites what is inside each region from scripts/docs/partials.mjs
// (header, footer, install tabs, the rail table of contents, related guides) or,
// for <!-- @art name -->, from the drawing in docs/assets/art/name.svg, inlined
// so its strokes follow the page theme. It also writes the search index and
// bundles the ESLint demo (acorn plus the real rules from dist/eslint-plugin.js).
// Special dates: it draws the seasonal art (scripts/docs/seasons-art.mjs), copies
// it to docs/assets/seasons, writes docs/seasons.css and a minified docs/seasons.js,
// and links both from the head of every page.
//
// Usage: npm run docs:build   (runs the library build, this script and the
// Shiki highlighter, in that order). Running it twice gives the same files.
import { cpSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build, transform } from 'esbuild';
import * as partials from './docs/partials.mjs';
import { writeSeasonArt } from './docs/seasons-art.mjs';

const root = new URL('../', import.meta.url);
const docs = new URL('docs/', root);
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));

const REGION = /<!-- @(\w+)([^>]*?) -->[\s\S]*?<!-- \/@\1 -->/g;
const strip = (html) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

function art(name) {
  const svg = readFileSync(new URL(`assets/art/${name}.svg`, docs), 'utf8');
  return svg
    .replace(/\s*<style>[\s\S]*?<\/style>/, '')
    .replace(/ width="\d+" height="\d+"/, '')
    .replace('<svg ', '<svg class="art" ')
    .trim();
}

// Special dates: art, styles and the script that picks the season.
{
  const css = writeSeasonArt(root);
  writeFileSync(new URL('seasons.css', docs), css);
  rmSync(new URL('assets/seasons/', docs), { recursive: true, force: true });
  cpSync(new URL('assets/seasons/', root), new URL('assets/seasons/', docs), { recursive: true, filter: (src) => !src.endsWith('.js') });
  const source = readFileSync(new URL('assets/seasons/seasons.js', root), 'utf8');
  const { code } = await transform(source, { minify: true, target: 'es2019' });
  writeFileSync(new URL('seasons.js', docs), `// graphemely special dates, minified from assets/seasons/seasons.js by scripts/build-docs.mjs.\n${code}`);
  console.log(`seasons: art, seasons.css and seasons.js (${code.length} bytes) written`);
}
const SEASON_HEAD = '\n  <link rel="stylesheet" href="seasons.css">\n  <script src="seasons.js"></script>';

const pages = readdirSync(docs)
  .filter((file) => file.endsWith('.html'))
  .sort();

const index = [];
for (const file of pages) {
  const url = new URL(file, docs);
  const before = readFileSync(url, 'utf8');
  const section = partials.guides.some((g) => g.file === file) ? 'guides' : '';

  // The h2 headings of the article feed the rail table of contents.
  const article = /<article[\s\S]*?<\/article>/.exec(before)?.[0] ?? before;
  const sections = [...article.matchAll(/<h2 id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)].map(([, id, text]) => ({
    id,
    text: strip(text),
  }));
  const page = { file, section, project: 'graphemely', sections };

  let after = before.replace(REGION, (_, name, args) => {
    if (name !== 'art' && typeof partials[name] !== 'function') throw new Error(`${file}: unknown region @${name}`);
    const body = name === 'art' ? `\n${art(args.trim())}\n` : partials[name](args.trim(), page);
    return `<!-- @${name}${args} -->${body}<!-- /@${name} -->`;
  });
  // Every full page (not the small redirect pages) loads the special date theme.
  if (!after.includes('href="seasons.css"') && !after.includes('/seasons.css"')) {
    after = after.replace(/(<link rel="stylesheet" href="(?:\/graphemely\/)?site\.css">)/, `$1${SEASON_HEAD}`);
  }
  // GitHub Pages serves 404.html at any missing path, so its own links are rooted.
  if (file === '404.html') after = after.replace(/ (href|src)="(?![a-z]+:|\/|#)([^"]*)"/g, ' $1="/graphemely/$2"');
  if (after !== before) writeFileSync(url, after);

  // Search entries: the page itself and its sections.
  if (!/name="robots" content="noindex"/.test(after)) {
    const title = strip(/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(after)?.[1] ?? file);
    const href = file === 'index.html' ? './' : file;
    index.push({ kind: file === 'index.html' ? 'Home' : 'Guide', title, page: 'graphemely', url: href });
    const all = [...after.matchAll(/<h2 id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)];
    for (const [, id, text] of all) {
      index.push({ kind: 'Section', title: strip(text), page: file === 'index.html' ? 'Home page' : title, url: `${href}#${id}` });
    }
  }
  console.log(`${file}: ${after === before ? 'unchanged' : 'written'}`);
}

// Function entries point at the API index on the home page.
const api = ['graphemes', 'length', 'count', 'measure', 'slice', 'at', 'splitAt', 'truncate', 'reverse', 'padStart', 'padEnd', 'wrap', 'isWellFormed', 'toWellFormed'];
for (const name of api) index.push({ kind: 'Function', title: `${name}()`, page: 'API index', url: `./#fn-${name}` });
for (const rule of ['no-unsafe-string-split', 'no-unsafe-reverse', 'prefer-graphemely-truncate']) {
  index.push({ kind: 'Rule', title: `graphemely/${rule}`, page: 'ESLint plugin', url: `https://github.com/kwy404/graphemely/blob/main/docs/rules/${rule}.md` });
}

const indexFile = new URL('search-index.js', docs);
const indexSource = `// Generated by scripts/build-docs.mjs, do not edit by hand.\nexport default ${JSON.stringify(index, null, 1)};\n`;
writeFileSync(indexFile, indexSource);
console.log(`search-index.js: ${index.length} entries`);

// The ESLint demo runs the plugin's own rules on an acorn AST in the browser.
const bundle = await build({
  entryPoints: [fileURLToPath(new URL('scripts/docs/lint-demo.mjs', root))],
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2020',
  write: false,
  legalComments: 'none',
});
writeFileSync(
  new URL('lint.js', docs),
  `// graphemely ${pkg.version} ESLint rules for the docs demo, bundled with acorn (MIT) by scripts/build-docs.mjs.\n${bundle.outputFiles[0].text}`,
);
console.log('lint.js written');
