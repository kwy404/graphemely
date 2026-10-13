<p align="center">
  <a href="https://github.com/kwy404/graphemely/blob/main/README.md">English</a> | <b>Português (Brasil)</b>
</p>

<p align="center">
  <a href="https://kwy404.github.io/graphemely/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/graphemely@main/assets/banner-dark.svg">
      <img src="https://cdn.jsdelivr.net/gh/kwy404/graphemely@main/assets/banner.svg" width="880" alt="Banner do graphemely: a gata Gem com um novelo de lã ao lado do slogan truncar, fatiar e contar strings com emoji com segurança em JavaScript. O str.slice nativo quebra um emoji de família, o slice do graphemely mantém o grafema inteiro.">
    </picture>
  </a>
</p>

<h1 align="center">graphemely: truncar, fatiar e contar strings com emoji com segurança em JavaScript</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@kwy404/graphemely"><img src="https://img.shields.io/npm/v/@kwy404/graphemely?color=7B6CF6&label=npm" alt="versão do graphemely no npm" height="20"></a>
  <a href="https://bundlephobia.com/package/@kwy404/graphemely"><img src="https://img.shields.io/bundlephobia/minzip/@kwy404/graphemely?color=FF6F91&label=minzip" alt="tamanho do graphemely minificado e com gzip" height="20"></a>
  <a href="https://github.com/kwy404/graphemely/actions/workflows/ci.yml"><img src="https://github.com/kwy404/graphemely/actions/workflows/ci.yml/badge.svg" alt="status do CI do graphemely" height="20"></a>
  <a href="https://github.com/kwy404/graphemely/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-22A06B" alt="licença MIT" height="20"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/types-TypeScript-3178C6" alt="tipos TypeScript incluídos" height="20"></a>
</p>

**graphemely** é uma biblioteca pequena e sem dependências que conta e corta strings JavaScript do jeito que as pessoas enxergam. Em JavaScript, `length`, `slice`, `substring`, `split('')` e `reverse` trabalham com unidades de código UTF-16, então o tamanho de um emoji é 2 (ou 8, ou 14) e `str.slice(0, n)` pode cortar um emoji ao meio. O graphemely trabalha com **grapheme clusters** (grafemas), então você pode truncar uma string com emoji, medir o tamanho real de uma string com emoji, fazer um substring seguro para Unicode e inverter uma string sem quebrar bandeiras, tons de pele, emojis de família, keycaps, acentos (`é` composto ou decomposto), coreano, tailandês ou devanágari.

```js
import { length, truncate, slice, reverse } from '@kwy404/graphemely';

const familia = '\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}'; // homem, mulher e menina unidos por zero width joiners

familia.length;             // 8   (unidades de código UTF-16)
length(familia);            // 1   (o que uma pessoa vê)

const str = 'Oi' + familia + '!';
str.slice(0, 3);            // 'Oi\uD83D'  surrogate solitário, aparece como um quadrado quebrado
slice(str, 0, 3);           // 'Oi' + familia, o emoji inteiro
truncate(str, 3);           // 'Oi…'
reverse(str);               // '!' + familia + 'iO'
```

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/kwy404/graphemely@main/assets/demo.svg" width="720" alt="Demonstração animada: str.slice(0, 3) nativo corta um emoji de família no meio e deixa um surrogate solitário, enquanto slice(str, 0, 3) do graphemely corta na fronteira do grafema e mantém o emoji inteiro">
</p>

## Sumário

- [Instalação](#instalação)
- [Uso rápido](#uso-rápido)
- [API](#api)
- [Como truncar uma string com emoji em JavaScript?](#como-truncar-uma-string-com-emoji-em-javascript)
- [Por que o length de um emoji é 2?](#por-que-o-length-de-um-emoji-é-2)
- [Plugin para ESLint](#plugin-para-eslint)
- [Comparação com alternativas](#comparação-com-alternativas)
- [Suporte a navegadores e runtimes](#suporte-a-navegadores-e-runtimes)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

Guias (em inglês) com exemplos ao vivo: [truncar string com emoji](https://kwy404.github.io/graphemely/truncate-string-with-emoji.html), [tamanho de string com emoji](https://kwy404.github.io/graphemely/string-length-emoji.html), [inverter string com Unicode](https://kwy404.github.io/graphemely/reverse-string-unicode.html), [dividir string em caracteres](https://kwy404.github.io/graphemely/split-string-into-characters.html), [substring sem quebrar emoji](https://kwy404.github.io/graphemely/substring-without-breaking-emoji.html), [remover surrogates solitários](https://kwy404.github.io/graphemely/lone-surrogates.html) e o [playground](https://kwy404.github.io/graphemely/#playground).

## Instalação

```sh
npm install @kwy404/graphemely
```

Inclui builds ESM e CommonJS com declarações TypeScript. Nenhuma dependência em tempo de execução.

## Uso rápido

```js
import { graphemes, length, truncate, at, wrap } from '@kwy404/graphemely';

const texto = 'Bora \u{1F680}\u{1F680}\u{1F680} com a equipe';

length(texto);                               // 21
truncate(texto, 9);                          // 'Bora \u{1F680}\u{1F680}\u{1F680}…'
truncate(texto, 13, { wordBoundary: true }); // 'Bora \u{1F680}\u{1F680}\u{1F680} com…'
truncate(texto, 9, { ellipsis: '...' });     // 'Bora \u{1F680}...'
at(texto, 5);                                // '\u{1F680}', o emoji inteiro
graphemes('cafe\u{301}');                    // ['c', 'a', 'f', 'e\u{301}']
wrap('a raposa marrom pulou', 10);           // ['a raposa', 'marrom', 'pulou']
```

Neste README os emojis aparecem como escapes JavaScript, por exemplo `\u{1F680}` (um foguete). No seu código você pode digitá-los diretamente.

## API

Todas as funções contam em **grapheme clusters**, conforme o [Unicode UAX #29](https://unicode.org/reports/tr29/).

| Função | Retorno | Substitui |
| --- | --- | --- |
| `graphemes(str)` | `string[]` | `str.split('')`, `[...str]` |
| `length(str)` / `count(str)` | `number` | `str.length` |
| `slice(str, start?, end?)` | `string` | `str.slice`, `str.substring` |
| `at(str, index)` | `string \| undefined` | `str.at`, `str[i]` |
| `splitAt(str, index)` | `[string, string]` | `[str.slice(0, i), str.slice(i)]` |
| `truncate(str, maxLength, { ellipsis, wordBoundary }?)` | `string` | `str.slice(0, n) + '...'` |
| `reverse(str)` | `string` | `str.split('').reverse().join('')` |
| `padStart` / `padEnd(str, targetLength, padString?)` | `string` | `str.padStart`, `str.padEnd` |
| `wrap(str, width, { hard }?)` | `string[]` | quebra de linha feita à mão |
| `isWellFormed(str)` / `toWellFormed(str)` | `boolean` / `string` | métodos do ES2024 |

Em `truncate`, a reticência padrão é `'…'` (um único caractere, U+2026) e **conta para o `maxLength`**, então o resultado sempre cabe. Com `wordBoundary: true` o corte acontece no último espaço que couber. A documentação completa de cada função está no [README em inglês](https://github.com/kwy404/graphemely/blob/main/README.md#api-reference).

## Como truncar uma string com emoji em JavaScript?

O clássico `str.slice(0, n) + '...'` conta unidades de código UTF-16. Se o corte cair dentro de um emoji, sobra um surrogate solitário (um quadrado quebrado, que faz `encodeURIComponent` lançar erro). Use `truncate(str, n)`, que nunca corta um grafema.

## Por que o length de um emoji é 2?

`String.prototype.length` conta unidades de código UTF-16. Caracteres fora do plano básico, como a maioria dos emojis, usam duas unidades (um par de surrogates). Emojis com tom de pele usam 4, bandeiras 4, uma família de três pessoas 8. `length(str)` conta grafemas e retorna 1 para todos eles.

## Plugin para ESLint

```js
// eslint.config.js
import graphemely from '@kwy404/graphemely/eslint-plugin';

export default [graphemely.configs.recommended];
```

Regras: `no-unsafe-string-split` (aponta `str.split('')`), `no-unsafe-reverse` (aponta `str.split('').reverse()` e `[...str].reverse().join('')`) e `prefer-graphemely-truncate` (aponta `str.slice(0, n) + '...'`). Documentação em [docs/rules](https://github.com/kwy404/graphemely/blob/main/docs/rules).

## Comparação com alternativas

- **grapheme-splitter**: sem novas versões desde 2018, cerca de 7.7 kB com gzip, só divide e conta.
- **graphemer**: fork mantido, cerca de 14.9 kB com gzip, só divide e conta.
- **`Intl.Segmenter`**: é o que o graphemely usa quando existe. Usar direto funciona, mas é verboso e você precisa escrever truncamento, reticências e quebra por palavra.
- **lodash `_.truncate`**: usa uma expressão regular que entende pares de surrogates, marcas combinantes e sequências ZWJ, mas é uma aproximação: separa sílabas coreanas escritas com jamo, conta a palavra tailandesa para água como 3 caracteres e `\r\n` como 2.

## Suporte a navegadores e runtimes

Node.js 16 ou mais novo, Chrome e Edge 87+, Safari 14.1+, Firefox 125+, Deno e Bun usam `Intl.Segmenter`. Ambientes sem `Intl.Segmenter` usam um fallback embutido que implementa as regras do UAX #29 usadas na prática. Tamanho: cerca de 2 kB minificado e com gzip.

## Contribuindo

Issues e pull requests são bem-vindos. Veja [CONTRIBUTING.md](https://github.com/kwy404/graphemely/blob/main/CONTRIBUTING.md).

## Licença

[MIT](https://github.com/kwy404/graphemely/blob/main/LICENSE) © 2026 [Alexandre Kohler](https://github.com/kwy404).
