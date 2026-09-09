export const SCRIPT_NAME = 'Steam Plus';
export const AUTHOR_NAME = 'NemoKing1210';
export const AUTHOR_URL = 'https://github.com/NemoKing1210';
export const REPO_URL = 'https://github.com/NemoKing1210/steam-plus';
export const SETTINGS_KEY = 'sp_settings_v1';
export const TRANSLATION_CACHE_KEY = 'sp_translation_cache_v1';
export const PRICES_CACHE_KEY = 'sp_prices_cache_v1';

/** Translation cache TTL, ms (7 days). */
export const TRANSLATION_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Debounce for persisting the translation cache to GM storage. */
export const CACHE_PERSIST_MS = 1000;
/** Max translations persisted in storage (LRU trim). */
export const TRANSLATION_CACHE_MAX_ENTRIES = 2000;
/** Max parallel provider requests. */
export const MAX_CONCURRENT_REQUESTS = 3;
/** Max characters per provider request (text is hard-split beyond this). */
export const MAX_REQUEST_TEXT_LENGTH = 4000;
/** Regional price cache TTL, ms (1 hour). */
export const PRICE_CACHE_TTL_MS = 60 * 60 * 1000;
/** Exchange rates cache TTL, ms (24 hours). */
export const FX_RATES_TTL_MS = 24 * 60 * 60 * 1000;
/** Max parallel regional price requests. */
export const MAX_PRICE_REQUESTS = 3;
/** Anonymous guest request timeout, ms. */
export const REGION_REQUEST_TIMEOUT_MS = 45000;
/** Cap for the rewritten guest document to reach window load, ms; boot continues regardless. */
export const REGION_BOOT_TIMEOUT_MS = 30000;
/** Cap for loading missing guest bundles before replaying init scripts, ms. */
export const REGION_ASSET_TIMEOUT_MS = 10000;
/** Debounce for DOM mutation rescans. */
export const SCAN_DEBOUNCE_MS = 450;
/** CSS class prefix used by every element we create (excluded from scans). */
export const CSS_PREFIX = 'sp-';

/** @typedef {Object} TranslationSettings */
const DEFAULT_TRANSLATION = {
  /** Master switch for the whole translation feature. */
  enabled: true,
  /** Provider id from the provider registry. */
  provider: 'google-free',
  /** 'manual' — show a per-block translate button; 'auto' — translate as soon as content appears. */
  trigger: 'manual',
  /** 'below' — render translation under the original; 'replace' — swap original text. */
  display: 'below',
  /** ISO 639-1 code or 'auto' (Steam/browser language). */
  targetLanguage: 'auto',
  /** Render cached translations immediately without pressing the button. */
  showCached: true,
  /** Which content scopes are translated (keys of the target registry). */
  scopes: {
    gameDescription: true,
    gameReviews: true,
    profileComments: true,
    gameNews: true,
  },
};

/** Game page block visibility: master switch + per-block hide flags. */
const DEFAULT_GAMEPAGE = {
  /** Master switch for hiding blocks on store game pages. */
  enabled: true,
  /** Block ids (see features/gamepage/blocks.js) mapped to hidden flags. */
  hidden: {
    media: false,
    purchase: false,
    description: false,
    dlc: false,
    sysreq: false,
    reviews: false,
    curators: false,
    events: false,
    details: false,
    recommendations: false,
    sale: false,
    edition: false,
  },
};

/** Regional price comparison on store game pages. */
const DEFAULT_PRICES = {
  /** Master switch for the regional prices block. */
  enabled: true,
  /** Load prices automatically; otherwise show a per-page load button. */
  autoLoad: true,
  /** Store country codes (`cc` API param) to compare, in display order. */
  regions: ['US', 'DE', 'GB', 'PL', 'UA', 'KZ', 'TR'],
  /** Block placement: 'purchase' (below buy options), 'sidebar', 'description'. */
  position: 'purchase',
  /** Row order: 'custom' (as listed), 'priceAsc', 'discountDesc'. */
  sort: 'custom',
  /** Show the original (pre-discount) price next to the final one. */
  showOriginal: true,
  /** Show the Steam-green discount badge. */
  showDiscount: true,
  /** Show the converted-price difference against the visitor's own price. */
  showSavings: true,
  /** Highlight the cheapest comparable region. */
  highlightCheapest: true,
  /** Pin the visitor's own store price as the first row. */
  showHomeRow: true,
  /** Convert prices into this currency: 'auto' (own store currency), 'off', or an ISO code. */
  convertTo: 'auto',
  /** Show the converted price next to Steam's own formatted price. */
  showConverted: true,
  /** Start with the comparison block collapsed to save space. */
  collapsed: false,
  /** Exchange rates cache lifetime, ms (1h / 6h / 24h / 7d). */
  fxTtl: FX_RATES_TTL_MS,
};

/** Region bypass: guest reload of store pages blocked with “unavailable in your region”. */
const DEFAULT_REGION = {
  /** Master switch for the region bypass. */
  enabled: true,
  /** 'auto' — replace blocked pages immediately; 'manual' — show an offer button first. */
  mode: 'auto',
  /** Optional Steam store country override (`cc`) for guest requests, '' = keep mine. */
  countryCode: '',
  /** Route the anonymous fetch through an HTTP gateway (IP-based locks). */
  proxyEnabled: false,
  /** Gateway address without scheme (host) plus optional port. */
  proxyHost: '',
  proxyPort: '',
  /** Optional HTTP Basic auth for the gateway. */
  proxyUser: '',
  proxyPass: '',
  /** How the target URL is appended to host:port: 'gateway' | 'path' | 'query'. */
  proxyMode: 'gateway',
  /** Show the guest-fetch notice banner on bypassed pages (hidden by default). */
  showBanner: false,
};

export const DEFAULT_SETTINGS = {
  /** UI language: 'auto' or one of SUPPORTED_LOCALES. */
  language: 'auto',
  translation: DEFAULT_TRANSLATION,
  /** Hidden blocks on store game pages (`/app/<id>`). */
  gamepage: DEFAULT_GAMEPAGE,
  /** Regional price comparison on store game pages. */
  prices: DEFAULT_PRICES,
  /** Region bypass for store pages blocked with “unavailable in your region”. */
  region: DEFAULT_REGION,
  /** Toast notifications: master switch, screen corner, auto-hide ms (0 = sticky). */
  toasts: {
    enabled: true,
    position: 'bottom-right',
    duration: 5000,
  },
};

/** Deep-cloned defaults, used on reset. */
export function getDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}
