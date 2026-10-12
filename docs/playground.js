// Interactive playground: native string methods vs graphemely.
// graphemely.js is a copy of dist/index.js (run `npm run docs:copy`).
import { at, graphemes, isWellFormed, length, reverse, slice, truncate } from './graphemely.js';

const cp = (...points) => String.fromCodePoint(...points);
const FAMILY = cp(0x1f468, 0x200d, 0x1f469, 0x200d, 0x1f467);

const SAMPLES = {
  family: `Hi ${FAMILY}!`,
  flags: `Flags ${cp(0x1f1e7, 0x1f1f7)}${cp(0x1f1fa, 0x1f1f8)}${cp(0x1f3f4, 0xe0067, 0xe0062, 0xe0065, 0xe006e, 0xe0067, 0xe007f)}`,
  skin: `Nice ${cp(0x1f44d, 0x1f3fd)} work ${cp(0x1f469, 0x1f3fd, 0x200d, 0x1f4bb)}`,
  accents: 'cafe\u{301} vs caf\u{e9}',
  scripts: `${cp(0xd55c, 0xae00)} ${cp(0x1100, 0x1161, 0x11a8)} ${cp(0xe19, 0xe49, 0xe33)} ${cp(0x915, 0x93f, 0x924, 0x93e, 0x92c)}`,
  keycaps: `PIN ${cp(0x31, 0xfe0f, 0x20e3)}${cp(0x32, 0xfe0f, 0x20e3)}${cp(0x33, 0xfe0f, 0x20e3)}`,
};

const input = document.getElementById('pg-input');
const count = document.getElementById('pg-n');
const body = document.getElementById('pg-body');
const chips = document.getElementById('pg-chips');

function codePoints(str) {
  return Array.from(str, (c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' ');
}

/** True when `value` is made of whole graphemes of `str`, starting at the beginning. */
function isCleanPrefix(str, value) {
  if (!isWellFormed(value)) return false;
  let joined = '';
  for (const g of graphemes(str)) {
    if (joined === value) return true;
    joined += g;
  }
  return joined === value;
}

function verdict(ok, okText, badText) {
  const span = document.createElement('span');
  span.className = ok ? 'ok' : 'bad';
  span.textContent = ok ? okText : badText;
  return span;
}

function row(label, nativeCode, nativeValue, nativeOk, safeCode, safeValue) {
  const tr = document.createElement('tr');
  const th = document.createElement('th');
  th.scope = 'row';
  th.textContent = label;
  const native = document.createElement('td');
  const safe = document.createElement('td');
  const nCode = document.createElement('code');
  nCode.textContent = nativeCode;
  const sCode = document.createElement('code');
  sCode.textContent = safeCode;
  native.append(nCode, document.createElement('br'), String(nativeValue), ' ', verdict(nativeOk, 'ok', 'broken'));
  safe.append(sCode, document.createElement('br'), String(safeValue), ' ', verdict(true, 'ok', ''));
  tr.append(th, native, safe);
  return tr;
}

function render() {
  const str = input.value;
  const n = Math.max(0, Math.floor(Number(count.value) || 0));
  const realLength = length(str);
  const cut = str.length > n ? str.slice(0, Math.max(0, n - 1)) : str;
  const nativeSlice = str.slice(0, n);
  const nativeReverse = str.split('').reverse().join('');
  const nativeLast = str.at ? str.at(-1) : str.charAt(str.length - 1);
  const safeLast = at(str, -1);

  body.replaceChildren(
    row('Length', 'str.length', str.length, str.length === realLength, 'length(str)', realLength),
    row(
      'First ' + n,
      `str.slice(0, ${n})`,
      nativeSlice,
      isCleanPrefix(str, nativeSlice),
      `slice(str, 0, ${n})`,
      slice(str, 0, n),
    ),
    row(
      'Truncate',
      `str.slice(0, ${n - 1}) + '\u{2026}'`,
      str.length > n ? cut + '\u{2026}' : str,
      isCleanPrefix(str, cut),
      `truncate(str, ${n})`,
      truncate(str, n),
    ),
    row('Reverse', "str.split('').reverse().join('')", nativeReverse, nativeReverse === reverse(str), 'reverse(str)', reverse(str)),
    row('Last', 'str.at(-1)', nativeLast ?? 'undefined', nativeLast === safeLast, 'at(str, -1)', safeLast ?? 'undefined'),
  );

  chips.replaceChildren(
    ...graphemes(str).map((g) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      const glyph = document.createElement('span');
      glyph.textContent = g === ' ' ? '\u{2423}' : g;
      const small = document.createElement('small');
      small.textContent = codePoints(g);
      chip.append(glyph, small);
      return chip;
    }),
  );
}

document.querySelectorAll('[data-sample]').forEach((button) => {
  button.addEventListener('click', () => {
    input.value = SAMPLES[button.getAttribute('data-sample')];
    render();
  });
});

input.value = SAMPLES.family;
input.addEventListener('input', render);
count.addEventListener('input', render);
render();
