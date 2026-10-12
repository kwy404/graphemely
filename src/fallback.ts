/**
 * Built-in grapheme cluster segmentation used when `Intl.Segmenter` is not
 * available (older Node, older browsers, some embedded runtimes).
 *
 * It implements the extended grapheme cluster rules of Unicode UAX #29 that
 * matter in practice:
 *
 * - CR LF stays together, other controls always break (GB3, GB4, GB5)
 * - Hangul syllable sequences (GB6, GB7, GB8)
 * - combining marks, zero width joiner, variation selectors, emoji modifiers
 *   and tag characters extend the previous cluster (GB9)
 * - spacing marks (GB9a)
 * - emoji ZWJ sequences (GB11)
 * - regional indicator pairs, so flags stay whole (GB12, GB13)
 *
 * Not implemented: Prepend characters (GB9b) and the Indic conjunct rule
 * (GB9c, Unicode 15.1). Those are rare enough that the fallback leaves them
 * out to stay small.
 *
 * @internal
 */

/**
 * Builds a Unicode property regex, or returns `approximation` on engines that
 * do not understand the property. Building at runtime (instead of a regex
 * literal) keeps such engines from failing to parse the whole module.
 *
 * @internal
 */
export function unicodeRegex(source: string, approximation: RegExp): RegExp {
  try {
    return new RegExp(source, 'u');
  } catch {
    return approximation;
  }
}

const MARK = unicodeRegex(
  '\\p{M}',
  // Ranges of combining marks on purpose, matched one code point at a time.
  // eslint-disable-next-line no-misleading-character-class
  /[\u0300-\u036F\u0483-\u0489\u0591-\u05C7\u0610-\u061A\u064B-\u065F\u0900-\u0903\u093A-\u094F\u0951-\u0957\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\u3099\u309A\uFE20-\uFE2F]/,
);
const PICTOGRAPHIC = unicodeRegex(
  '\\p{Extended_Pictographic}',
  /[\u00A9\u00AE\u203C\u2049\u2122\u2139\u2194-\u21AA\u231A-\u23FF\u24C2\u25AA-\u25FE\u2600-\u27BF\u2934\u2935\u2B05-\u2B55\u3030\u303D\u3297\u3299]|\ud83c[\udc00-\udfff]|\ud83d[\udc00-\udfff]|\ud83e[\udc00-\udfff]/,
);
const CONTROL = unicodeRegex(
  '[\\p{Cc}\\p{Zl}\\p{Zp}\\p{Cf}]',
  // eslint-disable-next-line no-control-regex
  /[\u0000-\u001f\u007f-\u009f\u00AD\u061C\u180E\u200B\u200E\u200F\u2028-\u202E\u2060-\u206F\uFEFF\uFFF0-\uFFFB]/,
);

const enum Kind {
  Other,
  CR,
  LF,
  Control,
  Extend,
  ZWJ,
  RegionalIndicator,
  SpacingMark,
  L,
  V,
  T,
  LV,
  LVT,
}

function kindOf(cp: number, ch: string): Kind {
  if (cp < 0x7f) {
    if (cp >= 0x20) return Kind.Other;
    if (cp === 0x0d) return Kind.CR;
    if (cp === 0x0a) return Kind.LF;
    return Kind.Control;
  }
  if (cp === 0x200d) return Kind.ZWJ;
  if (
    cp === 0x200c ||
    (cp >= 0xfe00 && cp <= 0xfe0f) ||
    (cp >= 0x1f3fb && cp <= 0x1f3ff) ||
    (cp >= 0xe0020 && cp <= 0xe007f)
  ) {
    return Kind.Extend;
  }
  if (cp >= 0x1f1e6 && cp <= 0x1f1ff) return Kind.RegionalIndicator;
  if ((cp >= 0x1100 && cp <= 0x115f) || (cp >= 0xa960 && cp <= 0xa97c)) return Kind.L;
  if ((cp >= 0x1160 && cp <= 0x11a7) || (cp >= 0xd7b0 && cp <= 0xd7c6)) return Kind.V;
  if ((cp >= 0x11a8 && cp <= 0x11ff) || (cp >= 0xd7cb && cp <= 0xd7fb)) return Kind.T;
  if (cp >= 0xac00 && cp <= 0xd7a3) {
    return (cp - 0xac00) % 28 === 0 ? Kind.LV : Kind.LVT;
  }
  // Thai and Lao SARA AM are letters, but UAX #29 lists them as SpacingMark.
  if (cp === 0x0e33 || cp === 0x0eb3) return Kind.SpacingMark;
  if (MARK.test(ch)) return Kind.Extend;
  if (CONTROL.test(ch)) return Kind.Control;
  return Kind.Other;
}

/**
 * Returns true when there must be no boundary between `prev` and `next`.
 * `afterEmojiZwj` is true when the text so far ends with
 * ExtPict Extend* ZWJ, which is what GB11 looks back at.
 */
function joins(
  prev: Kind,
  next: Kind,
  afterEmojiZwj: boolean,
  nextIsPictographic: boolean,
  riCount: number,
): boolean {
  if (prev === Kind.CR) return next === Kind.LF; // GB3, GB4
  if (prev === Kind.LF || prev === Kind.Control) return false; // GB4
  if (next === Kind.CR || next === Kind.LF || next === Kind.Control) return false; // GB5
  if (
    prev === Kind.L &&
    (next === Kind.L || next === Kind.V || next === Kind.LV || next === Kind.LVT)
  ) {
    return true; // GB6
  }
  if ((prev === Kind.LV || prev === Kind.V) && (next === Kind.V || next === Kind.T)) return true; // GB7
  if ((prev === Kind.LVT || prev === Kind.T) && next === Kind.T) return true; // GB8
  if (next === Kind.Extend || next === Kind.ZWJ || next === Kind.SpacingMark) return true; // GB9, GB9a
  if (afterEmojiZwj && nextIsPictographic) return true; // GB11
  if (prev === Kind.RegionalIndicator && next === Kind.RegionalIndicator) {
    return riCount % 2 === 1; // GB12, GB13
  }
  return false; // GB999
}

const enum Emoji {
  None,
  /** The text ends with ExtPict Extend* */
  Pictographic,
  /** The text ends with ExtPict Extend* ZWJ */
  Zwj,
}

/**
 * Splits `str` into extended grapheme clusters without `Intl.Segmenter`.
 *
 * @internal
 */
export function segmentFallback(str: string): string[] {
  const out: string[] = [];
  let current = '';
  let prev: Kind | undefined;
  let emoji = Emoji.None;
  // Number of consecutive regional indicators at the end of the cluster.
  let riCount = 0;

  for (const ch of str) {
    const cp = ch.codePointAt(0) as number;
    const kind = kindOf(cp, ch);
    const isPictographic = kind === Kind.Other && cp > 0xa8 && PICTOGRAPHIC.test(ch);

    if (prev === undefined) {
      current = ch;
    } else if (joins(prev, kind, emoji === Emoji.Zwj, isPictographic, riCount)) {
      current += ch;
    } else {
      out.push(current);
      current = ch;
      riCount = 0;
    }

    if (isPictographic) {
      emoji = Emoji.Pictographic;
    } else if (emoji === Emoji.Pictographic && kind === Kind.ZWJ) {
      emoji = Emoji.Zwj;
    } else if (!(emoji === Emoji.Pictographic && kind === Kind.Extend)) {
      emoji = Emoji.None;
    }
    riCount = kind === Kind.RegionalIndicator ? riCount + 1 : 0;
    prev = kind;
  }

  if (prev !== undefined) out.push(current);
  return out;
}
