# Contributing to graphemely

Thanks for helping. Bug reports with a failing input string are the most useful thing you can send.

## Setup

```sh
git clone https://github.com/kwy404/graphemely.git
cd graphemely
npm install
```

## Checks

```sh
npm test            # vitest
npm run coverage    # vitest with coverage thresholds
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run build       # tsup, ESM + CJS + .d.ts in dist/
npm run size        # bundle size report (after build)
```

All of them run in CI on every pull request.

## Docs site

The site in `docs/` is plain HTML styled with Monsoon. Shared parts (header, footer, install tabs, the guide rail, the inline drawings from `docs/assets/art/`), the search index, the ESLint demo bundle and the highlighted code are generated in place:

```sh
npm run docs:build  # library build, then scripts/build-docs.mjs and scripts/highlight-docs.mjs
```

## Guidelines

- Keep the public API small. New functions need a clear use case, TSDoc with an example, and tests.
- Write non-ASCII test data as escapes (`'\u{1F600}'`, `'e\u{301}'`) and name what it is in a comment or constant, see `test/fixtures.ts`.
- Changes to the fallback segmenter (`src/fallback.ts`) should come with cases in `test/fixtures.ts`. The randomized test compares the fallback with `Intl.Segmenter`.
- ESLint rules must stay conservative: no false positives on ordinary array code. Add both valid and invalid cases and update the matching file in `docs/rules/`.
- Add a line to `CHANGELOG.md` under "Unreleased".

## Reporting a bug

Open an issue with the input string (as escapes if possible), what you expected, what you got, and your runtime (Node version or browser).
