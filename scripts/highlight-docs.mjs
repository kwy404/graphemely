// Pre-renders every code example in docs/*.html with Shiki, using the VS Code
// themes Light+ and Dark+ (dual themes, switched by CSS with the site theme),
// inside a VS Code style window: dots, a tab with the file name and icon, line
// numbers and a copy button. Shell commands get a terminal frame instead.
//
// Source blocks are written by hand as:
//
//   <pre><code class="language-js" data-title="eslint.config.js" data-bad="2" data-ok="3">raw code</code></pre>
//
// `data-title` (optional) names the file in the tab, `data-bad` and `data-ok`
// (optional) are comma separated line numbers to mark. Each block is replaced
// by a <figure class="code"> that keeps those attributes, so running the script
// again reads the code back from its own output and produces the same file.
// The highlighted text is checked against the source on every run.
//
// Usage: npm run docs:highlight   (local only, not part of CI)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHighlighter } from 'shiki';

const docs = new URL('../docs/', import.meta.url);
const LANGS = { js: 'example.js', ts: 'example.ts', bash: 'Terminal', json: 'data.json', html: 'index.html' };
const SOURCE = /<pre><code class="language-([\w-]+)"([^>]*)>([\s\S]*?)<\/code><\/pre>/g;
const OUTPUT = /<figure class="code[^"]*"([^>]*)>[\s\S]*?<\/figure>/g;
const BLOCK = new RegExp(`${OUTPUT.source}|${SOURCE.source}`, 'g');

const highlighter = await createHighlighter({
  themes: ['light-plus', 'dark-plus'],
  langs: Object.keys(LANGS),
});

function decode(html) {
  return html
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const textOf = (html) => decode(html.replace(/<[^>]*>/g, ''));

function attrs(source) {
  const out = {};
  for (const [, name, value] of source.matchAll(/([\w-]+)="([^"]*)"/g)) out[name] = decode(value);
  return out;
}

const lines = (value) => new Set((value || '').split(',').filter(Boolean).map(Number));

function render({ lang, title, bad, ok, code }, id) {
  const badLines = lines(bad);
  const okLines = lines(ok);
  const html = highlighter.codeToHtml(code, {
    lang,
    themes: { light: 'light-plus', dark: 'dark-plus' },
    defaultColor: false,
    transformers: [
      {
        pre(node) {
          delete node.properties.tabindex;
        },
        code(node) {
          node.properties.id = id;
        },
        line(node, line) {
          if (badLines.has(line)) this.addClassToHast(node, 'mark-bad');
          if (okLines.has(line)) this.addClassToHast(node, 'mark-ok');
        },
      },
    ],
  });

  const back = textOf(/<code[^>]*>([\s\S]*)<\/code>/.exec(html)[1]);
  if (back !== code) throw new Error(`highlighted text differs from the source in block ${id}`);

  const terminal = lang === 'bash';
  const label = title || LANGS[lang] || lang;
  const classes = ['code', terminal ? 'terminal' : 'editor'];
  if (!terminal && code.includes('\n')) classes.push('numbered');
  let figure = `<figure class="${classes.join(' ')}" data-lang="${lang}"`;
  if (title) figure += ` data-title="${escape(title)}"`;
  if (bad) figure += ` data-bad="${bad}"`;
  if (ok) figure += ` data-ok="${ok}"`;
  return (
    `${figure}>\n` +
    `<div class="code-bar"><span class="code-dots" aria-hidden="true"><i></i><i></i><i></i></span>` +
    `<span class="code-tab"><span class="file-icon file-icon-${lang}" aria-hidden="true"></span>${escape(label)}</span>` +
    `<button type="button" class="code-copy" v-copy-from="#${id}" aria-label="Copy ${terminal ? 'command' : escape(label)}">Copy</button></div>\n` +
    // The scroll container is focusable so keyboard users can scroll long lines.
    html.replace('<pre ', '<pre tabindex="0" ') +
    `\n</figure>`
  );
}

let total = 0;
for (const name of readdirSync(docs).filter((file) => file.endsWith('.html')).sort()) {
  const url = new URL(name, docs);
  const before = readFileSync(url, 'utf8');
  let count = 0;
  const after = before.replace(BLOCK, (match, figureAttrs, lang, codeAttrs, raw) => {
    count += 1;
    const id = `code-${count}`;
    if (figureAttrs !== undefined) {
      const a = attrs(figureAttrs);
      const code = textOf(/<code[^>]*>([\s\S]*?)<\/code>/.exec(match)[1]);
      return render({ lang: a['data-lang'], title: a['data-title'], bad: a['data-bad'], ok: a['data-ok'], code }, id);
    }
    const a = attrs(codeAttrs);
    return render({ lang, title: a['data-title'], bad: a['data-bad'], ok: a['data-ok'], code: decode(raw) }, id);
  });
  total += count;
  if (after !== before) writeFileSync(url, after);
  console.log(`${name}: ${count} block${count === 1 ? '' : 's'}${after === before ? ', unchanged' : ', written'}`);
}
console.log(`${total} code blocks highlighted`);
