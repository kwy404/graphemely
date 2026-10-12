# Changelog

All notable changes to this project are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/kwy404/graphemely/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/kwy404/graphemely/releases/tag/v0.1.0
