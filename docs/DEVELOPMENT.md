# Development

Build, test, and release workflow for Steam Plus. Architecture details:
[ARCHITECTURE.md](ARCHITECTURE.md). Contributor rules:
[../CONTRIBUTING.md](../CONTRIBUTING.md).

## Requirements

Node.js 22 (see `.nvmrc`).

```bash
npm install
npm run dev      # userscript dev server (dev: prefix)
npm run build    # build + refresh root .user.js / .meta.js
npm run verify:artifacts  # check dist/ and root artifacts match
npm run ci       # build + verify (CI gate)
```

Edit files under `src/` and rebuild — the root `.user.js` / `.meta.js` files
are generated, never hand-edited.

## Local testing

### Violentmonkey

1. Clone this repository.
2. Run `npm install && npm run build`, then install from the local
   `steam-plus.user.js` file.
3. Enable **Track local file** before closing the install dialog.
4. Edit `src/` in your IDE and rebuild — changes apply after a page reload.

### Tampermonkey

Tampermonkey does not track local files natively. Options:

- Reinstall the rebuilt file after each change, or
- Use a local HTTP server and temporarily point `@updateURL` / `@downloadURL`
  to `http://localhost:...` during development (do not commit local URLs).

## Configuration

Constants in `src/core/constants.js`: translation cache TTL, cache entry
limit, concurrent request cap, request text length cap, scan debounce.

## Screenshots

README screenshots live in `docs/screenshots/`. They are real captures of the
built `steam-plus.user.js` on a live Store page (translation target set to
French); refresh the matching image when a change alters its injected UI, and
keep the filenames referenced by `README.md`.

Reference screenshots and other repo files from the README with absolute URLs
(`raw.githubusercontent.com` for images, `github.com/.../blob/...` for pages):
the README is rendered outside GitHub as well (for example on Greasy Fork),
where relative paths break.

The README is localized into every interface language the script ships:
`README.md` (English) plus `README.<locale>.md` (`de`, `ru`, `es`, `fr`,
`pt-BR`, `zh-CN`, `ja`, `ko`, `pl`). Keep the same section structure and image
set in all ten, update them in the same change when a feature or screenshot
changes, and keep the language switcher at the top of each file listing every
locale in one fixed order (English, Deutsch, Русский, Español, Français,
Português (Brasil), 简体中文, 日本語, 한국어, Polski) with the current one in
bold. Localized files omit the version badge and the version literal in the
Status line so a release bump only touches `README.md`.

## Releasing

1. Bump `version` in `package.json` (`npm install` refreshes the lockfile)
   and run `npm run build` to regenerate `steam-plus.user.js` and
   `steam-plus.meta.js`.
2. Add an entry to [`CHANGELOG.md`](../CHANGELOG.md).
3. Push to `main` (or create a GitHub Release).