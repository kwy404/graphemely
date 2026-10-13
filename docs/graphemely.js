// graphemely 1.0.0, MIT license, https://github.com/kwy404/graphemely
// Copied from dist/index.js by scripts/copy-docs.mjs, do not edit by hand.
// src/fallback.ts
function unicodeRegex(source, approximation) {
  try {
    return new RegExp(source, "u");
  } catch {
    return approximation;
  }
}
var MARK = unicodeRegex(
  "\\p{M}",
  // Ranges of combining marks on purpose, matched one code point at a time.
  // eslint-disable-next-line no-misleading-character-class
  /[\u0300-\u036F\u0483-\u0489\u0591-\u05C7\u0610-\u061A\u064B-\u065F\u0900-\u0903\u093A-\u094F\u0951-\u0957\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\u3099\u309A\uFE20-\uFE2F]/
);
var PICTOGRAPHIC = unicodeRegex(
  "\\p{Extended_Pictographic}",
  /[\u00A9\u00AE\u203C\u2049\u2122\u2139\u2194-\u21AA\u231A-\u23FF\u24C2\u25AA-\u25FE\u2600-\u27BF\u2934\u2935\u2B05-\u2B55\u3030\u303D\u3297\u3299]|\ud83c[\udc00-\udfff]|\ud83d[\udc00-\udfff]|\ud83e[\udc00-\udfff]/
);
var CONTROL = unicodeRegex(
  "[\\p{Cc}\\p{Zl}\\p{Zp}\\p{Cf}]",
  // eslint-disable-next-line no-control-regex
  /[\u0000-\u001f\u007f-\u009f\u00AD\u061C\u180E\u200B\u200E\u200F\u2028-\u202E\u2060-\u206F\uFEFF\uFFF0-\uFFFB]/
);
function kindOf(cp, ch) {
  if (cp < 127) {
    if (cp >= 32) return 0 /* Other */;
    if (cp === 13) return 1 /* CR */;
    if (cp === 10) return 2 /* LF */;
    return 3 /* Control */;
  }
  if (cp === 8205) return 5 /* ZWJ */;
  if (cp === 8204 || cp >= 65024 && cp <= 65039 || cp >= 127995 && cp <= 127999 || cp >= 917536 && cp <= 917631) {
    return 4 /* Extend */;
  }
  if (cp >= 127462 && cp <= 127487) return 6 /* RegionalIndicator */;
  if (cp >= 4352 && cp <= 4447 || cp >= 43360 && cp <= 43388) return 8 /* L */;
  if (cp >= 4448 && cp <= 4519 || cp >= 55216 && cp <= 55238) return 9 /* V */;
  if (cp >= 4520 && cp <= 4607 || cp >= 55243 && cp <= 55291) return 10 /* T */;
  if (cp >= 44032 && cp <= 55203) {
    return (cp - 44032) % 28 === 0 ? 11 /* LV */ : 12 /* LVT */;
  }
  if (cp === 3635 || cp === 3763) return 7 /* SpacingMark */;
  if (MARK.test(ch)) return 4 /* Extend */;
  if (CONTROL.test(ch)) return 3 /* Control */;
  return 0 /* Other */;
}
function joins(prev, next, afterEmojiZwj, nextIsPictographic, riCount) {
  if (prev === 1 /* CR */) return next === 2 /* LF */;
  if (prev === 2 /* LF */ || prev === 3 /* Control */) return false;
  if (next === 1 /* CR */ || next === 2 /* LF */ || next === 3 /* Control */) return false;
  if (prev === 8 /* L */ && (next === 8 /* L */ || next === 9 /* V */ || next === 11 /* LV */ || next === 12 /* LVT */)) {
    return true;
  }
  if ((prev === 11 /* LV */ || prev === 9 /* V */) && (next === 9 /* V */ || next === 10 /* T */)) return true;
  if ((prev === 12 /* LVT */ || prev === 10 /* T */) && next === 10 /* T */) return true;
  if (next === 4 /* Extend */ || next === 5 /* ZWJ */ || next === 7 /* SpacingMark */) return true;
  if (afterEmojiZwj && nextIsPictographic) return true;
  if (prev === 6 /* RegionalIndicator */ && next === 6 /* RegionalIndicator */) {
    return riCount % 2 === 1;
  }
  return false;
}
function segmentFallback(str) {
  const out = [];
  let current = "";
  let prev;
  let emoji = 0 /* None */;
  let riCount = 0;
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    const kind = kindOf(cp, ch);
    const isPictographic = kind === 0 /* Other */ && cp > 168 && PICTOGRAPHIC.test(ch);
    if (prev === void 0) {
      current = ch;
    } else if (joins(prev, kind, emoji === 2 /* Zwj */, isPictographic, riCount)) {
      current += ch;
    } else {
      out.push(current);
      current = ch;
      riCount = 0;
    }
    if (isPictographic) {
      emoji = 1 /* Pictographic */;
    } else if (emoji === 1 /* Pictographic */ && kind === 5 /* ZWJ */) {
      emoji = 2 /* Zwj */;
    } else if (!(emoji === 1 /* Pictographic */ && kind === 4 /* Extend */)) {
      emoji = 0 /* None */;
    }
    riCount = kind === 6 /* RegionalIndicator */ ? riCount + 1 : 0;
    prev = kind;
  }
  if (prev !== void 0) out.push(current);
  return out;
}

// src/index.ts
var cachedSegmenter;
function getSegmenter() {
  if (cachedSegmenter === void 0) {
    const Segmenter = typeof Intl === "undefined" ? void 0 : Intl.Segmenter;
    cachedSegmenter = typeof Segmenter === "function" ? new Segmenter(void 0, { granularity: "grapheme" }) : null;
  }
  return cachedSegmenter;
}
var SIMPLE = /^[\0-\x0c\x0e-\u02FF]*$/;
function assertString(value, name) {
  if (typeof value !== "string") {
    throw new TypeError(`graphemely: ${name} must be a string, got ${typeof value}`);
  }
}
function graphemes(str) {
  assertString(str, "str");
  if (SIMPLE.test(str)) return str.split("");
  const segmenter = getSegmenter();
  if (segmenter === null) return segmentFallback(str);
  const out = [];
  for (const { segment } of segmenter.segment(str)) out.push(segment);
  return out;
}
function length(str) {
  assertString(str, "str");
  if (SIMPLE.test(str)) return str.length;
  return graphemes(str).length;
}
var count = length;
function at(str, index) {
  const list = graphemes(str);
  let i = Math.trunc(index) || 0;
  if (i < 0) i += list.length;
  return i >= 0 && i < list.length ? list[i] : void 0;
}
function slice(str, start, end) {
  return graphemes(str).slice(start, end).join("");
}
function splitAt(str, index) {
  const list = graphemes(str);
  return [list.slice(0, index).join(""), list.slice(index).join("")];
}
var WHITESPACE = /^\s+$/;
var DEFAULT_ELLIPSIS = "\u2026";
function truncate(str, maxLength, options = {}) {
  if (!(maxLength >= 0)) {
    throw new RangeError(`graphemely: maxLength must be a non negative number, got ${maxLength}`);
  }
  const { ellipsis = DEFAULT_ELLIPSIS, wordBoundary = false } = options;
  const max = Math.floor(maxLength);
  if (str.length <= max) return str;
  const list = graphemes(str);
  if (list.length <= max) return str;
  const ellipsisLength = ellipsis === DEFAULT_ELLIPSIS ? 1 : length(ellipsis);
  if (ellipsisLength >= max) return list.slice(0, max).join("");
  const room = max - ellipsisLength;
  let kept = list.slice(0, room);
  if (wordBoundary) {
    const next = list[room];
    if (!WHITESPACE.test(next)) {
      let cut = kept.length - 1;
      while (cut > 0 && !WHITESPACE.test(kept[cut])) cut--;
      if (cut > 0) kept = kept.slice(0, cut);
    }
    while (kept.length > 0 && WHITESPACE.test(kept[kept.length - 1])) kept.pop();
  }
  return kept.join("") + ellipsis;
}
function reverse(str) {
  return graphemes(str).reverse().join("");
}
function pad(str, targetLength, padString, atStart) {
  assertString(padString, "padString");
  if (targetLength === Infinity) {
    throw new RangeError("graphemely: targetLength must be finite");
  }
  const missing = Math.trunc(targetLength) - length(str);
  if (!(missing > 0) || padString === "") return str;
  const unit = graphemes(padString);
  let fill = "";
  for (let i = 0; i < missing; i++) fill += unit[i % unit.length];
  return atStart ? fill + str : str + fill;
}
function padStart(str, targetLength, padString = " ") {
  return pad(str, targetLength, padString, true);
}
function padEnd(str, targetLength, padString = " ") {
  return pad(str, targetLength, padString, false);
}
function wrap(str, width, options = {}) {
  assertString(str, "str");
  if (!(width >= 1)) {
    throw new RangeError(`graphemely: width must be at least 1, got ${width}`);
  }
  const max = Math.floor(width);
  const hard = options.hard === true;
  const lines = [];
  for (const paragraph of str.split(/\r\n|\r|\n/)) {
    let line = "";
    let lineLength = 0;
    for (const word of paragraph.split(/[ \t]+/)) {
      if (word === "") continue;
      const wordLength = length(word);
      if (lineLength > 0) {
        if (lineLength + 1 + wordLength <= max) {
          line += " " + word;
          lineLength += 1 + wordLength;
          continue;
        }
        lines.push(line);
      }
      if (hard && wordLength > max) {
        const parts = graphemes(word);
        let i = 0;
        for (; parts.length - i > max; i += max) lines.push(parts.slice(i, i + max).join(""));
        line = parts.slice(i).join("");
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
function isWellFormed(str) {
  assertString(str, "str");
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 55296 || code > 57343) continue;
    if (code > 56319) return false;
    const next = str.charCodeAt(i + 1);
    if (!(next >= 56320 && next <= 57343)) return false;
    i++;
  }
  return true;
}
function toWellFormed(str) {
  if (isWellFormed(str)) return str;
  let out = "";
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 55296 && code <= 56319) {
      const next = str.charCodeAt(i + 1);
      if (next >= 56320 && next <= 57343) {
        out += str[i] + str[i + 1];
        i++;
        continue;
      }
      out += "\uFFFD";
    } else if (code >= 56320 && code <= 57343) {
      out += "\uFFFD";
    } else {
      out += str[i];
    }
  }
  return out;
}
export {
  at,
  count,
  graphemes,
  isWellFormed,
  length,
  padEnd,
  padStart,
  reverse,
  slice,
  splitAt,
  toWellFormed,
  truncate,
  wrap
};
