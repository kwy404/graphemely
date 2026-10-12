import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { segmentFallback, unicodeRegex } from '../src/fallback';
import {
  DEVANAGARI,
  E_ACUTE_NFD,
  FAMILY,
  FLAG_BR,
  FLAG_ENGLAND,
  FLAG_US,
  GRIN,
  HANGUL,
  HANGUL_JAMO,
  HEART,
  KEYCAP_1,
  RAINBOW_FLAG,
  SEGMENTATION_CASES,
  TECHNOLOGIST,
  THAI,
  THAI_WATER,
  THUMBS_UP_TONE,
} from './fixtures';

type Api = typeof import('../src/index');

describe('segmentFallback', () => {
  it.each(SEGMENTATION_CASES)('%s', (_name, input, expected) => {
    expect(segmentFallback(input)).toEqual(expected);
  });

  it('agrees with Intl.Segmenter on random mixes of tricky pieces', () => {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    const pieces = [
      'a', ' ', 'Z', '\r', '\n', '\t', '\u{301}', '\u{200D}', '\u{FE0F}', '\u{1F3FD}',
      FAMILY, FLAG_BR, FLAG_US, '\u{1F1E7}', FLAG_ENGLAND, RAINBOW_FLAG, KEYCAP_1,
      THUMBS_UP_TONE, TECHNOLOGIST, HEART, GRIN, E_ACUTE_NFD, DEVANAGARI, HANGUL_JAMO,
      HANGUL, '\u{1161}', '\u{11A8}', THAI, THAI_WATER, '\u{4F60}', '\u{A9}', '\u{2122}',
    ];
    // Small deterministic PRNG so failures are reproducible.
    let seed = 12345;
    const random = (): number => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let round = 0; round < 2000; round++) {
      let text = '';
      const size = 1 + Math.floor(random() * 8);
      for (let i = 0; i < size; i++) text += pieces[Math.floor(random() * pieces.length)];
      const expected = Array.from(segmenter.segment(text), (s) => s.segment);
      expect(segmentFallback(text), JSON.stringify(text)).toEqual(expected);
    }
  });
});

describe('unicodeRegex', () => {
  it('builds a Unicode property regex when supported', () => {
    expect(unicodeRegex('\\p{L}', /x/).test('\u{E9}')).toBe(true);
  });

  it('returns the approximation when the property is unknown', () => {
    const approximation = /x/;
    expect(unicodeRegex('\\p{NotARealProperty}', approximation)).toBe(approximation);
  });
});

describe('fallback approximations on engines without property escapes', () => {
  let segment: typeof segmentFallback;
  const OriginalRegExp = globalThis.RegExp;

  beforeAll(async () => {
    globalThis.RegExp = new Proxy(OriginalRegExp, {
      construct(target, args: [string, string?]) {
        if (args[1] === 'u' && args[0].includes('\\p{')) throw new SyntaxError('unsupported');
        return new target(...args);
      },
    });
    vi.resetModules();
    segment = (await import('../src/fallback')).segmentFallback;
    globalThis.RegExp = OriginalRegExp;
  });

  it('still handles common text', () => {
    expect(segment(`caf${E_ACUTE_NFD}`)).toEqual(['c', 'a', 'f', E_ACUTE_NFD]);
    expect(segment(`a${FAMILY}b`)).toEqual(['a', FAMILY, 'b']);
    expect(segment(`${HEART}${FLAG_BR}`)).toEqual([HEART, FLAG_BR]);
    expect(segment(`x\u{200B}y`)).toEqual(['x', '\u{200B}', 'y']);
    expect(segment(THAI)).toEqual(['\u{E2A}', '\u{E27}\u{E31}', '\u{E2A}', '\u{E14}\u{E35}']);
  });
});

describe('public API without Intl.Segmenter', () => {
  let api: Api;
  const original = Intl.Segmenter;

  beforeAll(async () => {
    delete (Intl as { Segmenter?: unknown }).Segmenter;
    vi.resetModules();
    api = await import('../src/index');
  });

  afterAll(() => {
    (Intl as { Segmenter?: unknown }).Segmenter = original;
  });

  it('really runs without Intl.Segmenter', () => {
    expect((Intl as { Segmenter?: unknown }).Segmenter).toBeUndefined();
  });

  it.each(SEGMENTATION_CASES)('graphemes: %s', (_name, input, expected) => {
    expect(api.graphemes(input)).toEqual(expected);
  });

  it('length, slice, truncate, reverse and at work the same', () => {
    const text = `a${FAMILY}b${FLAG_BR}`;
    expect(api.length(text)).toBe(4);
    expect(api.slice(text, 1, 2)).toBe(FAMILY);
    expect(api.truncate(text, 3)).toBe(`a${FAMILY}\u{2026}`);
    expect(api.reverse(text)).toBe(`${FLAG_BR}b${FAMILY}a`);
    expect(api.at(text, -1)).toBe(FLAG_BR);
    expect(api.splitAt(text, 2)).toEqual([`a${FAMILY}`, `b${FLAG_BR}`]);
    expect(api.wrap(`${FAMILY}${FAMILY} b`, 2)).toEqual([`${FAMILY}${FAMILY}`, 'b']);
    expect(api.padStart(GRIN, 2, '-')).toBe(`-${GRIN}`);
  });
});

describe('public API when Intl is missing entirely', () => {
  it('falls back too', async () => {
    const original = globalThis.Intl;
    vi.stubGlobal('Intl', undefined);
    vi.resetModules();
    try {
      const api: Api = await import('../src/index');
      expect(api.length(`${FAMILY}${FLAG_BR}`)).toBe(2);
    } finally {
      vi.unstubAllGlobals();
      expect(globalThis.Intl).toBe(original);
    }
  });
});
