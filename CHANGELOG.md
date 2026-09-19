# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.27.0] - 2026-09-19

### Added

- News article translation: store news pages (`/news/app/<id>/view/<gid>`) get a single Translate button above the headline that translates the whole article at once (headline + body), like guides; hub summaries keep their per-card buttons through the News and events scope

## [0.26.0] - 2026-09-17

### Added

- Guide translation: community guide pages (`sharedfiles/filedetails`) get a single Translate button above the guide that translates the whole content at once (title, top description, every section); guide comments were already covered by the Profile comments scope

[0.27.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.27.0
[0.26.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.26.0

[0.25.1]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.25.1

## [0.25.0] - 2026-09-15

### Added

- Backup settings page: export all settings to a JSON file (or copy to clipboard) and import them back from a file, with envelope validation, overwrite confirmation, and live refresh of every feature

[0.25.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.25.0

## [0.24.2] - 2026-09-15

### Changed

- Regional prices block starts collapsed by default to save space; expand it with the header chevron or turn the default off in Prices settings

[0.24.2]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.24.2

## [0.24.1] - 2026-09-15

### Changed

- Game page settings use a page-blocks grid icon instead of the crossed-out eye, matching what the tab actually manages

[0.24.1]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.24.1

## [0.24.0] - 2026-09-15

### Added

- Game page settings gain an Early Access block mode (Full / Compact / Hidden): Compact slims `#earlyAccessHeader` down to its title by hiding the developer Q&A and subtitle text, Hidden removes the block entirely

[0.24.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.24.0

## [0.23.0] - 2026-09-15

### Added

- Region bypass adds a native Steam button to the `.apphub_OtherSiteInfo` panel on blocked store pages: it runs the same anonymous guest fetch as the offer card, and stays on guest-loaded pages for re-fetch (label switches to Reload) until navigation away

### Fixed

- Region notice banner rendered empty: the badge, body and Reload action were built but never appended — all three are now mounted, so the banner shows its title and working Reload button
- Region panel button now also mounts when Steam renders `.apphub_OtherSiteInfo` after the initial check: every content scan re-syncs it, so late SPA renders no longer miss the button

[0.23.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.23.0

## [0.22.8] - 2026-09-10

### Changed

- Search result platform icons move to their own line under the date and review summary

[0.22.8]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.22.8

## [0.22.7] - 2026-09-10

### Fixed

- Search enrichment failed with “getSteamStoreLanguage is not defined” (surfaced by the new `SP-1416` diagnostic): the import was lost in an edit — restored, and a repeat scope audit confirms no other dangling references

[0.22.7]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.22.7

## [0.22.6] - 2026-09-10

### Fixed

- Search failures now always log a coded `SP-1416` console line with the term attached, so silent enrichment drops are diagnosable instead of invisible

[0.22.6]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.22.6

## [0.22.5] - 2026-09-10

### Fixed

- Region search always failed with “Cannot read properties of undefined (reading 'slice')”: the suggest parser lost its `return`, so every lookup ended in the error box — restored and covered with a live-data smoke test (real suggest and search-responses responses parse, merge and enrich correctly)

[0.22.5]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.22.5

## [0.22.4] - 2026-09-10

### Changed

- Search rows drop the uniform “Guest only” badge for native Steam platform icons next to date and review summary — and the extra home-region request goes away with it

[0.22.4]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.22.4

## [0.22.3] - 2026-09-10

### Changed

- Guest country picker moves out of the search overlay into Region settings: the overlay reads the configured country (Auto falls back to US) and keeps only the rows selector next to its input

[0.22.3]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.22.3

## [0.22.2] - 2026-09-10

### Fixed

- Region search settings tab crashed on open (`SEARCH_ROW_OPTIONS is not defined`): the constants import was lost in an edit — restored, and a scope-aware audit of every source file confirmed the remaining references resolve

[0.22.2]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.22.2

## [0.22.1] - 2026-09-10

### Fixed

- Search overlay opened without its input row: moving the rows selector dropped the box attachment and the controls container — both restored, the row (field plus inline rows selector) renders again

[0.22.1]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.22.1

## [0.22.0] - 2026-09-10

### Changed

- Search overlay rows selector moves inline into the search row (no label, `aria-label` kept); the settings block “Search suggestions” becomes “Search” with matching renames everywhere; store country is now a 24-region select (Auto keeps your country) instead of a free-text field

[0.22.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.22.0

## [0.21.1] - 2026-09-10

### Changed

- Region search overlay loses the Plus / Steam switch: it always searches the guest country (your region is still fetched behind the scenes for the “Guest only” badges), leaving country and row-count controls

[0.21.1]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.21.1

## [0.21.0] - 2026-09-10

### Added

- Search results now show game details: one `search/results` call per typed term fills in release date, review summary and the full price picture (struck original, bold final, green discount badge, Free label) — rows render instantly from suggestions and enrich in place, failures keep the basic rows

[0.21.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.21.0

## [0.20.5] - 2026-09-10

### Added

- Suggestion row choices grow from 3 / 6 / 10 to 3 / 5 / 8 / 10 / 15 / 20, in settings and directly in the search overlay

[0.20.5]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.20.5

## [0.20.4] - 2026-09-10

### Added

- Region search overlay opens with a fade-and-rise animation, offers a results-count selector (3 / 6 / 10) right in its controls row, and pins the page behind like the settings panel (scrollbar compensation, wheel/touch swallowed outside the results) — all reduced-motion safe

[0.20.4]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.20.4

## [0.20.3] - 2026-09-10

### Fixed

- Region settings tab crashed on open (`isRegionBlockedPage is not defined`): the `detect.js` import was lost in an edit — restored after a full identifier audit of every source file, which also confirmed no other dangling references remain

[0.20.3]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.20.3

## [0.20.2] - 2026-09-10

### Fixed

- Region search crashed on open (`onDocumentKeyDown is not defined`): the Escape handler was lost in an edit — restored and audited every search, settings and boot module for dangling references
- Translation engine never started: `initTranslationEngine` was imported but never called, so the cache never loaded and settings changes never reached live controllers — wired into document boot

[0.20.2]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.20.2

## [0.20.1] - 2026-09-10

### Fixed

- Region search crashed on input (`getRegion is not defined`): the import was lost in an edit, and the suggest parser also missed its results array — both restored, plus the header replacement now skips complex filter forms (advanced search keeps working natively)

[0.20.1]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.20.1

## [0.20.0] - 2026-09-09

### Added

- Region search now replaces the native store search box: the Steam form is hidden and ours stands in its slot (same place, native placeholder), typing or `Enter` opens the “Search all regions” overlay with the text carried over — disable the switch to get the Steam box back untouched

### Fixed

- Search suggestions bypassed the proxy gateway: guest requests went direct while page bypasses used it, so proxy users always saw their own region — suggest traffic now routes through the same gateway

[0.20.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.20.0

## [0.19.1] - 2026-09-09

### Changed

- Region search no longer injects a button into the store header: the overlay opens via the `/` hotkey (outside text fields) or a new “Open region search” button in the Region settings tab — no duplicate search controls next to the native box in either header variant

### Fixed

- Guest-country picker showed the wrong selection when the stored country was outside the 24 preset regions — unknown codes now get a matching option instead

[0.19.1]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.19.1

## [0.19.0] - 2026-09-09

### Added

- Region search is now a full overlay modal instead of an auto-appearing panel: a magnifier button next to the store search box (either header variant) opens “Search all regions” with its own input, a Plus / Steam source switch for instant toggling between the guest country and your own, a 24-region guest-country picker (session-only, defaults to the region country or US), and per-row badges marking games missing from your region — loading, error-with-retry and empty states included, `Enter` jumps to the full Steam results page

[0.19.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.19.0

## [0.18.3] - 2026-09-09

### Fixed

- Store search box rendered late by Steam scripts never got the suggestion hook: attachment ran only at boot and on navigation — it now also runs on every scan root, so late-hydrated headers are picked up automatically
- Scan loop never processed dynamic content: the observer filtered added nodes but never queued them, so rescans only ran once at boot — added nodes are scan roots again, as documented (this also revives translation of Steam re-renders)

[0.18.3]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.18.3

## [0.18.2] - 2026-09-09

### Fixed

- Guest search suggestions compared against too narrow a scope on the legacy search box, so native results could duplicate in the panel — the scope now climbs to the nearest stable search/header ancestor (no hashed classes)

[0.18.2]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.18.2

## [0.18.1] - 2026-09-09

### Added

- Region tab gains a Search suggestions section: master switch and row count (3 / 6 / 10) for the guest-region panel under the store search box

### Fixed

- Store country override never persisted: `normalizeRegion` computed the validated code but dropped it from the saved state, so guest requests (page bypass and search suggestions) always fell back to your own country — the code is now stored, and the search panel only appears when the guest result set actually differs from yours
- Store search suggestions never rendered: the input handler called a guard that was never defined, throwing on every keystroke — the guard exists now and also honors the new switch

[0.18.1]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.18.1

## [0.18.0] - 2026-09-09

### Added

- Region search: the store search box now also finds games blocked in your region — while typing, guest-region suggestions are fetched anonymously (same country/proxy settings as the bypass) and shown in a Steam-styled panel under the search box with capsule art, name and guest price; only games the native dropdown misses are listed, opening one loads it through the region bypass, labelled in all 10 UI locales

[0.18.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.18.0

## [0.17.1] - 2026-09-09

### Fixed

- “Events & announcements” game-page block hid only the legacy markup: the new store React block (`data-featuretarget="events-row"` / `.early_access_announcements`) stayed visible — both selectors are now covered, so the toggle hides the whole block including its header

[0.17.1]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.17.1

## [0.17.0] - 2026-09-09

### Added

- External links on game pages: a new Links settings tab with user-defined quick links to other stores and databases (SteamDB, ProtonDB and HowLongToBeat by default) — browser-style URL templates with `{name}` / `{appid}` placeholders, custom favicons with a letter fallback, per-link switches, reorder controls, block position and open-in-new-tab toggles, labelled in all 10 UI locales
- Game page hiding gains two blocks: the sale-event banner under the game title (“This game is part of a sale event”) and the edition/bundle description blocks (e.g. Digital Deluxe Edition contents) above About This Game — both opt-in, labelled in all 10 UI locales
- Region-bypassed game pages restore the logged-in queue actions when you are signed in: the anonymous “Sign in to add this item…” prompt is replaced with working Add to wishlist / Follow / Ignore controls in Steam’s native markup — wishlist and ignore states resolve from your account data, actions post through your live session with error toasts, labelled in all 10 UI locales

### Fixed

- Collapse chevron in the regional prices header was too small to read — enlarged to match the refresh button

[0.17.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.17.0

## [0.16.2] - 2026-09-09

### Fixed

- Region-bypassed pages kept the error document title (“Site Error”): the transplant now syncs `document.title` from the guest page

[0.16.2]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.16.2

## [0.14.1] - 2026-09-09

### Fixed

- Transplanted pages rendered broken: the live error document lacks the game-page stylesheets (`game.css` et al), script bundles (`game.js`, highlight player, reviews, tagging) and body classes (`app`, `game_bg`) — the transplant now syncs missing page CSS, loads missing bundles with a bounded wait, and unions guest body classes before replaying init scripts, so blocks land in their native layout

## [0.14.0] - 2026-09-09

### Changed

- Region bypass no longer replaces the whole document: guest content is transplanted into the live page, so the logged-in site header (account, wallet, notifications), styles and scripts survive — guest inline inits for reviews, sysreq tabs, tags and catalog data replay with session/header scripts filtered out, store React islands hydrate via the running runtime, and the full-document rewrite stays as an automatic fallback when there is nothing to transplant into

## [0.13.1] - 2026-09-09

### Fixed

- Bypassed pages lost all script styles: `document.open/write/close` wiped the one-time `GM_addStyle` stylesheet, so the price comparison block, translate buttons and banner rendered without CSS (overlapping rows, raw boxes, plain buttons) — our `<style>` nodes are now rescued before the rewrite and re-attached to the fresh document

## [0.13.0] - 2026-09-09

### Removed

- Region bypass guest-page cache is gone: every bypass fetches fresh HTML instead of reusing stored pages — the Guest page cache section (lifetime, entry limit, status, clear button) leaves the Region settings tab with its 11 strings in all 10 UI locales, and previously stored guest pages are wiped from userscript storage on first run

## [0.12.0] - 2026-09-09

### Added

- Region bypass notice banner is now hidden by default and opt-in: a new “Show notice banner” switch in the Region settings tab (in all 10 UI locales) controls whether bypassed pages show the guest-fetch notice — disabling it also removes an already-inserted banner on save

## [0.11.5] - 2026-09-08

### Fixed

- Region bypass media now loads on the first open: the bypass replaces the error document with the guest HTML (`document.open/write/close`) instead of surgically injecting nodes, so Steam scripts boot through the natural parser path — execution order, jQuery ready handlers, and the store React islands (video/screenshot carousel, recommendations) hydrate exactly like a real page load; features re-boot into the fresh document and the notice banner is re-inserted after load

## [0.11.4] - 2026-09-08

### Fixed

- Region bypass left videos and screenshots unrendered on first load: the guest script backfill skipped Steam's `applications/store` bundles, so the React carousel (`gamehighlight-desktopcarousel`) and other islands never hydrated — the store chunks (manifest, libraries, main) now load in document order, and stylesheet/script waits are time-bounded and concurrent so a stalled CDN asset can no longer block page boot

## [0.11.3] - 2026-09-08

### Fixed

- Region bypass crash (`buildTargetUrl is not defined`): the guest-request import was lost in `bypass.js`, so blocked pages failed on every run — restored, and ran an `no-undef` audit over all sources that also caught and fixed a broken `catch` clause in the same file

## [0.11.2] - 2026-09-08

### Fixed

- Startup crash (`persistPriceCacheNow is not defined`): the price-cache flush import was lost in `main.js`, aborting `init()` before the scan loop and observer attached — the import is restored, so the script boots again

## [0.11.1] - 2026-09-08

### Fixed

- Content features now apply to region-bypassed pages: a successful guest inject emits `region:injected`, and translation (rescan), regional prices (remount into the fresh anchors) and game-page hiding (re-apply) all refresh on it — previously the bypass left the page without translate buttons or the prices block because the URL never changes and the injected shell was excluded from scans

## [0.11.0] - 2026-09-08

### Added

- Region bypass for store pages blocked with “unavailable in your region” (`/app/`, `/bundle/`, `/sub/`): anonymous guest fetch without account cookies (Steam language, age-gate and optional `cc` country cookies, `Accept-Language`) with direct injection of the real store layout, missing app stylesheets/scripts backfill, and a Steam-native notice banner; auto mode replaces the error page at once, manual mode shows an offer card first, failures show a status card with Retry
- Region settings tab: master switch, auto/manual mode, optional two-letter store country override, guest page cache (configurable lifetime up to 7 days, entry limit, status line, clear button, Reload action on blocked pages), and an HTTP proxy gateway section (on/off, host, port, Basic auth, gateway/path/query URL modes) for IP-based locks

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
[0.14.1]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.14.1
[0.14.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.14.0
[0.13.1]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.13.1
[0.13.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.13.0
[0.12.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.12.0
[0.11.5]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.11.5
[0.11.4]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.11.4
- Cache tab in the settings panel: translation-cache storage meter, collapsible stored-translations list with per-entry removal, and a clear-cache action with a status line
- About tab in the settings panel: product hero with version chip, author card, and repository link

### Changed
[0.11.3]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.11.3
[0.11.2]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.11.2
[0.11.1]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.11.1
- Settings are now applied via an explicit Save button (edits collect in a draft; Cancel, overlay click, or Escape discards them) instead of instant persistence on every control
- Header fallback button and account-dropdown entry highlight while the panel is open; opening the panel hides the Steam account dropdown

## [0.1.1] - 2026-09-07
[0.11.1]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.11.1
[0.11.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.11.0

- DESIGN.md: Steam-native visual rules for all injected UI, referenced from AGENTS.md and CLAUDE.md
[0.11.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.11.0
[0.10.0]: https://github.com/NemoKing1210/steam-plus/releases/tag/v0.10.0

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
