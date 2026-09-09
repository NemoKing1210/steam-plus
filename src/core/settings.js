import { SUPPORTED_LOCALES } from '../i18n/meta.js';
import { getDefaults, SETTINGS_KEY } from './constants.js';
import { Codes, logError } from './debug.js';

/* ------------------------------------------------------------------ */
/* Normalizers                                                         */
/* ------------------------------------------------------------------ */

function normalizeLocale(value, fallback) {
  if (value === 'auto' || SUPPORTED_LOCALES.includes(value)) return value;
  return fallback;
}

function normalizeTrigger(value) {
  return value === 'auto' ? 'auto' : 'manual';
}

function normalizeDisplay(value) {
  return value === 'replace' ? 'replace' : 'below';
}

function normalizeProvider(value, fallback) {
  return typeof value === 'string' && value ? value : fallback;
}

function normalizeTargetLanguage(value) {
  return typeof value === 'string' && /^[a-z]{2}(-[A-Za-z]{2,4})?$/.test(value)
    ? value
    : 'auto';
}

function normalizeScopes(raw, fallbackScopes) {
  const result = { ...fallbackScopes };
  if (raw && typeof raw === 'object') {
    for (const key of Object.keys(result)) {
      result[key] = raw[key] !== false;
    }
  }
  return result;
}

function normalizeToastPosition(value) {
  const positions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
  return positions.includes(value) ? value : 'bottom-right';
}

function normalizeToastDuration(value, fallback) {
  const ms = Number(value);
  if (!Number.isFinite(ms)) return fallback;
  return Math.min(120000, Math.max(0, Math.round(ms)));
}

function normalizeToasts(raw, fallback) {
  return {
    enabled: raw?.enabled !== false,
    position: normalizeToastPosition(raw?.position),
    duration: normalizeToastDuration(raw?.duration, fallback.duration),
  };
}

function normalizeGamepage(raw, fallback) {
  const hidden = { ...fallback.hidden };
  for (const key of Object.keys(hidden)) {
    hidden[key] = raw?.hidden?.[key] === true;
  }
  return {
    enabled: raw?.enabled !== false,
    hidden,
  };
}

const PRICE_POSITIONS = ['purchase', 'sidebar', 'description'];
const PRICE_SORTS = ['custom', 'priceAsc', 'discountDesc'];
const FX_TTLS = [3600000, 21600000, 86400000, 604800000];
export const LINK_POSITIONS = ['purchase', 'sidebar', 'description'];
export const MAX_LINKS = 30;
export const MAX_LINK_FIELD = 500;

export function makeLinkId() {
  try {
    if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID();
  } catch {
    /* non-secure contexts lack randomUUID */
  }
  return `link-${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffff).toString(16)}`;
}

function normalizeLinkItem(raw) {
  const text = (value) => (typeof value === 'string' ? value.trim().slice(0, MAX_LINK_FIELD) : '');
  const id = typeof raw?.id === 'string' && raw.id ? raw.id.slice(0, 64) : makeLinkId();
  return {
    id,
    name: text(raw?.name).slice(0, 60),
    url: text(raw?.url),
    icon: text(raw?.icon),
    enabled: raw?.enabled !== false,
  };
}

function normalizeLinks(raw, fallback) {
  const items = Array.isArray(raw?.items) ? raw.items : fallback.items;
  const seen = new Set();
  const normalized = [];
  for (const entry of items.slice(0, MAX_LINKS)) {
    const item = normalizeLinkItem(entry);
    if (!item.name || !item.url) continue;
    if (seen.has(item.id)) item.id = makeLinkId();
    seen.add(item.id);
    normalized.push(item);
  }
  return {
    enabled: raw?.enabled !== false,
    position: LINK_POSITIONS.includes(raw?.position) ? raw.position : fallback.position,
    openInNewTab: raw?.openInNewTab !== false,
    items: normalized,
  };
}
const REGION_MODES = ['auto', 'manual'];
const REGION_PROXY_MODES = ['gateway', 'path', 'query'];

function normalizeRegion(raw, fallback) {
  const text = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');
  const country = typeof raw?.countryCode === 'string' && /^[A-Za-z]{2}$/.test(raw.countryCode.trim())
    ? raw.countryCode.trim().toUpperCase()
    : '';
  return {
    enabled: raw?.enabled !== false,
    mode: REGION_MODES.includes(raw?.mode) ? raw.mode : fallback.mode,
    showBanner: raw?.showBanner === true,
    proxyEnabled: raw?.proxyEnabled === true,
    proxyHost: text(raw?.proxyHost, 253).trim(),
    proxyPort: text(raw?.proxyPort, 5).trim(),
    proxyUser: text(raw?.proxyUser, 128),
    proxyPass: text(raw?.proxyPass, 256),
    proxyMode: REGION_PROXY_MODES.includes(raw?.proxyMode) ? raw.proxyMode : fallback.proxyMode,
  };
}

function normalizeConvertTo(value, fallback) {
  if (value === 'auto' || value === 'off') return value;
  if (typeof value === 'string' && /^[A-Za-z]{3}$/.test(value)) return value.toUpperCase();
  return fallback;
}

function normalizePrices(raw, fallback) {
  const regions = Array.isArray(raw?.regions)
    ? [...new Set(raw.regions.map((code) => String(code).toUpperCase()))]
    : [...fallback.regions];
  return {
    enabled: raw?.enabled !== false,
    autoLoad: raw?.autoLoad !== false,
    regions,
    position: PRICE_POSITIONS.includes(raw?.position) ? raw.position : fallback.position,
    sort: PRICE_SORTS.includes(raw?.sort) ? raw.sort : fallback.sort,
    showOriginal: raw?.showOriginal !== false,
    showDiscount: raw?.showDiscount !== false,
    showSavings: raw?.showSavings !== false,
    highlightCheapest: raw?.highlightCheapest !== false,
    showHomeRow: raw?.showHomeRow !== false,
    convertTo: normalizeConvertTo(raw?.convertTo, fallback.convertTo),
    showConverted: raw?.showConverted !== false,
    collapsed: raw?.collapsed === true,
    fxTtl: FX_TTLS.includes(Number(raw?.fxTtl)) ? Number(raw.fxTtl) : fallback.fxTtl,
  };
}

function normalizeTranslation(raw, fallback) {
  return {
    enabled: raw?.enabled !== false,
    provider: normalizeProvider(raw?.provider, fallback.provider),
    trigger: normalizeTrigger(raw?.trigger),
    display: normalizeDisplay(raw?.display),
    targetLanguage: normalizeTargetLanguage(raw?.targetLanguage),
    showCached: raw?.showCached !== false,
    scopes: normalizeScopes(raw?.scopes, fallback.scopes),
  };
}

/* ------------------------------------------------------------------ */
/* Load / save                                                         */
/* ------------------------------------------------------------------ */

export function loadSettings() {
  const fallback = getDefaults();
  let raw = null;
  try {
    raw = GM_getValue(SETTINGS_KEY, null);
  } catch {
    raw = null;
  }
  if (!raw || typeof raw !== 'object') return fallback;
  return {
    language: normalizeLocale(raw.language, fallback.language),
    translation: normalizeTranslation(raw.translation, fallback.translation),
    gamepage: normalizeGamepage(raw.gamepage, fallback.gamepage),
    prices: normalizePrices(raw.prices, fallback.prices),
    links: normalizeLinks(raw.links, fallback.links),
    region: normalizeRegion(raw.region, fallback.region),
    toasts: normalizeToasts(raw.toasts, fallback.toasts),
  };
}

/** @type {ReturnType<typeof loadSettings>} */
let settings = loadSettings();

export function getSettings() {
  return settings;
}

export function getTranslationSettings() {
  return settings.translation;
}

export function getGamepageSettings() {
  return settings.gamepage;
}
export function getPricesSettings() {
  return settings.prices;
}
export function getLinksSettings() {
  return settings.links;
}

export function getRegionSettings() {
  return settings.region;
}

/**
 * Merge a partial patch, normalize it, persist and notify subscribers.
 * @param {Partial<ReturnType<typeof loadSettings>>} patch
 */
export function saveSettings(patch) {
  const next = { ...settings, ...patch };
  if (patch.translation) {
    next.translation = normalizeTranslation(
      { ...settings.translation, ...patch.translation },
      getDefaults().translation,
    );
  }
  settings = next;
  if (patch.gamepage) {
    settings = {
      ...settings,
      gamepage: normalizeGamepage(
        { ...settings.gamepage, ...patch.gamepage },
        getDefaults().gamepage,
      ),
    };
  }
  if (patch.prices) {
    settings = {
      ...settings,
      prices: normalizePrices(
        { ...settings.prices, ...patch.prices },
        getDefaults().prices,
      ),
    };
  }
  if (patch.links) {
    settings = {
      ...settings,
      links: normalizeLinks(
        { ...settings.links, ...patch.links },
        getDefaults().links,
      ),
    };
  }
  if (patch.region) {
    settings = {
      ...settings,
      region: normalizeRegion(
        { ...settings.region, ...patch.region },
        getDefaults().region,
      ),
    };
  }
  if (patch.toasts) {
    settings = {
      ...settings,
      toasts: normalizeToasts(
        { ...settings.toasts, ...patch.toasts },
        getDefaults().toasts,
      ),
    };
  }
  try {
    GM_setValue(SETTINGS_KEY, settings);
  } catch (error) {
    logError(Codes.SETTINGS_PERSIST, 'failed to persist settings', { error });
  }
  return settings;
}

export function resetSettings() {
  settings = getDefaults();
  try {
    GM_setValue(SETTINGS_KEY, settings);
  } catch {
    /* storage unavailable */
  }
  return settings;
}
