<p align="center">
  <a href="https://github.com/kwy404/graphemely/blob/main/README.md">English</a> | <b>Português (Brasil)</b>
</p>

<p align="center">
  <a href="https://kwy404.github.io/graphemely/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/graphemely@main/assets/banner-dark.svg">
      <img src="https://cdn.jsdelivr.net/gh/kwy404/graphemely@main/assets/banner.svg" width="880" alt="Banner do graphemely: a gata Gem com um novelo de lã. O str.slice nativo quebra um emoji de família, o slice do graphemely mantém o caractere inteiro.">
    </picture>
  </a>
</p>

<h1 align="center">graphemely</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@kwy404/graphemely"><img src="https://img.shields.io/npm/v/@kwy404/graphemely?color=7B6CF6&label=npm" alt="versão no npm" height="20"></a>
  <a href="https://github.com/kwy404/graphemely/actions/workflows/ci.yml"><img src="https://github.com/kwy404/graphemely/actions/workflows/ci.yml/badge.svg" alt="status do CI" height="20"></a>
  <a href="https://github.com/kwy404/graphemely/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-22A06B" alt="licença MIT" height="20"></a>
</p>

Strings JavaScript contam unidades de código UTF-16, então um emoji pode ter `length` 2, 8 ou 14, e `str.slice(0, n)` pode cortá-lo ao meio. O **graphemely** conta e corta texto por grafema: os caracteres que as pessoas realmente veem. Bandeiras, tons de pele, emojis de família, keycaps, acentos, coreano, tailandês e devanágari ficam sempre inteiros.

É pequeno (cerca de 2 kB com gzip), não tem dependências e inclui ESM, CommonJS e tipos TypeScript. Cole o seu próprio texto na [demonstração ao vivo](https://kwy404.github.io/graphemely/) para ver a diferença.

```js
import { length, slice, truncate, measure } from '@kwy404/graphemely';

const familia = '\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}'; // homem, mulher e menina unidos por zero width joiners
const str = 'Oi' + familia + '!';

str.length;           // 11
length(str);          // 4, o que uma pessoa vê
str.slice(0, 3);      // 'Oi\uD83D', meio emoji
slice(str, 0, 3);     // 'Oi' + familia
truncate(str, 3);     // 'Oi\u{2026}'
measure(str);         // { graphemes: 4, codePoints: 8, codeUnits: 11, bytes: 21 }
```

## Instalação

```sh
npm install @kwy404/graphemely
```

## API

Todas as funções contam em grafemas, conforme o [Unicode UAX #29](https://unicode.org/reports/tr29/).

| Função | Retorno | Use no lugar de |
| --- | --- | --- |
| `graphemes(str)` | `string[]` | `str.split('')`, `[...str]` |
| `length(str)`, `count(str)` | `number` | `str.length` |
| `measure(str)` | `{ graphemes, codePoints, codeUnits, bytes }` | contar cada unidade à mão |
| `slice(str, start?, end?)` | `string` | `str.slice`, `str.substring` |
| `at(str, index)` | `string \| undefined` | `str.at`, `str[i]` |
| `splitAt(str, index)` | `[string, string]` | dois slices |
| `truncate(str, maxLength, options?)` | `string` | `str.slice(0, n) + '...'` |
| `reverse(str)` | `string` | `str.split('').reverse().join('')` |
| `padStart`, `padEnd` | `string` | `str.padStart`, `str.padEnd` |
| `wrap(str, width, { hard }?)` | `string[]` | quebra de linha feita à mão |
| `isWellFormed(str)`, `toWellFormed(str)` | `boolean`, `string` | os métodos do ES2024, em qualquer runtime |

Em `truncate`, a reticência padrão é `'\u{2026}'` (um único caractere) e conta para o `maxLength`, então o resultado sempre cabe. `wordBoundary: true` corta em um espaço em vez de no meio de uma palavra. `position: 'start'` mantém o fim do texto e `position: 'middle'` mantém as duas pontas, bom para nomes de arquivo.

```js
truncate('foto-das-ferias-0042.jpeg', 15, { position: 'middle' }); // 'foto-da\u{2026}42.jpeg'
measure('Oi \u{1F44B}\u{1F3FD}'); // { graphemes: 4, codePoints: 5, codeUnits: 7, bytes: 11 }
```

A referência completa está no [README em inglês](https://github.com/kwy404/graphemely/blob/main/README.md#api) e no [site](https://kwy404.github.io/graphemely/#api).

## Plugin para ESLint

```js
// eslint.config.js
import graphemely from '@kwy404/graphemely/eslint-plugin';

export default [graphemely.configs.recommended];
```

Regras: `no-unsafe-string-split` (aponta `str.split('')`), `no-unsafe-reverse` (aponta `str.split('').reverse()` e `[...str].reverse().join('')`) e `prefer-graphemely-truncate` (aponta `str.slice(0, n) + '...'`). Documentação em [docs/rules](https://github.com/kwy404/graphemely/blob/main/docs/rules).

## Suporte

Node.js 16 ou mais novo, Chrome e Edge 87+, Safari 14.1+, Firefox 125+, Deno e Bun usam `Intl.Segmenter`. Os demais ambientes usam um fallback embutido que segue as regras do UAX #29 usadas na prática.

## Mais de kwy404

- [Monsoon](https://kwy404.github.io/monsoon/): CSS utility first em um único arquivo, sem etapa de build.
- [Voodoo.js](https://kwy404.github.io/Voodoo.js/): o framework JavaScript HTML first.
- [breakhound](https://kwy404.github.io/breakhound/): encontre bugs em qualquer biblioteca JavaScript ou TypeScript, sem escrever testes.
- [vueleap](https://kwy404.github.io/vueleap/): migre de Vue 2 para Vue 3 com um comando.
- [numberparrot](https://kwy404.github.io/numberparrot/): converta números e valores monetários localizados de volta em números.
- [edgegoat](https://kwy404.github.io/edgegoat/): entradas de teste para casos extremos de fuso horário, unicode, NaN, URLs e mais.
- [cookieowl](https://kwy404.github.io/cookieowl/): consentimento de cookies para LGPD e GDPR que bloqueia rastreadores de verdade.
- [installkite](https://kwy404.github.io/installkite/): torne qualquer site instalável e com funcionamento offline.
- [a11ymedic](https://kwy404.github.io/a11ymedic/): verificador de acessibilidade que explica cada problema e mostra a correção.
- [fontsketch](https://kwy404.github.io/fontsketch/): transforme a sua letra em uma fonte, no navegador.
- [kastor](https://kwy404.github.io/kastor/): o ORM para TypeScript para quase todos os bancos de dados.

## Autor

Feito por Alexandre Kohler ([GitHub](https://github.com/kwy404), [LinkedIn](https://www.linkedin.com/in/alexandre-silva-173687256/)). O [site](https://kwy404.github.io/graphemely/) é feito com [Monsoon](https://kwy404.github.io/monsoon/), e as partes interativas com [Voodoo.js](https://kwy404.github.io/Voodoo.js/).

## Licença

[MIT](https://github.com/kwy404/graphemely/blob/main/LICENSE) © 2026 [Alexandre Kohler](https://github.com/kwy404).
