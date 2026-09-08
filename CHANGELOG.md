# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.10.0] - 2026-09-08

### Changed

- Settings panel navigation redesigned: the header tab strip is replaced by a home screen with a vertical list of page buttons (icon, title, description, chevron) that open dedicated settings pages with a back crumb; Escape returns home before closing

## [0.9.2] - 2026-09-08

### Changed

- Regional prices block moved to the top of the purchase area (above the buy options instead of below); the position option is renamed accordingly

## [0.9.1] - 2026-09-08

### Added

- Exchange rates cache settings: configurable cache lifetime (1 hour – 7 days), live cached-rates status with provider and date, and a clear-cache button in the Conversion section — rates load once and are reused instead of requested on every page

## [0.9.0] - 2026-09-08

### Changed

- Regional prices block rebuilt as a real table (region · price · discount · savings) with clickable sortable headers — click sorts, click again flips the direction; the own-price row stays pinned on top, discount/savings columns hide when empty

## [0.8.0] - 2026-09-08

### Added

- Currency conversion for regional prices: every price converts into your store currency automatically (or any of 21 chosen currencies, or off) via live exchange rates (ExchangeRate-API with jsDelivr fallback, 24-hour cache, source stamped under the block); ranking, cheapest highlight and savings now use live rates instead of approximate ones

## [0.7.0] - 2026-09-08

### Added

- Regional prices on store game pages: compare the game across 24 Steam store regions with your own price pinned first, cheapest-region highlight, and savings vs your price; new Prices settings tab (master + auto-load switches, region picker, placement above buy options / sidebar / below description, row ordering, per-element display toggles); Steam-native block with Steam-formatted prices, 1-hour cache and refresh; hidden automatically for free games

## [0.6.0] - 2026-09-08

### Added

- Game page feature: hide key blocks on Steam store game pages (`/app/<id>`), with a master switch and per-block toggles (screenshots & trailers, buy options & bundles, About This Game, DLC, system requirements, user reviews, curators, events & announcements, details sidebar, franchise & recommendations) in a new Game page settings tab; CSS-driven hiding survives Steam re-renders and navigation, nothing hidden by default

### Fixed

- Toast notification preferences (position, auto-hide) are now persisted on Save instead of silently discarded

## [0.5.3] - 2026-09-08

### Added

- Steam favicon (`@icon`) in the userscript metadata

## [0.5.2] - 2026-09-08

### Changed

- Settings menu item renamed to the "Settings Steam Plus" wording across all ten UI locales

## [0.5.1] - 2026-09-07

### Fixed

- Translate-button loading spinner renders as a true circle instead of an oval (inline box ignored its dimensions)

## [0.5.0] - 2026-09-07

### Added

- Structure-preserving translation rendering: content is split into blocks (paragraphs, headings, list items) translated separately while links, images, embeds, line breaks, emoji and code keep their nodes, so translations mirror the original layout instead of a flat text blob

### Changed

- Below mode renders a structural mirror of the source (same headings, link targets, lists and media, `lang` set to the target language); replace mode swaps each block in place and toggling back restores the exact original DOM from a snapshot
- Switching the display mode re-renders the stored translation instead of resetting the block; changing the provider or target language resets live translated blocks so stale text never lingers
- Long provider requests split on paragraph, then sentence boundaries without breaking words or structure placeholders
- Cache tab entry list hides internal placeholder tokens

### Fixed

- Toggling replace mode back no longer destroys the original markup (images and links were lost permanently)
- Multi-paragraph texts no longer glued together without separators when split across several provider requests

## [0.4.1] - 2026-09-08

### Changed

- Translate buttons now lead the block they control (above the text, or at the start of the review actions row) instead of trailing it

## [0.4.0] - 2026-09-07

### Added

- Review translate button docks into the Yes/No/Funny/Award actions row (per-target `placeButton` placement hook)
- Viewport-aware translation UI: buttons appear only near the viewport and `auto` mode translates only visible content (no wasted requests)
- `showCached` setting (on by default): cached translations render instantly without pressing the button

## [0.3.4] - 2026-09-07

### Fixed

- Translate buttons now appear on reviews in the new Steam community UI (hashed classes + review-title anchor)

## [0.3.3] - 2026-09-07

### Changed

- Changing the translation target language clears the translation cache on Save (cached texts belong to the previous language)

## [0.3.2] - 2026-09-07

### Fixed

- Replace-mode translate button starts on its own line below the text instead of sticking to it

## [0.3.1] - 2026-09-07

### Changed

- Translate buttons: globe icon plus a ring spinner with a short loading label instead of bare ellipsis; compact inline variant for replace mode

## [0.3.0] - 2026-09-07

### Added

- Toast notifications (`src/ui/toast.js`): types, icons, whole-toast click and button actions, dedup keys, hover-paused timers with progress bar; success toast on Save, human-readable failure toasts (rate-limit, unknown provider, retryable errors with a Retry action)
- Toast preferences in General settings: master switch, screen corner, auto-hide seconds (all honored by `showToast`)
- Reusable confirm dialog (promise-based, danger/primary tones) used by the footer Reset
- Diagnostics module (`src/core/debug.js`): stable `SP-####` error codes, styled console errors with provider/scope/language context, verbose mode via `sp_debug`; translation, cache, bus and settings failures all report through it

### Changed

- Tab switching animation: sliding accent indicator, direction-aware pane slide, and staggered fade-in of sections
- Settings toggles: every checkbox replaced with a Steam switch (scopes as a switch grid); Behavior segmented controls rebuilt with icons and a sliding glow thumb
- Fixed switch-knob vertical centering; Behavior thumb positions itself as soon as its tab opens; tab strip no longer shows a vertical scrollbar
- Target language select shows full native language names instead of ISO codes
- Translation hardening: automatic retry with backoff on Google 429 rate-limits; same-language answers pass the original text through instead of failing

## [0.2.0] - 2026-09-07

### Added

- Cache tab in the settings panel: translation-cache storage meter, collapsible stored-translations list with per-entry removal, and a clear-cache action with a status line
- About tab in the settings panel: product hero with version chip, author card, and repository link

### Changed

- Settings panel rebuilt in the steam-gamestatus style: sticky header with subtitle, sticky footer with Reset / Cancel / Save, tab fill badge, section icons, field-above-control layout, and master switches with ON/OFF pills
- Settings are now applied via an explicit Save button (edits collect in a draft; Cancel, overlay click, or Escape discards them) instead of instant persistence on every control
- Header fallback button and account-dropdown entry highlight while the panel is open; opening the panel hides the Steam account dropdown

## [0.1.1] - 2026-09-07

### Added

- DESIGN.md: Steam-native visual rules for all injected UI, referenced from AGENTS.md and CLAUDE.md
- `src/styles/tokens.css`: shared `--sp-*` design palette consumed by the injected stylesheet

### Changed

- Settings entry: native Steam account-dropdown menu item when signed in, compact Steam-blue header button (with a state dot) as the fallback on logged-out pages
- Settings panel restyled to Steam chrome: version chip and × close in the header, uppercase tab strip, sectioned content cards, Steam-style switches, selects, segmented controls and buttons; translation settings grouped into Engine / Behavior / Scopes sections

[0.10.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.10.0
[0.9.2]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.9.2
[0.9.1]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.9.1
[0.9.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.9.0
[0.8.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.8.0
[0.7.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.7.0
[0.6.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.6.0
[0.5.3]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.5.3
[0.5.2]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.5.2
[0.5.1]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.5.1
[0.5.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.5.0
[0.4.1]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.4.1
[0.4.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.4.0
[0.3.4]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.3.4
[0.3.3]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.3.3
[0.3.2]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.3.2
[0.3.1]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.3.1
[0.3.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.3.0
[0.2.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.2.0
[0.1.1]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.1.1
[0.1.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.1.0

### Added

- Settings panel in the Steam header (and userscript-manager menu) with tabs, Steam-like dark UI, and 10 UI locales (en, ru, de, es, fr, pt-BR, zh-CN, ja, ko, pl)
- Translation feature: free Google provider by default (no key, extensible provider registry), global on/off switch, auto or manual trigger, translation below the original or text replacement with original toggle, target language (auto = Steam/browser), and content scopes (game descriptions, reviews, profile comments, news) with per-scope toggles
- Translation cache with TTL, LRU trim, and a concurrency-limited request queue

[0.1.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.1.0
