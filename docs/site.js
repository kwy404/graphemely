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
  junina: { label: 'Bonfire', value: `Arrai\u{E1} ${cp(0x1f33d)}${cp(0x1f525)}${cp(0x1f3b6)}` },
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

/* Special dates ---------------------------------------------------------- */
// seasons.js (loaded in the head) picks the season and sets data-season on
// <html>; the costume, the garland and the colors follow in CSS. Here: the chip
// with the off switch, the seasonal icons and the falling particles.

const SEASON_ICONS = {
  newyear: ['firework', 'glass', 'clock'],
  carnival: ['mask', 'popper', 'drum'],
  easter: ['egg', 'bunny', 'tulip'],
  valentine: ['heart', 'letter', 'balloon'],
  junina: ['bonfire', 'corn', 'flags'],
  halloween: ['pumpkin', 'bat', 'ghost'],
  christmas: ['tree', 'snowflake', 'gift'],
};

const isDark = () => {
  const theme = document.documentElement.getAttribute('data-theme');
  return theme === 'dark' || (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
};

// What falls, rises or bursts over the cover, per season.
const FX = {
  newyear: { mode: 'burst', colors: ['#FBBF24', '#22D3EE', '#F472B6', '#A78BFA'] },
  carnival: { mode: 'fall', shape: 'rect', colors: ['#F43F5E', '#22D3EE', '#FBBF24', '#8B5CF6', '#10B981'] },
  easter: { mode: 'fall', shape: 'petal', colors: ['#F9A8D4', '#FDE68A', '#A5B4FC', '#86EFAC'] },
  valentine: { mode: 'fall', shape: 'heart', colors: ['#F43F5E', '#FB7185', '#FDA4AF'] },
  junina: { mode: 'rise', colors: ['#F97316', '#FBBF24', '#FDE047'] },
  halloween: { mode: 'fall', shape: 'leaf', colors: ['#E8772E', '#C2410C', '#D9A02B'], bats: true },
  christmas: { mode: 'fall', shape: 'dot', colors: ['#9DB8E0', '#B9CBE8'], dark: ['#E2E8F0', '#CBD5E1'] },
};

/** One light canvas behind the cover. Paused while hidden, never built for reduced motion. */
function seasonFx(id) {
  const cover = document.querySelector('.cover');
  const spec = FX[id];
  if (!cover || !spec || reducedMotion()) return null;
  const canvas = document.createElement('canvas');
  canvas.className = 'season-fx';
  canvas.setAttribute('aria-hidden', 'true');
  cover.prepend(canvas);
  const ctx = canvas.getContext('2d');
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  let w = 0;
  let h = 0;
  let parts = [];
  let bats = [];
  let raf = 0;
  let last = 0;
  let nextBurst = 0;
  let wanted = false;
  let onScreen = true;

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = cover.clientWidth;
    h = cover.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const palette = () => (isDark() && spec.dark ? spec.dark : spec.colors);

  function make(initial) {
    const color = pick(palette());
    if (spec.mode === 'rise') return { x: rand(0, w), y: initial ? rand(0, h) : h + 6, vx: rand(-6, 6), vy: rand(-46, -22), r: rand(1.2, 2.6), life: 0, max: rand(3, 6), color };
    const size = spec.shape === 'dot' ? rand(1.6, 3.4) : rand(4, 8);
    return { x: rand(0, w), y: initial ? rand(-h, h) : rand(-40, -10), vy: rand(14, 34), r: size, sway: rand(10, 28), phase: rand(0, 6.3), spin: rand(-1.6, 1.6), a: rand(0, 6.3), color };
  }

  function populate() {
    const count = Math.round(Math.min(42, Math.max(14, (w * h) / 32000)));
    parts = spec.mode === 'burst' ? [] : Array.from({ length: count }, () => make(true));
    bats = spec.bats ? [0, 1].map((i) => ({ x: rand(-80, w * 0.3), y: rand(70, 150), v: rand(28, 46), s: 0.55 + i * 0.2, t: rand(0, 6) })) : [];
  }

  function burst() {
    const x = rand(w * 0.1, w * 0.9);
    const y = rand(h * 0.08, h * 0.45);
    const color = pick(spec.colors);
    for (let i = 0; i < 26; i++) {
      const angle = (i / 26) * Math.PI * 2;
      const speed = rand(50, 95);
      parts.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: rand(1.2, 2.2), life: 0, max: rand(1.1, 1.6), color });
    }
  }

  function draw(p) {
    ctx.fillStyle = p.color;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.a || 0);
    switch (spec.shape) {
      case 'rect':
        ctx.fillRect(-p.r * 0.6, -p.r * 0.3, p.r * 1.2, p.r * 0.6);
        break;
      case 'leaf':
      case 'petal':
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r, p.r * (spec.shape === 'leaf' ? 0.45 : 0.6), 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'heart': {
        const s = p.r / 10;
        ctx.scale(s, s);
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.bezierCurveTo(-11, -1, -8, -10, 0, -5);
        ctx.bezierCurveTo(8, -10, 11, -1, 0, 6);
        ctx.fill();
        break;
      }
      default:
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
  }

  function drawBat(b) {
    const flap = Math.sin(b.t * 9) * 5;
    ctx.save();
    ctx.translate(b.x, b.y + Math.sin(b.t * 2) * 8);
    ctx.scale(b.s, b.s);
    ctx.fillStyle = isDark() ? '#A79BF2' : '#3A2E5C';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-12, -10 - flap, -26, -6 - flap);
    ctx.quadraticCurveTo(-18, 0, -14, 8);
    ctx.quadraticCurveTo(-6, 4, 0, 8);
    ctx.quadraticCurveTo(6, 4, 14, 8);
    ctx.quadraticCurveTo(18, 0, 26, -6 - flap);
    ctx.quadraticCurveTo(12, -10 - flap, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 0.72;
    if (spec.mode === 'burst') {
      if (now > nextBurst) {
        burst();
        nextBurst = now + rand(1100, 2200);
      }
      parts = parts.filter((p) => (p.life += dt) < p.max);
      for (const p of parts) {
        p.vy += 40 * dt;
        p.vx *= 0.985;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        ctx.globalAlpha = 0.8 * (1 - p.life / p.max);
        draw(p);
      }
    } else {
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (spec.mode === 'rise') {
          p.life += dt;
          p.x += (p.vx + Math.sin(p.life * 3) * 6) * dt;
          p.y += p.vy * dt;
          ctx.globalAlpha = 0.8 * Math.max(0, 1 - p.life / p.max);
          if (p.life > p.max || p.y < -10) parts[i] = make(false);
        } else {
          p.phase += dt;
          p.a += p.spin * dt;
          p.x += Math.cos(p.phase) * p.sway * dt;
          p.y += p.vy * dt;
          if (p.y > h + 12) parts[i] = make(false);
        }
        draw(p);
      }
      ctx.globalAlpha = 0.85;
      for (const b of bats) {
        b.t += dt;
        b.x += b.v * dt;
        if (b.x > w + 60) {
          b.x = -60;
          b.y = rand(70, 150);
        }
        drawBat(b);
      }
    }
    raf = requestAnimationFrame(frame);
  }

  function run() {
    const go = wanted && onScreen && !document.hidden;
    if (go && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    } else if (!go && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    if (!wanted) ctx.clearRect(0, 0, w, h);
  }

  resize();
  populate();
  new ResizeObserver(() => {
    resize();
    populate();
  }).observe(cover);
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    run();
  }).observe(cover);
  document.addEventListener('visibilitychange', run);
  return {
    start() {
      wanted = true;
      run();
    },
    stop() {
      wanted = false;
      run();
    },
  };
}

/** The chip in the masthead strip, the seasonal icons and the particles. */
function seasonUi() {
  const api = window.GraphemelySeasons;
  const state = api && api.state;
  if (!state || !state.id) return;
  const icons = SEASON_ICONS[state.id] || [];
  const href = (name) => `assets/seasons/icons.svg#s-${state.id}-${name}`;
  for (const holder of document.querySelectorAll('.season-icons')) {
    holder.innerHTML = icons.map((name) => `<svg class="icon" aria-hidden="true"><use href="${href(name)}"/></svg>`).join('');
  }
  const fx = seasonFx(state.id);
  const chip = document.querySelector('.season-chip');
  const sync = () => {
    if (chip) {
      chip.setAttribute('aria-pressed', String(state.on));
      chip.title = `${state.on ? 'Turn off' : 'Turn on'} the ${state.name} theme`;
    }
    if (fx) {
      if (state.on) fx.start();
      else fx.stop();
    }
  };
  if (chip) {
    chip.querySelector('.season-chip-name').textContent = `${state.name} mode`;
    chip.querySelector('use')?.setAttribute('href', href(icons[0]));
    chip.hidden = false;
    chip.addEventListener('click', () => {
      api.set(!state.on);
      sync();
    });
  }
  sync();
}

/* Start ------------------------------------------------------------------ */

// Last, so every helper above is initialized before the first render.
seasonUi();
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
