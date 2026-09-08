# Steam Plus

[![CI](https://github.com/NemoKing1210/steam-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/steam-plus/actions/workflows/ci.yml)
[![Install userscript](https://img.shields.io/badge/Install-userscript-102436?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/steam-plus.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://github.com/NemoKing1210/steam-plus/blob/main/LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-green?style=for-the-badge)](https://github.com/NemoKing1210/steam-plus/blob/main/CHANGELOG.md)

A userscript that improves the Steam Store and Steam Community with a full
settings panel and content translation — game descriptions, reviews, profile
comments, and news — right on the page.

Compatible with [Tampermonkey](https://www.tampermonkey.net/),
[Violentmonkey](https://violentmonkey.github.io/),
[Greasemonkey](https://www.greasespot.net/),
[ScriptCat](https://scriptcat.org/), and other managers that support the
`// ==UserScript==` metadata block.

> **Status:** early (`0.1.0`). Settings panel (General · Translation) +
> content translation through the free Google endpoint (no API key). More
> Steam improvements planned.

> The script's `@updateURL` / `@downloadURL` point at GitHub `main` — the raw
> install URL below is always the newest build.

## Quick install

1. Install a userscript manager ([Tampermonkey](https://www.tampermonkey.net/),
   [Violentmonkey](https://violentmonkey.github.io/), or
   [ScriptCat](https://scriptcat.org/) recommended).
2. Install from GitHub (raw URL below).

**Install URL (GitHub — newest):**

```
https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/steam-plus.user.js
```

[![Install](https://img.shields.io/badge/Install-GitHub_raw-102436?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/steam-plus.user.js)

### Install from URL (dashboard)

| Manager | Path |
|---------|------|
| Tampermonkey | Dashboard → **Utilities** → **Install from URL** |
| Violentmonkey | Dashboard → **+** → **Install from URL** |
| Greasemonkey | Add-on menu → **New User Script** → paste the raw URL |
| ScriptCat | Install the [extension](https://scriptcat.org/), then **Install from URL** with the GitHub raw URL |

Paste the [GitHub install URL](#quick-install) above when installing from a
manager dashboard.

### Manual install

1. Open the built [`steam-plus.user.js`](https://github.com/NemoKing1210/steam-plus/blob/main/steam-plus.user.js) in this repository (or run `npm run build` after cloning).
2. Copy the entire file contents.
3. In your userscript manager, create a new script and paste the code.
4. Save and enable the script.

## Updates

The script includes `@updateURL` and `@downloadURL` metadata pointing to the
raw GitHub file. Supported managers check for updates automatically.

Release steps for maintainers: see [docs/DEVELOPMENT.md § Releasing](docs/DEVELOPMENT.md#releasing).

## Features

**Settings** (header **Steam Plus** button or userscript-manager menu):

- Tabbed panel — **General** · **Translation** (more tabs planned)
- Steam-native dark UI; every change persists across reloads
- Interface language: Auto (browser) or one of **10 locales** — English,
  Русский, Deutsch, Español, Français, Português (Brasil), 简体中文, 日本語,
  한국어, Polski

**Translation** (store + community content):

- **Game descriptions** — full description on the game page and snippets on
  listings
- **Game reviews** — store reviews and community hub review cards
- **Profile comments** — comment threads on profiles, hubs, and shared files
- **News & events** — event/news detail bodies and hub summaries
- Free Google endpoint by default — no API key, extensible provider registry
- Translate **Automatically** as content appears, or via a per-block
  **Translate** button
- Show the translation **below** the original, or **replace** the text with a
  button toggling back to the original
- Target language: Auto (Steam / browser language) or one of 14 common
  languages
- Per-scope on/off switches; global master switch

Under the hood: a per-provider translation cache with TTL and LRU storage
trim plus a concurrency-limited request queue — fast on repeat visits, gentle
on the translation service.

> Translation requires an internet connection to the translation provider
> (`translate.googleapis.com` for the default provider). Translated content is
> cached locally in userscript storage.

## Supported pages

| Site | URL pattern |
|------|-------------|
| Steam Store | `https://store.steampowered.com/*` |
| Steam Community | `https://steamcommunity.com/*` |

## Development & contributing

- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — build, local testing, releasing
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — module layout, data flow, extension contracts
- [CONTRIBUTING.md](CONTRIBUTING.md) — PR guidelines and conventions
- [AGENTS.md](AGENTS.md) — architecture notes for AI coding agents

```bash
npm install
npm run dev      # Vite serve — install the generated "dev:" userscript
npm run build    # Production → dist/ + copy to repo root
npm run ci       # Same checks as GitHub Actions
```

Requires Node.js 22 (see `.nvmrc`).

## Affiliation

This project is **not affiliated** with Valve or Steam. It is an independent
community userscript.

## License

[MIT](LICENSE) — Copyright (c) 2026 NemoKing1210
