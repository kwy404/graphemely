# Changelog

All notable changes to this project are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `measure(str)` returns the size of a string in graphemes, code points, UTF-16 code units and UTF-8 bytes in one call, for form limits and database columns that count in different units.
- `truncate` takes a `position` option: `'end'` (the default), `'start'` to keep the end of the text, or `'middle'` to keep both ends, which suits file names and paths. `wordBoundary` works on whichever side is cut.

### Changed

- Docs site: the home page opens with a paste and see demo. Paste any text and its characters appear as tiles, next to what `.length` says and a native `slice` cut beside a safe one.
- Docs site: four guides with plain titles. The reverse and substring pages now point to `reverse` and `slice` in the function index. The READMEs are shorter.
- Docs site: special dates. On New Year, Carnival, Easter, Valentine's Day, Festa Junina (Midsummer outside Brazil), Halloween and Christmas the site dresses Gem in costume, hangs a garland and adds light seasonal particles. A chip in the top strip turns it off, and `?season=<id>` or `?season=off` previews it.
- Docs site rebuilt as an editorial type specimen with Monsoon: a Text Lab that shows every grapheme cluster with its code points, UTF-16 units and bytes, a live ESLint demo that runs the plugin's own rules in the browser, a search dialog, numbered guides with a table of contents rail, and new line drawings. `npm run docs:build` regenerates the shared parts, the search index and the highlighted code.

## [1.0.0] - 2026-10-13

### Changed

- First stable release. The public API is now covered by semantic versioning: breaking changes only in a new major version.

## [0.1.2] - 2026-10-12

### Changed

- The Portuguese README moved to `i18n/README.pt-BR.md`, so the npm package ships only the English README and npmjs.com shows it.
- README: monthly and total npm download badges, and a "More from kwy404" section.
- Docs site redesigned: interactive parts built with Voodoo.js, every code example pre-rendered with Shiki in a VS Code style frame (Light+ and Dark+), a live playground for length, slice, truncate, reverse and graphemes, install tabs and an FAQ.

## [0.1.1] - 2026-10-12

### Changed

- Published as `@kwy404/graphemely` on npm.
- README images and links use absolute URLs so they render on npmjs.com.

## [0.1.0] - 2026-10-12

### Added

- `graphemes`, `length`, `count`, `at`, `slice`, `splitAt`, `truncate`, `reverse`, `padStart`, `padEnd`, `wrap`, `isWellFormed` and `toWellFormed`, all counting grapheme clusters.
- `Intl.Segmenter` based segmentation with a built-in UAX #29 fallback for runtimes without it.
- ESLint plugin at `@kwy404/graphemely/eslint-plugin` with the rules `no-unsafe-string-split`, `no-unsafe-reverse` and `prefer-graphemely-truncate`, plus a `recommended` flat config.
- ESM and CommonJS builds with TypeScript declarations.

[Unreleased]: https://github.com/kwy404/graphemely/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/kwy404/graphemely/compare/v0.1.2...v1.0.0
[0.1.2]: https://github.com/kwy404/graphemely/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/kwy404/graphemely/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/kwy404/graphemely/releases/tag/v0.1.0
