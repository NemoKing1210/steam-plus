# Contributing to Steam Plus

Thanks for helping out. This project is a vanilla-JS userscript with a Vite
build — read the workflow below before opening a pull request.

## Ground rules

- Be kind and stay on topic: one issue/PR per problem or feature.
- This project is **not affiliated** with Valve or Steam. Do not add copy or
  metadata that imply otherwise.
- By contributing you agree your work is licensed under the repo's MIT license.

## Prerequisites

- Node.js 22 (see `.nvmrc`) and npm.
- A userscript manager for testing: Violentmonkey (recommended, tracks local
  files) or Tampermonkey.

## Setup

```bash
git clone https://github.com/NemoKing1210/steam-plus.git
cd steam-plus
npm install
npm run ci   # build + verify artifacts; must pass before you start
```

## Development workflow

1. Create a branch from `main` (`feat/…`, `fix/…`, `docs/…`).
2. Edit files under `src/` only. **Never hand-edit** the generated
   `steam-plus.user.js` / `steam-plus.meta.js` — they are build output.
3. Rebuild and verify after every change:
   ```bash
   npm run build              # regenerates root .user.js / .meta.js
   npm run verify:artifacts   # dist/ ↔ root must match
   ```
4. Test on live Steam pages (store listing, game page, profile comments).
5. Run `npm run ci` before pushing.

### Conventions

- Vanilla JavaScript ESM; no frameworks, no TypeScript, no new dependencies
  without discussion.
- Respect the import direction `utils ← core ← translation ← features`.
- Keep injected UI Steam-native and prefixed with `sp-`.
- Keep `@connect`, `@match`, and GM grants minimal — do not expand them
  "just in case".

### Localization

UI strings live in `src/i18n/locales/*.js` (one file per locale). Every new
user-facing string must be added to **all ten** locales with identical key
order — machine translation is acceptable for a first pass, mark it as such
in the PR. If you change what the script does, update the localized
`@name` / `@description` tags in `vite.config.js` too.

### Versioning and changelog

- Your PR should include a `CHANGELOG.md` entry under `## [Unreleased]`
  (Keep a Changelog format: `Added` / `Changed` / `Fixed`).
- Version numbers follow SemVer (`package.json` is the source of truth).
  Run `npm run build` after bumping the version to refresh both root
  artifacts.

## Testing checklist

- [ ] `npm run ci` passes.
- [ ] Root `.user.js` / `.meta.js` regenerated (`verify:artifacts` green).
- [ ] Settings panel: changes persist across reload; tabs switch correctly.
- [ ] Translation: descriptions, reviews, and comments translate; global
      switch restores originals; below/replace modes behave as configured.
- [ ] New strings appear in all ten locales (or the gap is noted).

## Pull request process

1. Fork, branch, commit with clear messages.
2. Keep PRs focused; unrelated drive-by refactors will be asked to split out.
3. Fill in the testing checklist above.
4. CI must be green. Version bumps and releases are handled by maintainers.
