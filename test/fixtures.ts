/**
 * Shared test data. Every non-ASCII character is written as an escape so the
 * source stays readable in any editor and terminal.
 */

/** Man, woman, girl joined by zero width joiners. 8 UTF-16 code units. */
export const FAMILY = '\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}';
/** Flag of Brazil: two regional indicator symbols. */
export const FLAG_BR = '\u{1F1E7}\u{1F1F7}';
/** Flag of the United States. */
export const FLAG_US = '\u{1F1FA}\u{1F1F8}';
/** Flag of England: a tag sequence. */
export const FLAG_ENGLAND = '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}';
/** Rainbow flag: white flag, variation selector, ZWJ, rainbow. */
export const RAINBOW_FLAG = '\u{1F3F3}\u{FE0F}\u{200D}\u{1F308}';
/** Keycap digit one. */
export const KEYCAP_1 = '1\u{FE0F}\u{20E3}';
/** Thumbs up with a medium skin tone modifier. */
export const THUMBS_UP_TONE = '\u{1F44D}\u{1F3FD}';
/** Woman technologist with a medium skin tone (modifier inside a ZWJ sequence). */
export const TECHNOLOGIST = '\u{1F469}\u{1F3FD}\u{200D}\u{1F4BB}';
/** Red heart with emoji presentation selector. */
export const HEART = '\u{2764}\u{FE0F}';
/** Grinning face, a single astral code point (2 code units). */
export const GRIN = '\u{1F600}';
/** Small e with acute accent, precomposed (NFC). */
export const E_ACUTE_NFC = '\u{E9}';
/** Small e followed by a combining acute accent (NFD). */
export const E_ACUTE_NFD = 'e\u{301}';
/** Hindi word "kitaab" (book): 3 graphemes, no conjuncts. */
export const DEVANAGARI = '\u{915}\u{93F}\u{924}\u{93E}\u{92C}';
/** Hangul syllable built from conjoining jamo L V T. */
export const HANGUL_JAMO = '\u{1100}\u{1161}\u{11A8}';
/** Hangul syllables "hangul" in precomposed form. */
export const HANGUL = '\u{D55C}\u{AE00}';
/** Thai greeting "sawasdee": 4 graphemes. */
export const THAI = '\u{E2A}\u{E27}\u{E31}\u{E2A}\u{E14}\u{E35}';
/** Thai word "nam" (water), uses SARA AM which is a spacing mark. */
export const THAI_WATER = '\u{E19}\u{E49}\u{E33}';
/** A lone high surrogate. */
export const LONE_HIGH = '\uD83D';
/** A lone low surrogate. */
export const LONE_LOW = '\uDE00';

/** Inputs paired with the expected grapheme clusters. */
export const SEGMENTATION_CASES: Array<[name: string, input: string, expected: string[]]> = [
  ['empty string', '', []],
  ['ascii', 'abc', ['a', 'b', 'c']],
  ['family ZWJ sequence', FAMILY, [FAMILY]],
  ['family between letters', `a${FAMILY}b`, ['a', FAMILY, 'b']],
  ['flag', FLAG_BR, [FLAG_BR]],
  ['two adjacent flags', FLAG_BR + FLAG_US, [FLAG_BR, FLAG_US]],
  ['odd regional indicators', '\u{1F1E7}\u{1F1F7}\u{1F1FA}', [FLAG_BR, '\u{1F1FA}']],
  ['tag sequence flag', FLAG_ENGLAND, [FLAG_ENGLAND]],
  ['rainbow flag', RAINBOW_FLAG, [RAINBOW_FLAG]],
  ['keycap', KEYCAP_1 + '2', [KEYCAP_1, '2']],
  ['skin tone', THUMBS_UP_TONE, [THUMBS_UP_TONE]],
  ['skin tone inside ZWJ sequence', TECHNOLOGIST, [TECHNOLOGIST]],
  ['heart with variation selector', `I ${HEART}`, ['I', ' ', HEART]],
  ['astral code point', `x${GRIN}y`, ['x', GRIN, 'y']],
  ['precomposed accent', `caf${E_ACUTE_NFC}`, ['c', 'a', 'f', E_ACUTE_NFC]],
  ['decomposed accent', `caf${E_ACUTE_NFD}`, ['c', 'a', 'f', E_ACUTE_NFD]],
  ['stacked combining marks', 'a\u{301}\u{308}\u{323}b', ['a\u{301}\u{308}\u{323}', 'b']],
  ['Devanagari', DEVANAGARI, ['\u{915}\u{93F}', '\u{924}\u{93E}', '\u{92C}']],
  ['Hangul jamo', HANGUL_JAMO + 'a', [HANGUL_JAMO, 'a']],
  ['Hangul LV + T', '\u{AC00}\u{11A8}', ['\u{AC00}\u{11A8}']],
  ['Hangul LVT does not take V', '\u{AC01}\u{1161}', ['\u{AC01}', '\u{1161}']],
  ['Hangul L L V', '\u{1100}\u{1100}\u{1161}', ['\u{1100}\u{1100}\u{1161}']],
  ['Hangul L + LV and L + LVT', '\u{1100}\u{AC00}\u{1100}\u{AC01}', ['\u{1100}\u{AC00}', '\u{1100}\u{AC01}']],
  ['Hangul V V T T', '\u{1161}\u{1162}\u{11A8}\u{11A9}', ['\u{1161}\u{1162}\u{11A8}\u{11A9}']],
  ['Hangul LVT + T, T does not take V', '\u{AC01}\u{11A8}\u{1161}', ['\u{AC01}\u{11A8}', '\u{1161}']],
  ['Hangul syllables', HANGUL, ['\u{D55C}', '\u{AE00}']],
  ['Thai', THAI, ['\u{E2A}', '\u{E27}\u{E31}', '\u{E2A}', '\u{E14}\u{E35}']],
  ['Thai spacing mark', THAI_WATER, [THAI_WATER]],
  ['CRLF', 'a\r\nb', ['a', '\r\n', 'b']],
  ['CR alone and LF alone', '\r\n\n\r', ['\r\n', '\n', '\r']],
  ['control does not take marks', '\t\u{301}', ['\t', '\u{301}']],
  ['ZWJ between letters', 'a\u{200D}b', ['a\u{200D}', 'b']],
  ['ZWJ before emoji without emoji base', `a\u{200D}${GRIN}`, ['a\u{200D}', GRIN]],
  ['lone high surrogate', `a${LONE_HIGH}b`, ['a', LONE_HIGH, 'b']],
  ['lone low surrogate', `${LONE_LOW}b`, [LONE_LOW, 'b']],
  ['mark at start of string', '\u{301}a', ['\u{301}', 'a']],
  ['CJK', '\u{4F60}\u{597D}', ['\u{4F60}', '\u{597D}']],
];
