// Site behaviour, written with Voodoo.js (https://kwy404.github.io/Voodoo.js/).
//
// Voodoo.js loads from the CDN with `data-manual`, so this module can publish
// helpers on `V.config.globals` before the first render and then start the page.
// Everything else (theme toggle, menu, tabs, copy buttons, the rail scrollspy,
// the paste and see demo, the Text Lab and the ESLint demo) is declared in the
// HTML with v-* attributes. The special date theme is at the end of this file.
import searchIndex from './search-index.js';

/* Search dialog ---------------------------------------------------------- */

function searchGlobals() {
  const fold = (text) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const rank = { Guide: 0, Function: 0.2, Rule: 0.4, Home: 0.5, Section: 0.6 };
  const entries = searchIndex.map((entry) => ({ ...entry, key: fold(entry.kind === 'Section' ? entry.title : `${entry.title} ${entry.page}`) }));
  const start = entries.filter((e) => e.kind === 'Guide' || e.kind === 'Home').slice(0, 8);
  let lastQuery = null;
  let lastResult = start;

  function find(query) {
    const q = fold(String(query || '').trim());
    if (q === lastQuery) return lastResult;
    lastQuery = q;
    if (!q) return (lastResult = start);
    const words = q.split(/\s+/);
    lastResult = entries
      .filter((e) => words.every((w) => e.key.includes(w)))
      .map((e) => ({ e, score: (fold(e.title).startsWith(words[0]) ? 0 : 1) + rank[e.kind] }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 12)
      .map(({ e }) => e);
    return lastResult;
  }

  function openSearch() {
    const dialog = document.getElementById('search');
    if (!dialog || dialog.open) return;
    dialog.showModal();
    document.getElementById('search-input')?.focus();
  }

  function go(entry) {
    if (!entry) return;
    document.getElementById('search')?.close();
    window.location.href = entry.url;
  }

  return { find, openSearch, go };
}

/* Shared text helpers ---------------------------------------------------- */

const cp = (...points) => String.fromCodePoint(...points);
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Visible form of a piece of text: spaces, marks and invisible characters get a placeholder. */
function glyphOf(text, isWellFormed) {
  if (text === ' ') return '\u{2423}';
  if (text === '\n' || text === '\r\n') return '\u{21B5}';
  if (!isWellFormed(text)) return '\u{FFFD}';
  if (/^\p{M}/u.test(text)) return '\u{25CC}' + text;
  if (/^[\p{Cf}\p{Cc}]+$/u.test(text)) return '\u{25CC}';
  return text;
}

/** Shows each lone surrogate as the replacement character a browser draws for it. */
function visible(text, isWellFormed) {
  if (isWellFormed(text)) return text;
  return text.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '\u{FFFD}');
}

/* Paste and see ---------------------------------------------------------- */

// One sample per special date, shown first while its theme is on. Written as
// escapes, so no source file of the site contains a literal emoji.
const SEASON_SAMPLES = {
  newyear: { label: 'New Year', value: `Cheers ${cp(0x1f942)}${cp(0x1f386)}${cp(0x2728)}` },
  carnival: { label: 'Carnival', value: `Samba ${cp(0x1f483, 0x1f3fd)}${cp(0x1f941)}${cp(0x1f3ad)}` },
  easter: { label: 'Easter', value: `Egg hunt ${cp(0x1f430)}${cp(0x1f95a)}${cp(0x1f423)}` },
  valentine: { label: 'Love', value: `Yours ${cp(0x1f469, 0x200d, 0x2764, 0xfe0f, 0x200d, 0x1f468)}${cp(0x1f48c)}` },
  junina: { label: 'Bonfire', value: `Arrai\u{E1} ${cp(0x1f33d)}${cp(0x1f525)}${cp(0x1fa97)}` },
  halloween: { label: 'Halloween', value: `Boo ${cp(0x1f383)}${cp(0x1f47b)}${cp(0x1f9d9, 0x1f3fd, 0x200d, 0x2640, 0xfe0f)}` },
  christmas: { label: 'Christmas', value: `Ho ho ${cp(0x1f385, 0x1f3fd)}${cp(0x1f384)}${cp(0x2603, 0xfe0f)}` },
};

function peekGlobals({ graphemes, isWellFormed, slice }) {
  const MAX_TILES = 40;
  const base = [
    { id: 'family', label: 'Family', value: `Hi ${cp(0x1f468, 0x200d, 0x1f469, 0x200d, 0x1f467)}!` },
    { id: 'flags', label: 'Flags', value: `Ol\u{E1} ${cp(0x1f1e7, 0x1f1f7)}${cp(0x1f1f5, 0x1f1f9)}` },
    { id: 'accents', label: 'Accents', value: 'Cafe\u{301} cre\u{300}me' },
    { id: 'skin', label: 'Skin tones', value: `Nice ${cp(0x1f44d, 0x1f3fd)}${cp(0x1f44b, 0x1f3ff)}` },
  ];
  let listFor = null;
  let list = base;

  /** The examples, with the special date one first while its theme is on. */
  function samples() {
    const season = document.documentElement.getAttribute('data-season');
    if (season !== listFor) {
      listFor = season;
      const extra = SEASON_SAMPLES[season];
      list = extra ? [{ id: season, ...extra }, ...base.slice(0, 3)] : base;
    }
    return list;
  }

  /**
   * Types the first example in, one character at a time, until the visitor
   * takes over. Called by v-init with `this` set to the demo's scope.
   */
  function intro() {
    const scope = this;
    const sample = samples()[0].value;
    if (reducedMotion()) {
      scope.text = sample;
      return;
    }
    const parts = graphemes(sample);
    let shown = 0;
    const step = () => {
      if (scope.touched) return;
      shown += 1;
      scope.text = parts.slice(0, shown).join('');
      if (shown < parts.length) setTimeout(step, parts[shown - 1] === ' ' ? 130 : 80);
    };
    setTimeout(step, 450);
  }

  let memoKey = null;
  let memo = null;
  let lastKeys = new Set();

  /** Everything the demo shows for one text and one cut position (-1 picks one). */
  function peek(text, cut) {
    const str = String(text ?? '');
    const want = Number(cut);
    const key = `${want}\u{0}${str}`;
    if (key === memoKey) return memo;

    const parts = graphemes(str);
    const total = parts.length;
    const ends = new Set([0]);
    const starts = [];
    let offset = 0;
    for (const g of parts) {
      starts.push(offset);
      offset += g.length;
      ends.add(offset);
    }

    // Left alone, the cut goes to the first place where native slice breaks a character.
    let n = want >= 0 ? Math.min(want, total) : -1;
    if (n < 0) {
      for (let k = 1; k <= total && n < 0; k++) if (!ends.has(k)) n = k;
      if (n < 0) n = Math.min(total, 5);
    }

    // Only tiles that were not on screen before animate in, staggered from the first new one.
    const keys = new Set();
    let firstNew = -1;
    const tiles = parts.slice(0, MAX_TILES).map((g, i) => {
      const k = `${i}:${g}`;
      keys.add(k);
      if (firstNew < 0 && !lastKeys.has(k)) firstNew = i;
      return {
        key: k,
        d: firstNew < 0 ? 0 : Math.min(i - firstNew, 14),
        glyph: glyphOf(g, isWellFormed),
        kept: i < n,
        edge: i === n - 1 && n < total,
        torn: starts[i] < n && n < starts[i] + g.length,
      };
    });
    lastKeys = keys;

    const units = str.length;
    let verdict;
    if (!total) verdict = 'Nothing here yet. Paste a message, a name or a row of emoji.';
    else if (units === total) verdict = 'Here .length agrees with your eyes. Now try an emoji.';
    else verdict = `${units} UTF-16 units for ${total} characters: .length is off by ${units - total}.`;

    memoKey = key;
    memo = {
      total,
      units,
      tiles,
      rest: Math.max(0, total - MAX_TILES),
      n,
      max: total,
      verdict,
      native: visible(str.slice(0, n), isWellFormed),
      nativeOk: ends.has(n),
      mine: slice(str, 0, n),
    };
    return memo;
  }

  return { samples, intro, peek };
}

/* Text Lab --------------------------------------------------------------- */

function labGlobals({ graphemes, isWellFormed, reverse, slice, truncate, at }) {
  const ELLIPSIS = '\u{2026}';
  const encoder = new TextEncoder();
  const bytes = (text) => encoder.encode(text).length;

  // Built from escapes, so no source file of the site contains a literal emoji.
  const presets = [
    { id: 'family', label: 'Family', value: `Hi ${cp(0x1f468, 0x200d, 0x1f469, 0x200d, 0x1f467)}!` },
    { id: 'flags', label: 'Flags', value: `Flags ${cp(0x1f1e7, 0x1f1f7)}${cp(0x1f1fa, 0x1f1f8)}${cp(0x1f3f4, 0xe0067, 0xe0062, 0xe0065, 0xe006e, 0xe0067, 0xe007f)}` },
    { id: 'skin', label: 'Skin tones', value: `Nice ${cp(0x1f44d, 0x1f3fd)} work ${cp(0x1f469, 0x1f3fd, 0x200d, 0x1f4bb)}` },
    { id: 'accents', label: 'Accents', value: 'cafe\u{301} vs caf\u{e9}' },
    { id: 'scripts', label: 'Hangul, Thai, Devanagari', value: `${cp(0xd55c, 0xae00)} ${cp(0x1100, 0x1161, 0x11a8)} ${cp(0xe19, 0xe49, 0xe33)} ${cp(0x915, 0x93f, 0x924, 0x93e, 0x92c)}` },
    { id: 'keycaps', label: 'Keycaps', value: `PIN ${cp(0x31, 0xfe0f, 0x20e3)}${cp(0x32, 0xfe0f, 0x20e3)}${cp(0x33, 0xfe0f, 0x20e3)}` },
    { id: 'hearts', label: 'Hearts', value: `I ${cp(0x2764, 0xfe0f)} JS ${cp(0x2764, 0xfe0f, 0x200d, 0x1f525)}` },
    { id: 'plain', label: 'Plain text', value: 'Hello world' },
  ];

  const hex = (point) => 'U+' + point.toString(16).toUpperCase().padStart(4, '0');

  /** A short tag for the code points that build sequences. */
  function role(ch) {
    const p = ch.codePointAt(0);
    if (!isWellFormed(ch)) return 'lone half';
    if (p === 0x200d) return 'joiner';
    if (p === 0xfe0f || p === 0xfe0e) return 'variation';
    if (p >= 0x1f3fb && p <= 0x1f3ff) return 'skin tone';
    if (p >= 0x1f1e6 && p <= 0x1f1ff) return 'regional';
    if (p >= 0xe0020 && p <= 0xe007f) return 'tag';
    if (p === 0x20e3) return 'keycap';
    if (/\p{M}/u.test(ch)) return 'mark';
    if (p >= 0x1100 && p <= 0x11ff) return 'jamo';
    return '';
  }

  const glyph = (text) => glyphOf(text, isWellFormed);

  /** True when `value` is made of whole graphemes of `str`, starting at the beginning. */
  function cleanPrefix(str, value) {
    if (!isWellFormed(value)) return false;
    let joined = '';
    for (const g of graphemes(str)) {
      if (joined === value) return true;
      joined += g;
    }
    return joined === value;
  }

  const ok = (label) => ({ cls: 'ok', label });
  const bad = (label) => ({ cls: 'bad', label });
  const warn = (label) => ({ cls: 'warn', label });
  const show = (text) => (text === undefined ? 'undefined' : text);

  let memoKey = null;
  let memo = null;

  /** Everything the lab shows for one text and one length, computed once. */
  function lab(text, max) {
    const str = String(text ?? '');
    const n = Math.max(0, Number(max) || 0);
    const key = `${n}\u{0}${str}`;
    if (key === memoKey) return memo;

    const parts = graphemes(str);
    const total = parts.length;
    const cutting = total > n;
    const keep = cutting ? Math.max(0, n - 1) : total;
    const nativeCut = str.length > n ? Math.max(0, n - 1) : str.length;

    let offset = 0;
    const tiles = parts.map((g, i) => {
      const start = offset;
      offset += g.length;
      return {
        i,
        n: String(i + 1).padStart(2, '0'),
        glyph: glyph(g),
        points: Array.from(g, (ch) => ({ hex: hex(ch.codePointAt(0)), role: role(ch) })),
        units: g.length,
        bytes: bytes(g),
        kept: i < keep,
        edge: cutting && i === keep - 1,
        torn: str.length > n && start < nativeCut && nativeCut < offset,
      };
    });

    const nSlice = str.slice(0, n);
    const nTrunc = str.length > n ? str.slice(0, Math.max(0, n - 1)) + ELLIPSIS : str;
    const nReverse = str.split('').reverse().join('');
    const gReverse = reverse(str);
    const units = str.split('').length;

    let truncVerdict = ok('fits');
    if (str.length > n) {
      if (!cleanPrefix(str, str.slice(0, Math.max(0, n - 1)))) truncVerdict = bad('cuts a character');
      else if (total <= n) truncVerdict = warn('cut text that already fit');
      else truncVerdict = ok('whole characters');
    }

    const rows = [
      {
        op: 'Length',
        native: 'str.length',
        nativeOut: String(str.length),
        verdict: str.length === total ? ok('matches') : bad('counts code units'),
        mine: 'length(str)',
        mineOut: String(total),
        note: 'what people see',
      },
      {
        op: 'Slice',
        native: `str.slice(0, ${n})`,
        nativeOut: nSlice,
        verdict: cleanPrefix(str, nSlice) ? ok('whole characters') : bad('cuts a character'),
        mine: `slice(str, 0, ${n})`,
        mineOut: slice(str, 0, n),
        note: 'whole characters',
      },
      {
        op: 'Truncate',
        native: `str.slice(0, ${Math.max(0, n - 1)}) + '\u{2026}'`,
        nativeOut: nTrunc,
        verdict: truncVerdict,
        mine: `truncate(str, ${n})`,
        mineOut: truncate(str, n),
        note: 'fits, whole characters',
      },
      {
        op: 'Reverse',
        native: "str.split('').reverse().join('')",
        nativeOut: nReverse,
        verdict: nReverse === gReverse ? ok('matches') : bad('scrambled'),
        mine: 'reverse(str)',
        mineOut: gReverse,
        note: 'characters intact',
      },
      {
        op: 'Last character',
        native: 'str.at(-1)',
        nativeOut: show(str.at(-1)),
        verdict: str.at(-1) === at(str, -1) ? ok('matches') : bad('half a character'),
        mine: 'at(str, -1)',
        mineOut: show(at(str, -1)),
        note: 'the whole character',
      },
      {
        op: 'Split',
        native: "str.split('')",
        nativeOut: `${units} items`,
        verdict: units === total ? ok('matches') : bad(`${units} pieces, ${total} characters`),
        mine: 'graphemes(str)',
        mineOut: `${total} items`,
        note: 'one item per character',
      },
    ];

    memoKey = key;
    memo = {
      units: str.length,
      points: Array.from(str).length,
      total,
      bytes: bytes(str),
      tiles,
      rows,
      cutting,
      keep,
      torn: tiles.some((t) => t.torn),
    };
    return memo;
  }

  return { presets, lab };
}

/* ESLint demo ------------------------------------------------------------ */

function lintGlobals({ lint }) {
  const sample = [
    "import { truncate } from '@kwy404/graphemely';",
    '',
    'export function preview(post) {',
    "  const letters = post.title.split('');",
    "  const backwards = [...post.title].reverse().join('');",
    "  return post.body.slice(0, 80) + '...';",
    '}',
  ].join('\n');

  let memoCode = null;
  let memo = null;

  /** Problems plus the code split into lines and marked runs, for the overlay. */
  function check(code) {
    const text = String(code ?? '');
    if (text === memoCode) return memo;
    const result = lint(text);
    const marked = new Uint8Array(text.length + 1);
    for (const p of result.problems) {
      const end = Math.min(Math.max(p.end, p.start + 1), text.length);
      for (let i = p.start; i < end; i++) marked[i] = p.rule ? 1 : 2;
    }
    const lines = [];
    let offset = 0;
    for (const line of text.split('\n')) {
      const parts = [];
      let run = '';
      let kind = marked[offset] || 0;
      for (let i = 0; i < line.length; i++) {
        const k = marked[offset + i] || 0;
        if (k !== kind && run) {
          parts.push({ t: run, k: kind });
          run = '';
        }
        kind = k;
        run += line[i];
      }
      parts.push(run ? { t: run, k: kind } : { t: ' ', k: 0 });
      lines.push({ n: lines.length + 1, parts });
      offset += line.length + 1;
    }
    memoCode = text;
    memo = { problems: result.problems, lines, count: result.problems.length, fatal: result.fatal };
    return memo;
  }

  /** Keeps the marked layer under the textarea scrolled with it. */
  function syncScroll(event) {
    const area = event.target;
    const layer = area.previousElementSibling;
    if (layer) {
      layer.scrollTop = area.scrollTop;
      layer.scrollLeft = area.scrollLeft;
    }
  }

  return { sample, check, syncScroll };
}

/* Start ------------------------------------------------------------------ */

// Last, so every helper above is initialized before the first render.
const V = window.V;

if (V) {
  Object.assign(V.config.globals, searchGlobals());
  if (document.getElementById('playground')) {
    // graphemely.js is a copy of dist/index.js and lint.js bundles the real
    // ESLint rules (run `npm run docs:build`).
    const [lib, linter] = await Promise.all([import('./graphemely.js'), import('./lint.js')]);
    Object.assign(V.config.globals, peekGlobals(lib), labGlobals(lib), lintGlobals(linter));
  }
  V.start();
}
