# graphemely/no-unsafe-reverse

Disallow reversing strings by code unit or code point, which scrambles emoji, flags and accents.

This rule is enabled as a warning in `graphemely.configs.recommended`.

## Why

The classic one-liners for reversing a string operate on code units or code points:

```js
str.split('').reverse().join('');     // breaks every emoji into lone surrogates
[...str].reverse().join('');          // keeps code points, still breaks sequences
Array.from(str).reverse().join('');   // same as the spread version
```

The spread version looks safe, but a flag is two regional indicator code points, so reversing them produces a different flag (or none). Accents written with combining marks jump to the wrong letter, and family emoji joined with zero width joiners fall apart.

## Rule details

The rule reports a `.reverse()` call when:

- it is called on `x.split('')` (always reported), or
- it is called on `[...x]` or `Array.from(x)` **and** the result is joined back into a string with `.join(...)`.

Reversing a real array is fine, so `[...items].reverse()` without `.join` is not reported.

Examples of **incorrect** code:

```js
str.split('').reverse().join('');
str.split('').reverse();
[...str].reverse().join('');
Array.from(str).reverse().join('');
```

Examples of **correct** code:

```js
import { reverse } from 'graphemely';

reverse(str);
[...items].reverse();
items.slice().reverse().map(render);
```

## How to fix

Use `reverse(str)` from graphemely, which reverses by grapheme cluster.
