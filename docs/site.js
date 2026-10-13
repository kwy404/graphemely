// Site behaviour, written with Voodoo.js (https://github.com/kwy404/Voodoo.js).
//
// Voodoo.js is loaded from the CDN with `data-manual`, so this module can publish
// the playground helpers on `V.config.globals` before the first render, and then
// start the page itself. Theme toggle, menu, install tabs and copy buttons are
// declared in the HTML with `v-theme-toggle`, `v-data`, `v-tabs` and `v-copy-from`.

const V = window.V;

if (V) {
  if (document.getElementById('playground')) {
    // graphemely.js is a copy of dist/index.js (run `npm run docs:copy`).
    const lib = await import('./graphemely.js');
    Object.assign(V.config.globals, playgroundGlobals(lib));
  }
  V.start();
}

function playgroundGlobals({ graphemes, isWellFormed, length, reverse, slice, truncate }) {
  const cp = (...points) => String.fromCodePoint(...points);
  const ELLIPSIS = '\u{2026}';
  const FAMILY = cp(0x1f468, 0x200d, 0x1f469, 0x200d, 0x1f467);

  // Built from escapes, so no source file ever contains a literal emoji.
  const presets = [
    { id: 'family', label: 'Family emoji', value: `Hi ${FAMILY}!` },
    {
      id: 'flags',
      label: 'Flags',
      value: `Flags ${cp(0x1f1e7, 0x1f1f7)}${cp(0x1f1fa, 0x1f1f8)}${cp(0x1f3f4, 0xe0067, 0xe0062, 0xe0065, 0xe006e, 0xe0067, 0xe007f)}`,
    },
    {
      id: 'skin',
      label: 'Skin tones',
      value: `Nice ${cp(0x1f44d, 0x1f3fd)} work ${cp(0x1f469, 0x1f3fd, 0x200d, 0x1f4bb)}`,
    },
    { id: 'accents', label: 'Accents', value: 'cafe\u{301} vs caf\u{e9}' },
    {
      id: 'scripts',
      label: 'Hangul, Thai, Devanagari',
      value: `${cp(0xd55c, 0xae00)} ${cp(0x1100, 0x1161, 0x11a8)} ${cp(0xe19, 0xe49, 0xe33)} ${cp(0x915, 0x93f, 0x924, 0x93e, 0x92c)}`,
    },
    { id: 'keycaps', label: 'Keycaps', value: `PIN ${cp(0x31, 0xfe0f, 0x20e3)}${cp(0x32, 0xfe0f, 0x20e3)}${cp(0x33, 0xfe0f, 0x20e3)}` },
    { id: 'hearts', label: 'Hearts', value: `I ${cp(0x2764, 0xfe0f)} JS ${cp(0x2764, 0xfe0f, 0x200d, 0x1f525)}` },
    { id: 'plain', label: 'Plain text', value: 'Hello world' },
  ];

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

  const naive = {
    truncate: (str, n) => (str.length > n ? str.slice(0, Math.max(0, n - 1)) + ELLIPSIS : str),
    reverse: (str) => str.split('').reverse().join(''),
  };

  const check = {
    length: (str) => (str.length === length(str) ? ok('matches') : bad('counts code units')),
    slice: (str, n) => (cleanPrefix(str, str.slice(0, n)) ? ok('whole characters') : bad('broken character')),
    truncate(str, n) {
      if (str.length <= n) return ok('fits');
      if (!cleanPrefix(str, str.slice(0, Math.max(0, n - 1)))) return bad('broken character');
      if (length(str) <= n) return warn('cut, but it already fit');
      return ok('whole characters');
    },
    reverse: (str) => (naive.reverse(str) === reverse(str) ? ok('matches') : bad('scrambled')),
    split(str) {
      const units = str.split('').length;
      return units === length(str) ? ok('matches') : bad(`${units} items for ${length(str)} characters`);
    },
  };

  const isLone = (unit) => !isWellFormed(unit);

  /** Visible form of a piece of text: spaces, marks and invisible characters get a placeholder. */
  function glyph(text) {
    if (text === ' ') return '\u{2423}';
    if (!isWellFormed(text)) return '\u{FFFD}';
    if (/^\p{M}/u.test(text)) return '\u{25CC}' + text;
    if (/^[\p{Cf}\p{Cc}]+$/u.test(text)) return '\u{25CC}';
    return text;
  }

  /** Code points of `text` as U+XXXX, or the code unit for a lone surrogate. */
  function hex(text) {
    return Array.from(text, (c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' ');
  }

  return { presets, length, slice, truncate, reverse, graphemes, naive, check, isLone, glyph, hex };
}
