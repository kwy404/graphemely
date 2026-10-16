import { describe, expect, it } from 'vitest';
import {
  at,
  count,
  graphemes,
  isWellFormed,
  length,
  measure,
  padEnd,
  padStart,
  reverse,
  slice,
  splitAt,
  toWellFormed,
  truncate,
  wrap,
} from '../src/index';
import {
  DEVANAGARI,
  E_ACUTE_NFC,
  E_ACUTE_NFD,
  FAMILY,
  FLAG_BR,
  FLAG_US,
  GRIN,
  HANGUL_JAMO,
  HEART,
  KEYCAP_1,
  LONE_HIGH,
  LONE_LOW,
  SEGMENTATION_CASES,
  THAI,
  THUMBS_UP_TONE,
} from './fixtures';

describe('graphemes', () => {
  it.each(SEGMENTATION_CASES)('%s', (_name, input, expected) => {
    expect(graphemes(input)).toEqual(expected);
  });

  it('round trips: joining the graphemes gives back the input', () => {
    for (const [, input] of SEGMENTATION_CASES) {
      expect(graphemes(input).join('')).toBe(input);
    }
  });

  it('throws a TypeError for non string input', () => {
    expect(() => graphemes(42 as unknown as string)).toThrow(TypeError);
    expect(() => graphemes(undefined as unknown as string)).toThrow(/must be a string/);
  });
});

describe('length and count', () => {
  it('counts what a person sees', () => {
    expect(FAMILY.length).toBe(8);
    expect(length(FAMILY)).toBe(1);
    expect(length(FLAG_BR + FLAG_US)).toBe(2);
    expect(length(KEYCAP_1)).toBe(1);
    expect(length(THUMBS_UP_TONE)).toBe(1);
    expect(length(DEVANAGARI)).toBe(3);
    expect(length(THAI)).toBe(4);
    expect(length(HANGUL_JAMO)).toBe(1);
  });

  it('treats composed and decomposed accents the same', () => {
    expect(E_ACUTE_NFD.length).toBe(2);
    expect(length(E_ACUTE_NFC)).toBe(1);
    expect(length(E_ACUTE_NFD)).toBe(1);
  });

  it('uses the fast path for ASCII and Latin-1', () => {
    expect(length('')).toBe(0);
    expect(length('hello world')).toBe(11);
    expect(length('na\u{EF}ve')).toBe(5);
    expect(length('a\r\nb')).toBe(3);
  });

  it('count is an alias of length', () => {
    expect(count).toBe(length);
    expect(count(`a${GRIN}`)).toBe(2);
  });

  it('throws for non string input', () => {
    expect(() => length(null as unknown as string)).toThrow(TypeError);
  });
});

describe('at', () => {
  const text = `a${FAMILY}b${FLAG_BR}`;

  it('returns whole graphemes', () => {
    expect(at(text, 0)).toBe('a');
    expect(at(text, 1)).toBe(FAMILY);
    expect(at(text, 3)).toBe(FLAG_BR);
  });

  it('supports negative indices', () => {
    expect(at(text, -1)).toBe(FLAG_BR);
    expect(at(text, -3)).toBe(FAMILY);
  });

  it('returns undefined out of range', () => {
    expect(at(text, 4)).toBeUndefined();
    expect(at(text, -5)).toBeUndefined();
    expect(at('', 0)).toBeUndefined();
  });

  it('truncates fractional indices and treats NaN as 0', () => {
    expect(at('abc', 1.9)).toBe('b');
    expect(at('abc', Number.NaN)).toBe('a');
  });
});

describe('slice', () => {
  const text = `I ${HEART} JS ${FAMILY}`;

  it('never cuts a grapheme', () => {
    expect(text.slice(0, 3)).toBe('I \u{2764}');
    expect(slice(text, 0, 3)).toBe(`I ${HEART}`);
    expect(slice(text, -1)).toBe(FAMILY);
  });

  it('matches String.prototype.slice for ASCII', () => {
    const ascii = 'hello world';
    const args: Array<[number?, number?]> = [[], [0], [3], [-3], [2, 5], [5, 2], [-5, -1], [0, 100], [100]];
    for (const [s, e] of args) expect(slice(ascii, s, e)).toBe(ascii.slice(s, e));
  });

  it('handles empty and out of range', () => {
    expect(slice('', 0, 5)).toBe('');
    expect(slice(FAMILY, 1)).toBe('');
    expect(slice(FAMILY, -10)).toBe(FAMILY);
  });
});

describe('splitAt', () => {
  it('splits by grapheme index', () => {
    expect(splitAt('hello', 2)).toEqual(['he', 'llo']);
    expect(splitAt(`${FLAG_BR}${FLAG_US}`, 1)).toEqual([FLAG_BR, FLAG_US]);
    expect(splitAt('hello', -1)).toEqual(['hell', 'o']);
  });

  it('clamps out of range indices', () => {
    expect(splitAt('abc', 10)).toEqual(['abc', '']);
    expect(splitAt('abc', -10)).toEqual(['', 'abc']);
    expect(splitAt('', 1)).toEqual(['', '']);
  });
});

describe('truncate', () => {
  it('returns the input when it fits', () => {
    expect(truncate('hello', 5)).toBe('hello');
    expect(truncate(FAMILY, 1)).toBe(FAMILY);
    expect(truncate('', 0)).toBe('');
  });

  it('adds a single character ellipsis by default, counted in maxLength', () => {
    expect(truncate('Hello world', 8)).toBe('Hello w\u{2026}');
    expect(length(truncate('Hello world', 8))).toBe(8);
  });

  it('never splits an emoji', () => {
    const text = `ab${FAMILY}cd`;
    expect(truncate(text, 4)).toBe(`ab${FAMILY}\u{2026}`);
    expect(truncate(text, 3)).toBe('ab\u{2026}');
    expect(isWellFormed(truncate(GRIN.repeat(10), 5))).toBe(true);
    expect(truncate(`${FLAG_BR}${FLAG_US}${FLAG_BR}`, 2)).toBe(`${FLAG_BR}\u{2026}`);
  });

  it('accepts a custom ellipsis', () => {
    expect(truncate('Hello world', 8, { ellipsis: '...' })).toBe('Hello...');
    expect(truncate('Hello world', 5, { ellipsis: '' })).toBe('Hello');
    expect(truncate('Hello world', 4, { ellipsis: GRIN })).toBe(`Hel${GRIN}`);
  });

  it('cuts without ellipsis when there is no room for it', () => {
    expect(truncate('Hello', 2, { ellipsis: '...' })).toBe('He');
    expect(truncate('Hello', 1)).toBe('H');
    expect(truncate('Hello', 0)).toBe('');
  });

  it('cuts at word boundaries when asked', () => {
    expect(truncate('Hello world again', 14, { wordBoundary: true })).toBe('Hello world\u{2026}');
    expect(truncate('Hello world', 8, { wordBoundary: true })).toBe('Hello\u{2026}');
    expect(truncate('Hello world', 7, { wordBoundary: true })).toBe('Hello\u{2026}');
    expect(truncate('Hello   world', 9, { wordBoundary: true })).toBe('Hello\u{2026}');
  });

  it('falls back to a hard cut for a single long word', () => {
    expect(truncate('Supercalifragilistic', 6, { wordBoundary: true })).toBe('Super\u{2026}');
    expect(truncate(' Supercalifragilistic', 6, { wordBoundary: true })).toBe(' Supe\u{2026}');
  });

  it('floors fractional maxLength and accepts Infinity', () => {
    expect(truncate('Hello world', 8.9)).toBe('Hello w\u{2026}');
    expect(truncate('Hello world', Infinity)).toBe('Hello world');
  });

  it('throws on invalid maxLength', () => {
    expect(() => truncate('abc', -1)).toThrow(RangeError);
    expect(() => truncate('abc', Number.NaN)).toThrow(RangeError);
  });

  it('keeps the end with position start', () => {
    expect(truncate('Hello world', 8, { position: 'start' })).toBe('\u{2026}o world');
    expect(truncate(`ab${FAMILY}cd`, 4, { position: 'start' })).toBe(`\u{2026}${FAMILY}cd`);
    expect(truncate('Hello', 2, { position: 'start', ellipsis: '...' })).toBe('lo');
    expect(truncate('Hello', 0, { position: 'start' })).toBe('');
    expect(truncate('Hello', 9, { position: 'start' })).toBe('Hello');
  });

  it('cuts at word boundaries from the start', () => {
    expect(truncate('the quick brown fox', 10, { position: 'start', wordBoundary: true })).toBe('\u{2026}brown fox');
    expect(truncate('the quick brown fox', 11, { position: 'start', wordBoundary: true })).toBe('\u{2026}brown fox');
    expect(truncate('Supercalifragilistic', 6, { position: 'start', wordBoundary: true })).toBe('\u{2026}istic');
    expect(truncate('Supercalifragilistic ', 6, { position: 'start', wordBoundary: true })).toBe('\u{2026}stic ');
  });

  it('keeps both ends with position middle', () => {
    expect(truncate('vacation-photo-0042.jpeg', 15, { position: 'middle' })).toBe('vacatio\u{2026}42.jpeg');
    expect(length(truncate('vacation-photo-0042.jpeg', 15, { position: 'middle' }))).toBe(15);
    expect(truncate(`${FLAG_BR}abcdef${FAMILY}`, 4, { position: 'middle' })).toBe(`${FLAG_BR}a\u{2026}${FAMILY}`);
    expect(truncate('abcdef', 2, { position: 'middle' })).toBe('a\u{2026}');
    expect(truncate('abcdef', 1, { position: 'middle' })).toBe('a');
  });

  it('cuts at word boundaries on both sides in the middle', () => {
    expect(truncate('the quick brown fox jumps', 12, { position: 'middle', wordBoundary: true })).toBe('the\u{2026}jumps');
    expect(truncate('one two three four', 11, { position: 'middle', wordBoundary: true })).toBe('one\u{2026}four');
  });
});

describe('measure', () => {
  it('counts every unit at once', () => {
    expect(measure('Hi \u{1F44B}\u{1F3FD}')).toEqual({ graphemes: 4, codePoints: 5, codeUnits: 7, bytes: 11 });
    expect(measure('')).toEqual({ graphemes: 0, codePoints: 0, codeUnits: 0, bytes: 0 });
    expect(measure(FAMILY)).toEqual({ graphemes: 1, codePoints: 5, codeUnits: 8, bytes: 18 });
    expect(measure(E_ACUTE_NFD)).toEqual({ graphemes: 1, codePoints: 2, codeUnits: 2, bytes: 3 });
    expect(measure(E_ACUTE_NFC).bytes).toBe(2);
  });

  it('matches TextEncoder and spread, lone surrogates included', () => {
    const encoder = new TextEncoder();
    for (const text of [FAMILY, FLAG_BR, THAI, HANGUL_JAMO, KEYCAP_1, `x${LONE_HIGH}y`, `${LONE_LOW}z`, LONE_HIGH, 'caf\u{E9} \u{20AC}']) {
      const m = measure(text);
      expect(m.bytes).toBe(encoder.encode(text).length);
      expect(m.codePoints).toBe([...text].length);
      expect(m.codeUnits).toBe(text.length);
      expect(m.graphemes).toBe(length(text));
    }
  });

  it('throws a TypeError for non string input', () => {
    expect(() => measure(null as unknown as string)).toThrow(TypeError);
  });
});

describe('reverse', () => {
  it('keeps graphemes intact', () => {
    expect(reverse(`caf${E_ACUTE_NFD}`)).toBe(`${E_ACUTE_NFD}fac`);
    expect(reverse(`a${FLAG_BR}b`)).toBe(`b${FLAG_BR}a`);
    expect(reverse(`${FAMILY}x${THUMBS_UP_TONE}`)).toBe(`${THUMBS_UP_TONE}x${FAMILY}`);
  });

  it('shows why the native way is broken', () => {
    const broken = `a${FLAG_BR}b`.split('').reverse().join('');
    expect(isWellFormed(broken)).toBe(false);
    const codePoints = [...`a${FLAG_BR}b`].reverse().join('');
    expect(codePoints).not.toBe(`b${FLAG_BR}a`);
  });

  it('handles empty and ascii', () => {
    expect(reverse('')).toBe('');
    expect(reverse('abc')).toBe('cba');
  });
});

describe('padStart and padEnd', () => {
  it('pads by grapheme count', () => {
    expect(GRIN.padStart(3)).toBe(` ${GRIN}`);
    expect(padStart(GRIN, 3)).toBe(`  ${GRIN}`);
    expect(padEnd(E_ACUTE_NFD, 3, '.')).toBe(`${E_ACUTE_NFD}..`);
    expect(padStart('7', 3, '0')).toBe('007');
  });

  it('repeats and cuts a multi grapheme pad string at grapheme boundaries', () => {
    expect(padEnd('a', 4, `${FLAG_BR}x`)).toBe(`a${FLAG_BR}x${FLAG_BR}`);
    expect(padStart('a', 3, FAMILY)).toBe(`${FAMILY}${FAMILY}a`);
  });

  it('returns the input when no padding is needed', () => {
    expect(padStart('abc', 2)).toBe('abc');
    expect(padEnd('abc', 3)).toBe('abc');
    expect(padEnd('abc', 10, '')).toBe('abc');
    expect(padStart('abc', Number.NaN)).toBe('abc');
    expect(padStart('abc', -Infinity)).toBe('abc');
  });

  it('validates arguments', () => {
    expect(() => padStart('a', Infinity)).toThrow(RangeError);
    expect(() => padEnd('a', 3, 1 as unknown as string)).toThrow(TypeError);
  });
});

describe('wrap', () => {
  it('wraps at spaces', () => {
    expect(wrap('the quick brown fox', 10)).toEqual(['the quick', 'brown fox']);
    expect(wrap('the quick brown fox jumps', 9)).toEqual(['the quick', 'brown fox', 'jumps']);
  });

  it('counts graphemes, not code units', () => {
    const word = FAMILY.repeat(3);
    expect(wrap(`${word} ${word}`, 7)).toEqual([`${word} ${word}`]);
    expect(wrap(`${word} ${word}`, 6)).toEqual([word, word]);
  });

  it('keeps long words whole unless hard is set', () => {
    expect(wrap('a verylongword b', 4)).toEqual(['a', 'verylongword', 'b']);
    expect(wrap('a verylongword b', 4, { hard: true })).toEqual(['a', 'very', 'long', 'word', 'b']);
    expect(wrap('abcdefgh', 3, { hard: true })).toEqual(['abc', 'def', 'gh']);
  });

  it('never breaks inside a grapheme when hard wrapping', () => {
    expect(wrap(`ab${FLAG_BR}cd`, 3, { hard: true })).toEqual([`ab${FLAG_BR}`, 'cd']);
    const lines = wrap(GRIN.repeat(7), 2, { hard: true });
    expect(lines).toEqual([GRIN.repeat(2), GRIN.repeat(2), GRIN.repeat(2), GRIN]);
    for (const line of lines) expect(isWellFormed(line)).toBe(true);
  });

  it('keeps existing line breaks and collapses spaces', () => {
    expect(wrap('one two\nthree   four\r\nfive', 20)).toEqual(['one two', 'three four', 'five']);
    expect(wrap('a\n\nb', 5)).toEqual(['a', '', 'b']);
    expect(wrap('  lead\ttab', 20)).toEqual(['lead tab']);
  });

  it('handles empty input and fractional width', () => {
    expect(wrap('', 5)).toEqual(['']);
    expect(wrap('ab cd', 2.5)).toEqual(['ab', 'cd']);
  });

  it('validates arguments', () => {
    expect(() => wrap('abc', 0)).toThrow(RangeError);
    expect(() => wrap('abc', Number.NaN)).toThrow(RangeError);
    expect(() => wrap(5 as unknown as string, 2)).toThrow(TypeError);
  });
});

describe('isWellFormed and toWellFormed', () => {
  it('detects lone surrogates', () => {
    expect(isWellFormed('')).toBe(true);
    expect(isWellFormed(`ok ${GRIN} ${FAMILY}`)).toBe(true);
    expect(isWellFormed(GRIN.slice(0, 1))).toBe(false);
    expect(isWellFormed(`a${LONE_HIGH}`)).toBe(false);
    expect(isWellFormed(`${LONE_HIGH}a`)).toBe(false);
    expect(isWellFormed(`a${LONE_LOW}`)).toBe(false);
    expect(isWellFormed(`${LONE_LOW}${LONE_HIGH}`)).toBe(false);
  });

  it('replaces lone surrogates with U+FFFD', () => {
    expect(toWellFormed(`ok${LONE_HIGH}`)).toBe('ok\u{FFFD}');
    expect(toWellFormed(`${LONE_LOW}${GRIN}${LONE_HIGH}x`)).toBe(`\u{FFFD}${GRIN}\u{FFFD}x`);
    expect(toWellFormed(`${LONE_HIGH}${LONE_HIGH}`)).toBe('\u{FFFD}\u{FFFD}');
  });

  it('returns the same string when already well formed', () => {
    const s = `a${FAMILY}`;
    expect(toWellFormed(s)).toBe(s);
  });

  it('agrees with the native methods where they exist', () => {
    const proto = String.prototype as { isWellFormed?: () => boolean; toWellFormed?: () => string };
    if (typeof proto.isWellFormed !== 'function' || typeof proto.toWellFormed !== 'function') return;
    const samples = ['', 'abc', GRIN, `x${LONE_HIGH}`, `${LONE_LOW}y`, `${LONE_LOW}${LONE_HIGH}`, FAMILY];
    for (const sample of samples) {
      expect(isWellFormed(sample)).toBe(proto.isWellFormed.call(sample));
      expect(toWellFormed(sample)).toBe(proto.toWellFormed.call(sample));
    }
  });
});
