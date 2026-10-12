# graphemely/prefer-graphemely-truncate

Prefer `truncate()` from graphemely over `str.slice(0, n) + '...'`, which can cut emoji in half.

This rule is enabled as a warning in `graphemely.configs.recommended`.

## Why

`slice`, `substring` and `substr` count UTF-16 code units. When the cut lands inside an emoji, the result ends with a lone surrogate that renders as a replacement box, breaks `encodeURIComponent` and corrupts JSON sent to some APIs. Even when no surrogate is split, the cut can drop a skin tone, separate a flag, or detach an accent.

```js
const title = 'Party time \u{1F389}\u{1F389}';
title.slice(0, 12) + '...';  // ends with half of an emoji
```

## Rule details

This is a deliberately conservative heuristic. It only reports a prefix cut (first argument is the literal `0`) that is immediately followed by an ellipsis made of two or three dots or the single `…` character (U+2026), optionally surrounded by spaces:

Examples of **incorrect** code:

```js
str.slice(0, 10) + '...';
str.substring(0, n) + '..';
str.substr(0, 5) + ' ...';
title.slice(0, max - 1) + '\u{2026}';
`${str.slice(0, 10)}...`;
```

Examples of **correct** code:

```js
import { truncate } from '@kwy404/graphemely';

truncate(str, 10);
truncate(str, 10, { ellipsis: '...' });
str.slice(0, 10) + suffix;    // not an ellipsis literal, not reported
str.slice(start, 10) + '...'; // not a prefix cut, not reported
```

## How to fix

Use `truncate(str, maxLength, { ellipsis })`. Note that graphemely counts the ellipsis toward `maxLength`, so `str.slice(0, 10) + '...'` (13 characters) roughly corresponds to `truncate(str, 13, { ellipsis: '...' })`.
