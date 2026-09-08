import { PRICE_CACHE_TTL_MS, PRICES_CACHE_KEY } from '../../core/constants.js';
import { Codes, logWarn } from '../../core/debug.js';

const memory = new Map();
let persistTimer = null;

function cacheKey(appid, cc) {
  return `${appid}|${cc ?? 'home'}`;
}

function isFresh(entry) {
  return !!entry && Date.now() - entry.ts < PRICE_CACHE_TTL_MS;
}

function schedulePersist() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => void persistPriceCacheNow(), 1000);
}

export function loadPriceCache() {
  let raw = null;
  try {
    raw = GM_getValue(PRICES_CACHE_KEY, null);
  } catch (error) {
    logWarn(Codes.PRICE_CACHE, 'failed to read price cache', { error });
    return;
  }
  if (!raw || typeof raw !== 'object') return;
  for (const [key, entry] of Object.entries(raw)) {
    if (isFresh(entry)) memory.set(key, entry);
  }
}

/** Cached `price_overview` (or null when the app has no paid price). */
export function getCachedPrice(appid, cc) {
  const entry = memory.get(cacheKey(appid, cc));
  if (!isFresh(entry)) {
    memory.delete(cacheKey(appid, cc));
    return undefined;
  }
  return entry.overview;
}

export function setCachedPrice(appid, cc, overview) {
  memory.set(cacheKey(appid, cc), { ts: Date.now(), overview });
  schedulePersist();
}

export function persistPriceCacheNow() {
  clearTimeout(persistTimer);
  persistTimer = null;
  const snapshot = {};
  for (const [key, entry] of memory) {
    if (isFresh(entry)) snapshot[key] = entry;
  }
  try {
    GM_setValue(PRICES_CACHE_KEY, snapshot);
  } catch (error) {
    logWarn(Codes.PRICE_CACHE, 'failed to persist price cache', { error });
  }
}
