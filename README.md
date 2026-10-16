<p align="center">
  <b>English</b> | <a href="https://github.com/kwy404/graphemely/blob/main/i18n/README.pt-BR.md">Português (Brasil)</a>
</p>

<p align="center">
  <a href="https://kwy404.github.io/graphemely/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/graphemely@main/assets/banner-dark.svg">
      <img src="https://cdn.jsdelivr.net/gh/kwy404/graphemely@main/assets/banner.svg" width="880" alt="graphemely banner: Gem the cat with a ball of yarn. Native str.slice breaks a family emoji into a replacement character, graphemely slice keeps the character whole.">
    </picture>
  </a>
</p>

<h1 align="center">graphemely</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@kwy404/graphemely"><img src="https://img.shields.io/npm/v/@kwy404/graphemely?color=7B6CF6&label=npm" alt="npm version" height="20"></a>
  <a href="https://www.npmjs.com/package/@kwy404/graphemely"><img src="https://img.shields.io/npm/dm/@kwy404/graphemely?color=7B6CF6" alt="npm downloads per month" height="20"></a>
  <a href="https://github.com/kwy404/graphemely/actions/workflows/ci.yml"><img src="https://github.com/kwy404/graphemely/actions/workflows/ci.yml/badge.svg" alt="CI status" height="20"></a>
  <a href="https://github.com/kwy404/graphemely/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-22A06B" alt="MIT license" height="20"></a>
</p>

JavaScript strings count UTF-16 code units, so an emoji can have a length of 2, 8 or 14, and `str.slice(0, n)` can cut one in half. **graphemely** counts and cuts text by grapheme cluster instead: the characters people actually see. Flags, skin tones, family emoji, keycaps, accents, Hangul, Thai and Devanagari always stay whole.

It is small (about 2 kB gzipped), has no dependencies and ships ESM, CommonJS and TypeScript types. Paste your own text into the [live demo](https://kwy404.github.io/graphemely/) to see the difference.

```js
import { length, slice, truncate, measure } from '@kwy404/graphemely';

const family = '\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}'; // man, woman and girl joined by zero width joiners
const str = 'Hi' + family + '!';

str.length;           // 11
length(str);          // 4, what a person sees
str.slice(0, 3);      // 'Hi\uD83D', half an emoji
slice(str, 0, 3);     // 'Hi' + family
truncate(str, 3);     // 'Hi\u{2026}'
measure(str);         // { graphemes: 4, codePoints: 8, codeUnits: 11, bytes: 21 }
```

Emoji in this README are written as escapes such as `\u{1F680}` so the examples read the same everywhere. In your code you can type them directly.

## Install

```sh
npm install @kwy404/graphemely
```

With Deno, import from `npm:@kwy404/graphemely`. With CommonJS, use `const { truncate } = require('@kwy404/graphemely')`.

## API

Every function counts in grapheme clusters, as defined by [Unicode UAX #29](https://unicode.org/reports/tr29/), and throws a `TypeError` when `str` is not a string. Indices accept negative values where the native method does.

| Function | Returns | Use it instead of |
| --- | --- | --- |
| `graphemes(str)` | `string[]` | `str.split('')`, `[...str]` |
| `length(str)`, `count(str)` | `number` | `str.length` |
| `measure(str)` | `{ graphemes, codePoints, codeUnits, bytes }` | counting each unit by hand |
| `slice(str, start?, end?)` | `string` | `str.slice`, `str.substring` |
| `at(str, index)` | `string \| undefined` | `str.at`, `str[i]` |
| `splitAt(str, index)` | `[string, string]` | two slices |
| `truncate(str, maxLength, options?)` | `string` | `str.slice(0, n) + '...'` |
| `reverse(str)` | `string` | `str.split('').reverse().join('')` |
| `padStart(str, length, pad?)`, `padEnd(...)` | `string` | `str.padStart`, `str.padEnd` |
| `wrap(str, width, { hard }?)` | `string[]` | hand written word wrap |
| `isWellFormed(str)`, `toWellFormed(str)` | `boolean`, `string` | the ES2024 methods, on every runtime |

### truncate

`truncate(str, maxLength, options)` shortens text to at most `maxLength` graphemes. The ellipsis counts toward the limit, so the result always fits.

| Option | Default | What it does |
| --- | --- | --- |
| `ellipsis` | `'\u{2026}'` (one character) | Added where the text was cut. |
| `wordBoundary` | `false` | Cut at whitespace instead of inside a word, when one fits. |
| `position` | `'end'` | `'start'` keeps the end of the text, `'middle'` keeps both ends. |

```js
truncate('Hello world', 8);                                       // 'Hello w\u{2026}'
truncate('Hello world', 8, { wordBoundary: true });               // 'Hello\u{2026}'
truncate('Hello world', 8, { ellipsis: '...' });                  // 'Hello...'
truncate('vacation-photo-0042.jpeg', 15, { position: 'middle' }); // 'vacatio\u{2026}42.jpeg'
```

### measure

`measure(str)` returns the size of a string in every unit at once. Form limits are usually meant in graphemes, while databases and APIs often count bytes or UTF-16 code units.

```js
measure('Hi \u{1F44B}\u{1F3FD}'); // { graphemes: 4, codePoints: 5, codeUnits: 7, bytes: 11 }
```

### wrap, pad and well formed text

```js
wrap('the quick brown fox', 10);   // ['the quick', 'brown fox']
padStart('\u{1F600}', 3);          // '  \u{1F600}', two spaces where str.padStart adds one
toWellFormed('ok\uD83D');          // 'ok\u{FFFD}'
```

The [docs site](https://kwy404.github.io/graphemely/#api) has the full reference and four short guides: [truncating text](https://kwy404.github.io/graphemely/truncate-string-with-emoji.html), [counting characters](https://kwy404.github.io/graphemely/string-length-emoji.html), [splitting text into characters](https://kwy404.github.io/graphemely/split-string-into-characters.html) and [lone surrogates](https://kwy404.github.io/graphemely/lone-surrogates.html).

## ESLint plugin

The package includes three ESLint rules (flat config, ESLint 8.57 or newer) that find unsafe string code in an existing project. ESLint is an optional peer dependency.

```js
// eslint.config.js
import graphemely from '@kwy404/graphemely/eslint-plugin';

export default [graphemely.configs.recommended];
```

| Rule | Reports |
| --- | --- |
| [`no-unsafe-string-split`](https://github.com/kwy404/graphemely/blob/main/docs/rules/no-unsafe-string-split.md) | `str.split('')` |
| [`no-unsafe-reverse`](https://github.com/kwy404/graphemely/blob/main/docs/rules/no-unsafe-reverse.md) | `str.split('').reverse()` and `[...str].reverse().join('')` |
| [`prefer-graphemely-truncate`](https://github.com/kwy404/graphemely/blob/main/docs/rules/prefer-graphemely-truncate.md) | `str.slice(0, n) + '...'` and similar forms |

All three are warnings in `configs.recommended`.

## Runtime support

graphemely uses `Intl.Segmenter` in Node.js 16 and newer, Chrome and Edge 87+, Safari 14.1+, Firefox 125+, Deno and Bun. Elsewhere it uses a built-in fallback that follows the UAX #29 rules that matter in practice. The fallback skips the rare Prepend rule and the Unicode 15.1 Indic conjunct rule, so a few Devanagari conjuncts may count as two graphemes there. The output is ES2020, and the package is marked `sideEffects: false`, so bundlers keep only what you import. Run `npm run size` for exact numbers.

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](https://github.com/kwy404/graphemely/blob/main/CONTRIBUTING.md).

```sh
npm install
npm test
npm run lint
npm run typecheck
```

## More from kwy404

- [Monsoon](https://kwy404.github.io/monsoon/): utility first CSS from one file, no build step.
- [Voodoo.js](https://kwy404.github.io/Voodoo.js/): the HTML first JavaScript framework.
- [breakhound](https://kwy404.github.io/breakhound/): find bugs in any JavaScript or TypeScript library, no tests required.
- [vueleap](https://kwy404.github.io/vueleap/): migrate Vue 2 to Vue 3 with one command.
- [numberparrot](https://kwy404.github.io/numberparrot/): parse localized number and currency strings back into numbers.
- [edgegoat](https://kwy404.github.io/edgegoat/): edge case test inputs for time zones, unicode, NaN, URLs and more.
- [cookieowl](https://kwy404.github.io/cookieowl/): cookie consent for LGPD and GDPR that really blocks trackers.
- [installkite](https://kwy404.github.io/installkite/): make any website installable and offline capable.
- [a11ymedic](https://kwy404.github.io/a11ymedic/): an accessibility checker that explains every problem and gives the fix.
- [fontsketch](https://kwy404.github.io/fontsketch/): turn your handwriting into a font, in your browser.
- [kastor](https://kwy404.github.io/kastor/): the TypeScript ORM for almost every database.

## Author

Made by Alexandre Kohler ([GitHub](https://github.com/kwy404), [LinkedIn](https://www.linkedin.com/in/alexandre-silva-173687256/)). The [docs site](https://kwy404.github.io/graphemely/) is built with [Monsoon](https://kwy404.github.io/monsoon/), and its interactive parts with [Voodoo.js](https://kwy404.github.io/Voodoo.js/).

## License

[MIT](https://github.com/kwy404/graphemely/blob/main/LICENSE) © 2026 [Alexandre Kohler](https://github.com/kwy404). Gem the mascot and the artwork share the same license.
