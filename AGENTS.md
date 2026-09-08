# AGENTS.md — Steam Plus

Instructions for AI coding agents working in this repository.

## Project

Userscript that improves Steam Store (`store.steampowered.com`) and Steam
Community (`steamcommunity.com`). Stage 1 ships a full settings panel and
content translation (game descriptions, reviews, profile comments, news),
with more Steam improvements planned. Built with Vite and
`vite-plugin-monkey` for Tampermonkey, Violentmonkey, ScriptCat, and
compatible managers.

- Source entry point: `src/main.js`
- Version source of truth: `package.json`
- Generated install artifacts: `steam-plus.user.js` and `steam-plus.meta.js`
  (produced only by `npm run build`)
- Docs: `README.md`, `CHANGELOG.md` (Keep a Changelog + SemVer), and
  `DESIGN.md` (visual rules for all injected UI — see Design below)
- License: MIT

Edit files under `src/`. Never hand-edit generated `.user.js` / `.meta.js`
files; regenerate them with `npm run build`.

## Repository layout

```text
steam-plus/
├── AGENTS.md               # This file: architecture and repo conventions
├── DESIGN.md               # Visual rules for every injected UI element
├── src/
│   ├── main.js             # Entry: locale init, MutationObserver scan loop
│   ├── core/
│   │   ├── constants.js    # DEFAULT_SETTINGS, storage keys, limits, timings
│   │   ├── settings.js     # Settings state, normalization, persistence
│   │   └── bus.js          # Minimal pub/sub (on / off / emit)
│   ├── i18n/
│   │   ├── index.js        # configureLocale / getLocale / t
│   │   ├── meta.js         # SUPPORTED_LOCALES, aliases, native names
│   │   └── locales/        # One file per locale + index.js registry
│   │       ├── index.js    # TRANSLATIONS map (en, ru, de, es, fr,
│   │       │               #   pt-BR, zh-CN, ja, ko, pl)
│   │       └── en.js ru.js de.js es.js fr.js pt-BR.js zh-CN.js ja.js ko.js pl.js
│   ├── translation/
│   │   ├── engine.js       # Scan → controllers → request queue → cache
│   │   ├── providers/
│   │   │   ├── index.js    # Provider registry (registerProvider)
│   │   │   └── google-free.js # Free Google endpoint (client=gtx, no key)
│   │   ├── targets/
│   │   │   ├── index.js    # Target registry (registerTarget)
│   │   │   ├── all.js      # Imports every target module (side effects)
│   │   │   └── game-description.js game-reviews.js profile-comments.js game-news.js
│   │   ├── cache.js        # GM-backed cache (TTL, LRU trim, debounced persist)
│   │   └── ui/
│   │       └── controller.js  # TranslatableNode: button + below/replace render
│   ├── features/
│   │   └── settings/
│   │       ├── index.js    # Settings entry: account-menu item + header
│   │       │               #   fallback button, GM menu command, tabs
│   │       ├── panel.js    # Tabbed panel shell (registerTab / togglePanel)
│   │       ├── controls.js # Row / switch / select / segmented / checkbox / button
│   │       └── tabs/
│   │           ├── general.js       # Interface language, reset
│   │           └── translation.js   # Enabled, provider, trigger, display, scopes
│   ├── styles/
│   │   ├── tokens.css      # :root design tokens (sp- palette — DESIGN.md)
│   │   └── app.css         # Injected styles, sp- prefix (GM_addStyle via build)
│   └── utils/
│       └── dom.js          # el, append, debounce, isOwnUi, resolveTargetLanguage
├── scripts/
│   ├── lib/artifacts.mjs   # ARTIFACT_FILES list (single source of truth)
│   ├── copy-dist.mjs       # dist/ → root artifact copy
│   └── verify-artifacts.mjs# dist/ ↔ root byte-identity check
├── dist/                   # Build output (gitignored)
├── steam-plus.user.js      # Generated bundle (do not hand-edit)
├── steam-plus.meta.js      # Generated metadata (do not hand-edit)
├── vite.config.js          # Build + ==UserScript== metadata
├── package.json            # Version source of truth
└── .github/workflows/ci.yml# Build + verify gate
```

## Module reference

### `src/main.js` — entry and scan loop

Owns the single page-level `MutationObserver` and the debounced scan loop:

- `init()`: `configureLocale(getSettings().language)` →
  `initSettingsFeature()` → `initTranslationEngine()` → `pagehide` cache
  flush hook → initial `scheduleScan()` → observer attach.
- `runScan()` drains `pendingScanNodes`; the first scan is a full-document
  pass (`hasInitialScan` drops the collected nodes), later scans process only
  added nodes. Nodes belonging to our own UI are skipped via `isOwnUi()`.
- The observer filters added nodes whose `closest('.sp-panel-overlay,
  .sp-settings-btn')` hits before they ever reach the queue; every added node
  is a scan root, so Steam re-renders are picked up automatically.

Do not add a second observer or scan loop anywhere else — route new page
watchers through the existing pipeline.

### `src/core/constants.js`

Single place for magic values. Notable entries:

- `SCRIPT_NAME`, storage keys `SETTINGS_KEY = 'sp_settings_v1'`,
  `TRANSLATION_CACHE_KEY = 'sp_translation_cache_v1'`.
- Translation limits: `TRANSLATION_CACHE_TTL_MS` (7 days),
  `TRANSLATION_CACHE_MAX_ENTRIES` (2000, LRU trim),
  `MAX_CONCURRENT_REQUESTS` (3), `MAX_REQUEST_TEXT_LENGTH` (4000 chars,
  hard-split), `SCAN_DEBOUNCE_MS` (450), `CACHE_PERSIST_MS` (1000).
- `DEFAULT_TRANSLATION` and `DEFAULT_SETTINGS` (defaults for `language` and
  the whole `translation` block); `getDefaults()` returns a deep clone (the
  objects are shared constants — never mutate them directly).

### `src/core/settings.js`

Module-level `settings` loaded once at import (`loadSettings()`), normalizers
per field, `saveSettings(patch)` merges → normalizes → persists → returns the
new state. Public API: `loadSettings`, `getSettings`,
`getTranslationSettings`, `saveSettings`, `resetSettings`.

Key facts that must survive refactors:

- `saveSettings()` does **not** notify features — the caller (settings UI)
  emits the matching bus event afterwards. Keep this separation: persistence
  in `core`, reactions in the UI/features via the bus.
- Every value is normalized on load and on save (locale whitelist,
  trigger `'auto' | 'manual'`, display `'below' | 'replace'`,
  target language regex, scope booleans defaulting to enabled). Unknown
  values fall back to defaults, never crash.
- GM storage is wrapped in try/catch — a userscript sandbox without storage
  must not break the page.

### `src/core/bus.js`

Minimal pub/sub: `on(event, fn)` (returns an unsubscribe fn), `off`,
`emit(event, payload)`. Listener exceptions are caught and logged with code
`SP-1001` — one bad listener never kills the others. Emitted events:

- `settings:translation` — emitted by the panel footer Save. The engine
  listens and reconciles live controllers (`applyTranslationSettings`).

### `src/core/debug.js` — diagnostics

Structured console logging. Every failure carries a stable `SP-####` code
(grep the code to find the throw site): `Codes` registry, `fail(code,
message, details, cause)` to build coded errors, `logError`/`logWarn`
(always printed, styled badge + details object), `logInfo(area, …)`
(verbose only — enable with `localStorage sp_debug=1` or
`window.__SP_DEBUG__=true`), `previewText()` for safe text excerpts.
Rules: log once per user-visible failure at the outermost point
(`SP-1201` in the controller, carrying the origin `cause` code +
provider/scope/lang context); layers below only throw coded errors.
Storage hiccups are warnings (`SP-1210`/`SP-1211`), never silent.
- `settings:language` — emitted by the General tab on language change/reset;
  reserved for future feature listeners (the panel re-renders itself directly
  after emitting).

### `src/translation/engine.js` — orchestration

- Concurrency-limited queue: `enqueue(task)` + `pump()` allow at most
  `MAX_CONCURRENT_REQUESTS` in flight. All provider traffic goes through this
  queue via `translateText()` — never call a provider directly from features.
- `translateText(text)`: reads current settings, resolves the provider and
  target language, checks the cache (key `provider|to|text`), queues the
  request on miss, stores the result. Failures are **not** cached.
- `scanForTranslatable(root)`: for each enabled target, `querySelectorAll`
  under the root and attach a `TranslatableNode` per unmatched element;
  elements inside own UI (`.sp-translation`, `.sp-translate-btn`) are
  skipped. Attach state lives in a `WeakMap<Element, TranslatableNode>`.
  New controllers start hidden: with `showCached` on, a cache hit renders
  instantly; otherwise the button appears once the element is near the
  viewport (`pendingVisible`, rAF-throttled scroll/resize checks, 500px
  margin) and `auto` trigger fires only then — off-screen content costs
  no requests.
- `applyTranslationSettings()` (bus listener): disables → full teardown
  (`pruneAll`); otherwise prunes disabled scopes, rescans the document and
  pushes config changes into live controllers (`onConfigChange`).
- `initTranslationEngine()` loads the memory cache and subscribes to the bus.

### `src/translation/cache.js`

Memory-first cache over `GM_getValue`/`GM_setValue`:

- `loadMemoryCache()` reads the persisted entries once, dropping expired ones
  (TTL check). Reads/writes go through the in-memory `Map`.
- `getCachedTranslation(provider, to, text)` / `setCachedTranslation(...)`;
  writes are persisted debounced (`CACHE_PERSIST_MS`) with an LRU trim to
  `TRANSLATION_CACHE_MAX_ENTRIES` at flush time.
- `persistCacheNow()` flushes pending writes **synchronously** (cancels the
  timer); it is bound to `pagehide` in `main.js` so nothing is lost when the
  tab closes.
- `clearTranslationCache()` wipes memory + storage (wired to the Cache tab
  action); `removeTranslationCacheEntry(key)` deletes one entry.
- `getTranslationCacheStats()` (counts, bytes, per-provider split) and
  `listTranslationCacheEntries()` (newest first) feed the Cache tab meter
  and list.

### `src/translation/providers/`

Registry: `registerProvider({ id, labelKey, translate(texts, { to }) })`,
`getProvider(id)`, `listProviders()`. `google-free.js` registers itself by
import side effect (`engine.js` imports it). It calls the public
`translate.googleapis.com/translate_a/single` endpoint (`client=gtx`) via
`GM_xmlhttpRequest`, splits overlong texts on paragraph boundaries so no
request exceeds `MAX_REQUEST_TEXT_LENGTH`, and joins chunk translations back.
429 responses are retried with backoff (`RETRY_DELAYS_MS`) before failing
with `SP-1110`; when the detected source language matches the target, the
original text is returned as-is (no `SP-1111` on pointless same-language
translations).

### `src/translation/targets/`

Registry: `registerTarget({ id, labelKey, selector, placeButton? })`,
`getTarget(id)`, `listTargets()`. The optional `placeButton(button,
element)` overrides below-mode button placement (used by `gameReviews`
to dock the button into the Yes/No/Funny/Award row). Registered scopes
(all in `all.js`, which the engine imports):

| id | Selector | Steam surface |
|----|----------|---------------|
| `gameDescription` | `#game_area_description, .game_description_snippet` | Store game page + listing snippets |
| `gameReviews` | `.review_text, .apphub_CardTextContent` + new React review UI (hashed body class, `div:has(> h1:first-child)` fallback) | Store/community reviews incl. the new client UI |
| `profileComments` | `.commentthread_comment_text` | Profiles, hubs, shared files |
| `gameNews` | `.eventspage_content_body, .eventText, .news_event_summary, .blotter_daily_rollup_line .blotter_content` | Event/news detail bodies, hub summaries |

### `src/translation/ui/controller.js` — `TranslatableNode`

One controller per translatable element. States: `idle → loading → done |
error`. It extracts clean original text (clone, strip own UI, collapse
whitespace), renders:

- **below** (default): translate button after the element; result box
  `.sp-translation` after the element.
- **replace**: translate button *inside* the element; original text is swapped
  for a `.sp-replaced-content` wrapper or plain text node, the button toggles
  back to the original.

`onConfigChange(settings)` reconciles display/trigger changes on live
controllers without destroying them; `destroy()` restores the original
content and removes all injected UI. After an async translation the node
checks `this.destroyed` before rendering — never repaint a torn-down node.

### `src/features/settings/` — panel

- `index.js`: registers the four tabs; `ensureSettingsButton()` waits for
  `#global_actions` and prefers a native entry in the account dropdown
  (`#account_dropdown .popup_body.popup_menu`, `popup_menu_item
  sp-menu-item`); without a dropdown it appends the compact `.sp-header-btn`
  fallback into `#global_actions`. `observeHeader()` moves the entry between
  placements as the dropdown appears/disappears; `updateSettingsButtonState()`
  lights the fallback dot when settings differ from defaults;
  `initSettingsFeature()` also registers the `GM_registerMenuCommand`
  (guarded with `typeof`). Opening the panel hides the Steam account
  dropdown first and stops event propagation.
- `panel.js`: tab registry (`registerTab`), single modal overlay
  `.sp-panel-overlay` built lazily (hidden attribute), panel header with
  product name + `v` version chip (from `GM_info.script.version`) +
  subtitle + × close, sticky footer with Reset / Cancel / Save.
  Tabs render into a mutable draft on open; nothing is persisted until
  Save (`saveSettings` + `configureLocale` + both bus events), Cancel /
  overlay click / `Escape` discards the draft. Changing the target
  language clears the translation cache on Save. Scroll lock pins `<body>`
  with scrollbar compensation (`sp-modal-open`) and swallows wheel/touch
  outside the panel body.
- `confirm.js`: promise-based `confirmDialog({ title, message,
  confirmLabel, cancelLabel, tone })` modal above the panel; used by the
  footer Reset (draft is refilled with defaults only after confirmation).
- `src/ui/toast.js`: `showToast({ type, icon, title, message, duration,
  key, onClick, actions })` notifications (dedup by `key`, max three on
  screen, hover-paused timers). Save shows a success toast; block
  translation failures show human-readable toasts (rate-limit warning,
  unknown provider, generic failure with a Retry action).
- `controls.js`: reusable Steam-styled controls — `createSection` (icon +
  caption), `createField` (label above the control), `createHint`,
  `createSwitchRow` (switch + ON/OFF pill), `createSwitchCell` (bare
  switch for grids), `createSelect`, `createSegmented` (sliding thumb +
  option icons), `createButton`.
- `tabs/general.js`: interface language select (auto +
  `SUPPORTED_LOCALES` native names) with hint; toasts section (master
  switch, screen-corner select, auto-hide seconds input); all applied
  on Save.
- `tabs/translation.js`: sectioned cards — engine (master switch with
  pill, provider select from `listProviders()`), behavior
  (trigger/display segmented, target-language select), scopes (checkbox
  grid from `listTargets()`). Controls mutate the draft only.
- `tabs/cache-pane.js`: translation-cache tab — storage meter, collapsible
  stored-translations list with per-entry removal, clear-cache action with
  status line; `paintCachePane()` repaints meter/list/tab badge.
- `tabs/about.js`: product hero with version chip, author card, repo link.

### `src/i18n/`

- `meta.js`: `SUPPORTED_LOCALES` (`en ru de es fr pt-BR zh-CN ja ko pl` —
  region-specific codes), `LOCALE_ALIASES` (e.g. `zh-cn`/`zh-sg`/`zh` →
  `zh-CN`, `pt-pt`/`pt` → `pt-BR`, base-language fallback),
  `LOCALE_NATIVE_NAMES`.
- `index.js`: `configureLocale(preference = 'auto')` matches
  `navigator.languages` through aliases with base-language fallback, else
  `'en'`; `getLocale()`; `t(key, vars)` falls back `active → en → key` and
  interpolates `{name}` placeholders.
- `locales/*.js`: one `export default { … }` map per locale (44 keys), all
  with **identical key order**; `locales/index.js` combines them into
  `TRANSLATIONS`.

### `src/utils/dom.js`

`el(tag, className, text)`, `append`, `debounce`, `isOwnUi(node)` (true for
anything inside `.sp-panel-overlay`, `.sp-settings-btn`, `.sp-translation`,
`.sp-translate-btn`), `resolveTargetLanguage(targetSetting)` (explicit value,
else Steam `<html lang>` first two letters, else `navigator.language`).

### `src/styles/tokens.css` + `src/styles/app.css`

`tokens.css` defines the `:root` design tokens (the whole `--sp-*` palette
from DESIGN.md); `app.css` is the injected stylesheet (settings entry,
panel, controls, translation UI), imported by `main.js` and applied as
`GM_addStyle` by the build. Every injected class carries the `sp-` prefix —
never add an unprefixed class to injected UI (exception: reusing a native
Steam class like `popup_menu_item` on elements we inject into Steam-owned
DOM, always alongside our own class). Component styles consume tokens via
`var(--sp-*)`; raw hexes belong in tokens.css only.

## Import direction

`utils ← core ← translation ← features`; `main.js` may import from anywhere
but must not own feature state. Rules that keep it acyclic:

- `core/settings.js` knows nothing about features or the bus — notifying is
  the caller's job.
- `features/settings` and `translation` never import each other; they talk
  through the bus and registries.
- Side-effect registrations (`targets/all.js`, `google-free.js`, tab
  registration in `features/settings/index.js`) run at import time — a module
  that must be registered is imported by the module that owns its lifecycle.

## End-to-end data flow (translation)

DOM mutation → observer filter (own UI dropped) → debounced `runScan()` →
`scanForTranslatable(root)` → new `TranslatableNode` per matched element →
auto: `translate()` immediately; manual: waits for the button →
`translateText(text)` → memory cache hit? return → queue
(`MAX_CONCURRENT_REQUESTS`) → provider `translate([text], { to })` →
`setCachedTranslation()` (debounced GM persist) → render below/replace.

## Steam DOM notes

- Steam re-renders headers, hubs and store listings constantly (SPA-like
  navigation). Never cache DOM references across scans; re-query from the
  scan root. The `WeakMap` of controllers is keyed by live elements, so
  replaced nodes are garbage-collected and re-attached on the next scan.
- Only translate elements that carry real content: keep selectors narrow
  (see the targets table). An over-broad selector attaches buttons to chrome
  text and floods the queue.
- Never let translated output feed back into a scan: own UI classes
  (`.sp-translation`, `.sp-translate-btn`, `.sp-replaced-content`) are
  excluded by `isOwnUi()`/the observer filter and stripped when extracting
  original text.
- Steam comment/review text may contain markup (BBCode, links, `<br>`).
  `replace` mode intentionally flattens it to plain translated text; `below`
  mode never touches the original.

## Settings

Stored under `sp_settings_v1` (only `getSettings()` reads,
`saveSettings()` writes). UI language: `'auto'` (browser) or one of the ten
`SUPPORTED_LOCALES` codes.

| Key | Default | Notes |
|-----|---------|-------|
| `language` | `'auto'` | Settings-panel UI language, not the translation target |
| `translation.enabled` | `true` | Master switch; disabling tears down all controllers |
| `translation.provider` | `'google-free'` | Id from the provider registry |
| `translation.trigger` | `'manual'` | `'auto'` translates as content appears; `'manual'` shows a per-block button |
| `translation.display` | `'below'` | `'below'` keeps the original; `'replace'` swaps text with a toggle back |
| `translation.targetLanguage` | `'auto'` | `'auto'` = Steam/browser language, else an ISO code from the select |
| `translation.showCached` | `true` | Render cached translations instantly, no button press |
| `translation.scopes.*` | all `true` | Per-target switches keyed by target id |
| `toasts.enabled` | `true` | Master switch for toast notifications |
| `toasts.position` | `'bottom-right'` | Toast corner: `bottom/top` × `right/left` |
| `toasts.duration` | `5000` | Auto-hide ms (`0` = sticky until dismissed) |

Add a new scope to four places together: a `registerTarget` module + import
in `targets/all.js`, a default entry in `DEFAULT_TRANSLATION.scopes`
(`core/constants.js`), and the `scope.<id>` label in **all ten** locales. A
setting missing from any of these is a bug.

## Localization

UI locales: `en`, `ru`, `de`, `es`, `fr`, `pt-BR`, `zh-CN`, `ja`, `ko`,
`pl`. `configureLocale('auto')` matches `navigator.languages` via
`LOCALE_ALIASES` with English fallback.

- Every new user-facing string is added to **all ten**
  `src/i18n/locales/*.js` files with identical key order — run a key diff
  over the files before finishing.
- Provider `labelKey`s and target `labelKey`s resolve through `t()`, so new
  providers/targets always carry a key in every locale.
- Localized `@name` / `@description` metadata in `vite.config.js` must stay
  aligned when the product description changes (generated into the userscript
  header).

## Design

All injected UI (settings panel, settings entry, translation buttons/boxes)
follows [DESIGN.md](DESIGN.md) — the Steam-native visual language: dark
`#1b2838` surfaces, Motiva Sans, `#66c0f4` accent, sp-prefixed classes,
colors from `src/styles/tokens.css`. Before touching any visible element,
read DESIGN.md; visual changes update DESIGN.md, `tokens.css` and the
stylesheet in the same change, then get rebuilt and eyeballed on a live
Steam page.

## Language and comments

- **Write in English.** Code, comments, docs, commit messages and file
  contents are English. The only exception is translated user-facing strings:
  the values in `src/i18n/locales/*.js` and the localized metadata blocks in
  `vite.config.js`. Non-English text anywhere else is a defect.
- **Comment only what is not obvious.** A comment must explain a non-obvious
  *why*, a contract, or a fragile invariant — never restate what the code
  does. In particular:
  - No section-divider or decorative comments (e.g. `/* Switch */` banners in
    CSS) — the code and class names already say that.
  - No edit annotations (`// fix`, `// added here`, initials/dates) and no
    commented-out code.
  - Do not leave both a doc block and a comment saying the same thing; one
    short JSDoc per exported symbol is enough.
  - When changing code, delete comments the change made stale instead of
    rewriting them to fit.

## Versioning

Update the project version with every user-visible change — never leave a
change unversioned. Follow Semantic Versioning:

- **Major** (`X.0.0`) for incompatible behavior, storage migrations, or
  breaking changes that require user action.
- **Minor** (`0.X.0`) for new backward-compatible features or substantial
  enhancements.
- **Patch** (`0.0.X`) for bug fixes, styling adjustments, documentation,
  and other backward-compatible small changes.

Keep the version synchronized in `package.json` and `package-lock.json`
(edit `package.json` and run `npm install` to refresh the lockfile).
`CHANGELOG.md` versions with it: record every user-visible change under
`[Unreleased]`; when bumping, move those bullets into a new
`## [X.Y.Z] - YYYY-MM-DD` section (with a matching link reference at the
bottom) and leave `[Unreleased]` empty. The userscript metadata is generated
from `package.json`; run `npm run build` after every bump so the root
`.user.js` / `.meta.js` headers carry the new version.

## Build and verification

Requires Node.js 22.

```bash
npm install
npm run dev                # vite-plugin-monkey dev server (dev: prefix)
npm run build              # vite build + copy dist/ → root artifacts
npm run verify:artifacts   # fail if dist/ and root artifacts differ
npm run ci                 # build + verify (CI gate, also in GitHub Actions)
```

Build facts agents need to know:

- `vite.config.js` declares `entry: src/main.js`, the full `==UserScript==`
  block (names/descriptions in all locales, `match`, `connect`,
  `run-at: document-idle`, `noframes`), `server.prefix: 'dev:'`, and
  `build.fileName: steam-plus.user.js` with `metaFileName: true`. The granted
  GM APIs are declared here — do not expand `@connect` / `@match` / grants
  "just in case".
- `scripts/copy-dist.mjs` copies `ARTIFACT_FILES` from `dist/` to root;
  `verify-artifacts.mjs` enforces byte identity (CI fails on drift).
- `dist/` and `node_modules/` are gitignored; `package-lock.json` is
  committed.

After every source, style, metadata, or version change, run `npm run build`
so the root install artifacts stay synchronized. Before finishing, run
`npm run ci` and check diagnostics for edited files.

## Debugging

- GM storage keys: `sp_settings_v1` and `sp_translation_cache_v1` are
  inspectable in the userscript-manager storage editor; delete them to test
  cold start and defaults.
- Test translation without waiting: set the target language to a non-matching
  one (e.g. `fr` on an English page) and trigger a block — the `.sp-translation`
  box or replaced text appears instantly. Repeat visits hit the cache (no
  network) — verify with the manager's network/log view.
- A controller that keeps its button after Steam re-renders means the old
  node was reused and `controllers` missed it — re-check the scan exclusion
  and element identity, never add a second observer.
- Locale sanity: diff the key lists of all ten locale files; `t()` falls back
  to `en`, which masks a missing key in one locale — verify, don't eyeball.

## Local testing

- **Violentmonkey:** `npm run build`, install the local root `.user.js` +
  enable Track local file; rebuild + reload Steam after edits.
- **Tampermonkey:** reinstall from file/URL, or temporary local server URLs
  (do not commit them).

## Do not

- Hand-edit `steam-plus.user.js` or `steam-plus.meta.js`.
- Commit `node_modules/`, `dist/`, or development-only update URLs.
- Cache translation failures as valid results, or bypass the queue/request
  limits.
- Add non-English code/comments/docs, decorative comments, or stale comments.
- Add a second MutationObserver / scan loop; extend the existing pipeline.
- Break Steam navigation, header menus, or responsive layout.
- Imply affiliation with Valve or Steam in docs or UI copy.
