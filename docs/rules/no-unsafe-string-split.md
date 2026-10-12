# graphemely/no-unsafe-string-split

Disallow `.split('')`, which breaks emoji and combining characters into pieces.

This rule is enabled as a warning in `graphemely.configs.recommended`.

## Why

`str.split('')` splits a string into UTF-16 code units, not characters. Anything outside the Basic Multilingual Plane (most emoji) becomes two broken halves called lone surrogates, and anything built from several code points (accented letters written with combining marks, flags, skin tones, family emoji joined with zero width joiners) is scattered into parts.

```js
'cafe\u{301}'.split('');            // ['c', 'a', 'f', 'e', '\u{301}'], the accent is detached
'\u{1F600}'.split('');             // ['\uD83D', '\uDE00'], two lone surrogates
```

## Rule details

Examples of **incorrect** code:

```js
str.split('');
str.split("");
str.split(``);
str['split']('');
name.trim().split('').map(toUpper);
```

Examples of **correct** code:

```js
import { graphemes } from '@kwy404/graphemely';

graphemes(str);
str.split(' ');
str.split(',');
str.split(/\s+/);
```

## How to fix

Replace `str.split('')` with `graphemes(str)` from graphemely. It returns one item per user-perceived character.

## When not to use it

If you really need UTF-16 code units (for example, when implementing an encoder), disable the rule for that line.
