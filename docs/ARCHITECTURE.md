# Architecture

## Repository layout

```text
src/
├── main.js                  # Entry: locale init, MutationObserver scan loop
├── core/
│   ├── constants.js         # DEFAULT_SETTINGS, storage keys, limits
│   ├── settings.js          # load/save + normalization (single source of truth)
│   └── bus.js               # minimal pub/sub (settings:translation, settings:language)
├── i18n/
│   ├── meta.js              # SUPPORTED_LOCALES, aliases, native names
│   ├── index.js             # configureLocale(), t()
│   └── locales/             # one file per locale, registry in locales/index.js
├── translation/
│   ├── engine.js            # orchestrator: scan → controllers → queue → cache
│   ├── providers/
│   │   ├── index.js         # provider registry (registerProvider)
│   │   └── google-free.js   # free Google endpoint (client=gtx, no key)
│   ├── targets/
│   │   ├── index.js         # target registry (registerTarget)
│   │   └── *.js             # selectors per content scope
│   ├── cache.js             # GM storage cache with TTL, LRU trim, debounce
│   └── ui/controller.js     # TranslatableNode: button + below/replace rendering
├── features/settings/
│   ├── index.js             # settings entry: account-menu item + header fallback
│   ├── panel.js             # tabbed panel shell (registerTab)
│   ├── controls.js          # row / switch / select / segmented / checkbox
│   └── tabs/                # general.js, translation.js, gamepage.js (sectioned cards)
├── features/gamepage/
│   ├── blocks.js            # hideable store game-page blocks + CSS builder
│   └── index.js             # CSS-driven hiding, URL watcher, bus listener
├── features/prices/
│   ├── regions.js           # compared store regions
│   ├── fx.js                # live exchange rates (providers + TTL cache)
│   ├── api.js               # same-origin appdetails fetching (bounded)
│   ├── cache.js             # GM-backed price cache (1h TTL)
│   ├── ui.js                # comparison block renderer
│   └── index.js             # mount/teardown, anchors, bus listener
├── features/dlc/
│   ├── api.js               # add-on ids/details + store-page prefill + owned apps
│   ├── cache.js             # GM-backed add-on/ownership cache
│   ├── ui.js                # add-on block renderer (rows, ownership, collapse)
│   └── index.js             # mount/teardown, lazy detail loading, bus listener
├── styles/
│   ├── tokens.css           # :root design tokens (see DESIGN.md)
│   └── app.css              # injected styles (sp- prefix)
├── ui/
│   ├── toast.js             # toast notifications
│   └── viewer.js            # fullscreen image viewer (zoom, pan, rotate, gallery)
└── utils/
    ├── dom.js               # el(), debounce(), resolveTargetLanguage()
    ├── gameAnchors.js       # shared store game-page block anchors
    └── scrollLock.js        # counted page scroll lock for modal overlays
```

## Data flow (translation)

```
MutationObserver (debounced) → scanForTranslatable(root)
  → for each enabled target (settings.translation.scopes)
      → root.querySelectorAll(target.selector)
      → new TranslatableNode(element).attach(settings, translateText)
          → auto: translate immediately; manual: wait for button click
translateText(text)
  → cache (provider|to|text) → hit? return
  → queue (max 3 concurrent) → provider.translate → cache → render
```

## Extensibility

- **New provider**: `registerProvider({ id, labelKey, translate(texts, {to}) })`
  in `src/translation/providers/` — appears in the settings select automatically.
- **New content scope**: `registerTarget({ id, labelKey, selector })` in
  `src/translation/targets/` plus a locale key `scope.<id>` — the settings UI
  and engine pick it up automatically.
- **New settings tab**: `registerTab({ id, titleKey, render() })`.
- **New prices region**: add `{ cc, name, currency }` to `PRICE_REGIONS`
  in `src/features/prices/regions.js` — the settings grid picks it up
  automatically (plus an FX rate in the same file if it uses a new
  currency).

## Data flow (prices)

```
store navigation / settings:prices → applyPricesSettings()
  → mount(appid): anchor by settings.prices.position (with fallbacks)
  → loadAppPrices(appid, regions): home price + up to N regions
      (max 3 concurrent, 1h GM cache, per-region failure isolation)
  → paintPrices(): home row + region rows (sorted, cheapest marked,
      savings vs home via live FX, optional converted display)
      — free games hide the block
```

## Data flow (add-on content)

```
store navigation / settings:dlc → applyDlcSettings()
  → mount(appid): anchor by settings.dlc.position (shared gameAnchors helper)
  → fetchGameAddons(appid): appdetails dlc ids (24h GM cache)
  → fetchOwnedApps(): dynamicstore/userdata rgOwnedApps (30min GM cache,
      signed-in only — signed out the rows drop the ownership marks)
  → readAddonSection(): names, prices and capsule images already rendered by
      the store page
  → paintDlc(): rows (not-owned first, thumbnail + release date), header
      counter, collapsed by default
  → first expand → loadAddonDetails(missing ids, max 3 concurrent,
      filters=basic,release_date,price_overview, page store country)
      patches each row in place; every detail cached for 24h
  → click a row image → openViewer(): the block's gallery, largest image first
      (ui/viewer.js: fit, zoom/pan/rotate, thumbnails, arrows, Esc)
```

## Conventions

- Every element created by the script uses the `sp-` CSS prefix and is
  excluded from scans.
- All injected UI follows [DESIGN.md](../DESIGN.md); colors come from
  `styles/tokens.css` (`var(--sp-*)`).
- Settings are normalized on load/save; features subscribe via the bus
  (`settings:translation`, `settings:gamepage`, `settings:prices`,
  `settings:links`, `settings:dlc`, `settings:language`).
