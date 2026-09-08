export const SCRIPT_NAME = 'Steam Plus';
export const AUTHOR_NAME = 'NemoKing1210';
export const AUTHOR_URL = 'https://github.com/NemoKing1210';
export const REPO_URL = 'https://github.com/NemoKing1210/steam-plus';
export const SETTINGS_KEY = 'sp_settings_v1';
export const TRANSLATION_CACHE_KEY = 'sp_translation_cache_v1';

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

export const DEFAULT_SETTINGS = {
  /** UI language: 'auto' or one of SUPPORTED_LOCALES. */
  language: 'auto',
  translation: DEFAULT_TRANSLATION,
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
