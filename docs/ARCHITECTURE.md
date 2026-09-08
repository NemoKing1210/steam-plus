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
│   └── tabs/                # general.js, translation.js (sectioned cards)
├── styles/
│   ├── tokens.css           # :root design tokens (see DESIGN.md)
│   └── app.css              # injected styles (sp- prefix)
└── utils/dom.js             # el(), debounce(), resolveTargetLanguage()
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

## Conventions

- Every element created by the script uses the `sp-` CSS prefix and is
  excluded from scans.
- All injected UI follows [DESIGN.md](../DESIGN.md); colors come from
  `styles/tokens.css` (`var(--sp-*)`).
- Settings are normalized on load/save; features subscribe via the bus
  (`settings:translation`, `settings:language`).
