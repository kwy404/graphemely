/**
 * graphemely: Unicode-safe string operations.
 *
 * Every function here counts and cuts text by grapheme clusters, the units a
 * person perceives as a single character. Emoji ZWJ sequences, flags, skin
 * tones, keycaps, combining accents and Hangul syllables are never split.
 *
 * @packageDocumentation
 */

import { segmentFallback } from './fallback';

interface GraphemeSegmenter {
  segment(input: string): Iterable<{ segment: string }>;
}

let cachedSegmenter: GraphemeSegmenter | null | undefined;

function getSegmenter(): GraphemeSegmenter | null {
  if (cachedSegmenter === undefined) {
    const Segmenter =
      typeof Intl === 'undefined'
        ? undefined
        : (Intl as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
    cachedSegmenter =
      typeof Segmenter === 'function'
        ? new Segmenter(undefined, { granularity: 'grapheme' })
        : null;
  }
  return cachedSegmenter;
}

/**
 * Code units below U+0300 (except CR) never combine with their neighbours,
 * so each one is a grapheme on its own. This covers ASCII and Latin-1 text
 * and lets the common case skip segmentation entirely.
 */
// eslint-disable-next-line no-control-regex
const SIMPLE = /^[\0-\x0c\x0e-\u02FF]*$/;

function assertString(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError(`graphemely: ${name} must be a string, got ${typeof value}`);
  }
}

/**
 * Splits a string into grapheme clusters (user-perceived characters).
 *
 * Uses `Intl.Segmenter` when the runtime has it, and a built-in UAX #29
 * implementation otherwise.
 *
 * @param str - The text to split.
 * @returns An array where each item is one visible character.
 *
 * @example
 * ```ts
 * graphemes('cafe\u0301');        // ['c', 'a', 'f', 'e\u0301']
 * graphemes('\u{1F1E7}\u{1F1F7}'); // one flag: ['\u{1F1E7}\u{1F1F7}']
 * 'cafe\u0301'.split('');          // 5 items, the accent is detached
 * ```
 */
export function graphemes(str: string): string[] {
  assertString(str, 'str');
  if (SIMPLE.test(str)) return str.split('');
  const segmenter = getSegmenter();
  if (segmenter === null) return segmentFallback(str);
  const out: string[] = [];
  for (const { segment } of segmenter.segment(str)) out.push(segment);
  return out;
}

/**
 * Counts the grapheme clusters in a string, which is the length a person
 * would count by looking at it.
 *
 * @param str - The text to measure.
 * @returns The number of visible characters.
 *
 * @example
 * ```ts
 * const family = '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}';
 * family.length;   // 8 (UTF-16 code units)
 * length(family);  // 1
 * length('hello'); // 5
 * ```
 */
export function length(str: string): number {
  assertString(str, 'str');
  if (SIMPLE.test(str)) return str.length;
  return graphemes(str).length;
}

/**
 * Alias of {@link length}, for code where a function named `length` reads
 * awkwardly or would shadow another binding.
 *
 * @example
 * ```ts
 * count('\u{1F44D}\u{1F3FD}'); // 1 (thumbs up with a skin tone)
 * ```
 */
export const count: (str: string) => number = length;

/**
 * Returns the grapheme at `index`. Negative indices count back from the end,
 * like `Array.prototype.at`.
 *
 * @param str - The text to read from.
 * @param index - Grapheme index. `-1` is the last grapheme.
 * @returns The grapheme, or `undefined` when the index is out of range.
 *
 * @example
 * ```ts
 * at('ab\u{1F600}', -1); // '\u{1F600}' (the whole emoji, not half of it)
 * at('abc', 10);         // undefined
 * ```
 */
export function at(str: string, index: number): string | undefined {
  const list = graphemes(str);
  let i = Math.trunc(index) || 0;
  if (i < 0) i += list.length;
  return i >= 0 && i < list.length ? list[i] : undefined;
}

/**
 * Extracts a section of a string by grapheme index. Works like
 * `String.prototype.slice`, including negative indices, but never cuts a
 * grapheme in half.
 *
 * @param str - The text to slice.
 * @param start - Start grapheme index (inclusive). Negative counts from the end.
 * @param end - End grapheme index (exclusive). Negative counts from the end.
 *   Defaults to the end of the string.
 *
 * @example
 * ```ts
 * const s = 'I \u2764\uFE0F JS';
 * s.slice(0, 3);     // 'I \u2764', the variation selector is lost
 * slice(s, 0, 3);    // 'I \u2764\uFE0F'
 * slice('hello', -3); // 'llo'
 * ```
 */
export function slice(str: string, start?: number, end?: number): string {
  return graphemes(str).slice(start, end).join('');
}

/**
 * Splits a string in two at a grapheme index.
 *
 * @param str - The text to split.
 * @param index - Grapheme index where the second part starts. Negative counts
 *   from the end. Out of range values are clamped.
 * @returns A tuple `[before, after]`. `before + after === str` always holds.
 *
 * @example
 * ```ts
 * splitAt('hello', 2);   // ['he', 'llo']
 * splitAt('hello', -1);  // ['hell', 'o']
 * ```
 */
export function splitAt(str: string, index: number): [string, string] {
  const list = graphemes(str);
  return [list.slice(0, index).join(''), list.slice(index).join('')];
}

/** Options for {@link truncate}. */
export interface TruncateOptions {
  /**
   * Text appended when the string is cut. Counts toward `maxLength`.
   * @defaultValue `'\u2026'` (a single horizontal ellipsis character)
   */
  ellipsis?: string;
  /**
   * When `true`, cut at the last whitespace that fits instead of in the
   * middle of a word, and drop trailing whitespace before the ellipsis.
   * Falls back to a hard cut when a single word is longer than the room left.
   * @defaultValue `false`
   */
  wordBoundary?: boolean;
}

const WHITESPACE = /^\s+$/;
const DEFAULT_ELLIPSIS = '\u2026';

/**
 * Shortens a string to at most `maxLength` graphemes, adding an ellipsis
 * when it was cut. The ellipsis counts toward `maxLength`, so the result
 * always fits.
 *
 * If the ellipsis itself does not leave room for any text
 * (`length(ellipsis) >= maxLength`), the text is cut to `maxLength`
 * graphemes without an ellipsis.
 *
 * @param str - The text to shorten.
 * @param maxLength - Maximum length of the result, in graphemes.
 * @param options - See {@link TruncateOptions}.
 * @throws RangeError when `maxLength` is negative or `NaN`.
 *
 * @example
 * ```ts
 * truncate('Hello world', 8);                         // 'Hello w\u2026'
 * truncate('Hello world', 8, { wordBoundary: true }); // 'Hello\u2026'
 * truncate('Hello world', 8, { ellipsis: '...' });    // 'Hello...'
 * truncate('ab\u{1F468}\u200D\u{1F469}\u200D\u{1F467}cd', 4);
 * // 'ab\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u2026'
 * ```
 */
export function truncate(str: string, maxLength: number, options: TruncateOptions = {}): string {
  if (!(maxLength >= 0)) {
    throw new RangeError(`graphemely: maxLength must be a non negative number, got ${maxLength}`);
  }
  const { ellipsis = DEFAULT_ELLIPSIS, wordBoundary = false } = options;
  const max = Math.floor(maxLength);
  // A string never has more graphemes than code units.
  if (str.length <= max) return str;
  const list = graphemes(str);
  if (list.length <= max) return str;

  const ellipsisLength = ellipsis === DEFAULT_ELLIPSIS ? 1 : length(ellipsis);
  if (ellipsisLength >= max) return list.slice(0, max).join('');

  const room = max - ellipsisLength;
  let kept = list.slice(0, room);
  if (wordBoundary) {
    const next = list[room] as string;
    if (!WHITESPACE.test(next)) {
      let cut = kept.length - 1;
      while (cut > 0 && !WHITESPACE.test(kept[cut] as string)) cut--;
      if (cut > 0) kept = kept.slice(0, cut);
    }
    while (kept.length > 0 && WHITESPACE.test(kept[kept.length - 1] as string)) kept.pop();
  }
  return kept.join('') + ellipsis;
}

/**
 * Reverses a string by grapheme, so emoji, flags and accented letters stay
 * intact.
 *
 * @example
 * ```ts
 * reverse('cafe\u0301');           // 'e\u0301fac'
 * reverse('a\u{1F1E7}\u{1F1F7}b'); // 'b\u{1F1E7}\u{1F1F7}a' (the flag survives)
 * 'a\u{1F1E7}\u{1F1F7}b'.split('').reverse().join(''); // broken surrogates
 * ```
 */
export function reverse(str: string): string {
  return graphemes(str).reverse().join('');
}

function pad(str: string, targetLength: number, padString: string, atStart: boolean): string {
  assertString(padString, 'padString');
  if (targetLength === Infinity) {
    throw new RangeError('graphemely: targetLength must be finite');
  }
  const missing = Math.trunc(targetLength) - length(str);
  if (!(missing > 0) || padString === '') return str;
  const unit = graphemes(padString);
  let fill = '';
  for (let i = 0; i < missing; i++) fill += unit[i % unit.length];
  return atStart ? fill + str : str + fill;
}

/**
 * Pads the start of a string until it is `targetLength` graphemes long.
 * Like `String.prototype.padStart`, but lengths are counted in graphemes and
 * a multi-grapheme `padString` is never cut in the middle of an emoji.
 *
 * @param str - The text to pad.
 * @param targetLength - Desired length in graphemes.
 * @param padString - Text to repeat. Defaults to a single space.
 *
 * @example
 * ```ts
 * padStart('\u{1F600}', 3);        // '  \u{1F600}' ('\u{1F600}'.padStart(3) adds only one space)
 * padStart('7', 3, '0');           // '007'
 * ```
 */
export function padStart(str: string, targetLength: number, padString = ' '): string {
  return pad(str, targetLength, padString, true);
}

/**
 * Pads the end of a string until it is `targetLength` graphemes long.
 * See {@link padStart}.
 *
 * @example
 * ```ts
 * padEnd('\u00E9', 3, '.');  // '\u00E9..'
 * padEnd('e\u0301', 3, '.'); // 'e\u0301..' (same visible result)
 * ```
 */
export function padEnd(str: string, targetLength: number, padString = ' '): string {
  return pad(str, targetLength, padString, false);
}

/** Options for {@link wrap}. */
export interface WrapOptions {
  /**
   * When `true`, words longer than `width` are broken across lines (always
   * between graphemes). When `false`, they are kept whole on their own line
   * and may exceed `width`.
   * @defaultValue `false`
   */
  hard?: boolean;
}

/**
 * Wraps text into lines of at most `width` graphemes, breaking at spaces.
 *
 * Existing line breaks are kept. Runs of spaces and tabs between words
 * collapse to a single space. Width is counted in graphemes, not terminal
 * columns, so wide CJK characters count as 1.
 *
 * @param str - The text to wrap.
 * @param width - Maximum line length in graphemes (at least 1).
 * @param options - See {@link WrapOptions}.
 * @returns The lines, without trailing newline characters.
 * @throws RangeError when `width` is smaller than 1.
 *
 * @example
 * ```ts
 * wrap('the quick brown fox', 10);          // ['the quick', 'brown fox']
 * wrap('abcdefgh', 3, { hard: true });      // ['abc', 'def', 'gh']
 * wrap('ab\u{1F1E7}\u{1F1F7}cd', 3, { hard: true }); // ['ab\u{1F1E7}\u{1F1F7}', 'cd']
 * ```
 */
export function wrap(str: string, width: number, options: WrapOptions = {}): string[] {
  assertString(str, 'str');
  if (!(width >= 1)) {
    throw new RangeError(`graphemely: width must be at least 1, got ${width}`);
  }
  const max = Math.floor(width);
  const hard = options.hard === true;
  const lines: string[] = [];

  for (const paragraph of str.split(/\r\n|\r|\n/)) {
    let line = '';
    let lineLength = 0;
    for (const word of paragraph.split(/[ \t]+/)) {
      if (word === '') continue;
      const wordLength = length(word);
      if (lineLength > 0) {
        if (lineLength + 1 + wordLength <= max) {
          line += ' ' + word;
          lineLength += 1 + wordLength;
          continue;
        }
        lines.push(line);
      }
      if (hard && wordLength > max) {
        const parts = graphemes(word);
        let i = 0;
        for (; parts.length - i > max; i += max) lines.push(parts.slice(i, i + max).join(''));
        line = parts.slice(i).join('');
        lineLength = parts.length - i;
      } else {
        line = word;
        lineLength = wordLength;
      }
    }
    lines.push(line);
  }
  return lines;
}

/**
 * Checks that a string has no lone (unpaired) UTF-16 surrogates. Lone
 * surrogates appear when code like `str.slice(0, n)` cuts an emoji in half,
 * and they turn into replacement characters or errors in `encodeURIComponent`,
 * `TextEncoder` and JSON APIs.
 *
 * @example
 * ```ts
 * isWellFormed('\u{1F600}');            // true
 * isWellFormed('\u{1F600}'.slice(0, 1)); // false
 * ```
 */
export function isWellFormed(str: string): boolean {
  assertString(str, 'str');
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 0xd800 || code > 0xdfff) continue;
    if (code > 0xdbff) return false;
    const next = str.charCodeAt(i + 1);
    if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
    i++;
  }
  return true;
}

/**
 * Replaces every lone surrogate with U+FFFD (the replacement character), so
 * the result is safe to encode as UTF-8. Same behaviour as the ES2024
 * `String.prototype.toWellFormed`, available on every runtime.
 *
 * @example
 * ```ts
 * toWellFormed('ok\uD83D'); // 'ok\uFFFD'
 * ```
 */
export function toWellFormed(str: string): string {
  if (isWellFormed(str)) return str;
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = str.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        out += str[i] + (str[i + 1] as string);
        i++;
        continue;
      }
      out += '\uFFFD';
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      out += '\uFFFD';
    } else {
      out += str[i];
    }
  }
  return out;
}
