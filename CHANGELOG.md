# Changelog

All notable changes to this project are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/kwy404/graphemely/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/kwy404/graphemely/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/kwy404/graphemely/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/kwy404/graphemely/releases/tag/v0.1.0
