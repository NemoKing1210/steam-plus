import {
  CACHE_PERSIST_MS,
  DLC_CACHE_KEY,
  DLC_CACHE_MAX_DETAILS,
  DLC_CACHE_TTL_MS,
  DLC_OWNED_TTL_MS,
} from '../../core/constants.js';
import { Codes, logWarn } from '../../core/debug.js';

/** @type {Map<string, { name: string, dlcIds: number[], ts: number }>} */
const baseCache = new Map();
/** @type {Map<string, object>} */
const detailCache = new Map();
/** @type {{ ts: number, loggedIn: boolean, ids: number[] } | null} */
let ownedCache = null;
let persistTimer = null;

function isFresh(entry, ttl) {
  return !!entry && Date.now() - entry.ts < ttl;
}

function schedulePersist() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => persistDlcCacheNow(), CACHE_PERSIST_MS);
}

export function loadDlcCache() {
  let raw = null;
  try {
    raw = GM_getValue(DLC_CACHE_KEY, null);
  } catch (error) {
    logWarn(Codes.DLC_CACHE, 'failed to read add-on cache', { error });
    return;
  }
  if (!raw || typeof raw !== 'object') return;
  const base = raw.base && typeof raw.base === 'object' ? raw.base : {};
  const details = raw.details && typeof raw.details === 'object' ? raw.details : {};
  for (const appid of Object.keys(base)) {
    const entry = base[appid];
    if (isFresh(entry, DLC_CACHE_TTL_MS)) baseCache.set(String(appid), entry);
  }
  for (const appid of Object.keys(details)) {
    const entry = details[appid];
    if (isFresh(entry, DLC_CACHE_TTL_MS)) detailCache.set(String(appid), entry);
  }
  if (isFresh(raw.owned, DLC_OWNED_TTL_MS)) ownedCache = raw.owned;
}

/** Cached add-on id list for a game, or null when stale/absent. */
export function getCachedDlcBase(appid) {
  const entry = baseCache.get(String(appid));
  return isFresh(entry, DLC_CACHE_TTL_MS) ? entry : null;
}

export function setCachedDlcBase(appid, value) {
  baseCache.set(String(appid), { ...value, ts: Date.now() });
  schedulePersist();
}

/** Cached detail for one add-on (name, price, release state). */
export function getCachedDlcDetail(appid) {
  const entry = detailCache.get(String(appid));
  return isFresh(entry, DLC_CACHE_TTL_MS) ? entry : null;
}

export function setCachedDlcDetail(appid, value) {
  detailCache.set(String(appid), { ...value, ts: Date.now() });
  trimDetails();
  schedulePersist();
}

/** Drop the oldest add-on details once the cache grows past its cap. */
function trimDetails() {
  if (detailCache.size <= DLC_CACHE_MAX_DETAILS) return;
  const oldest = [];
  detailCache.forEach((entry, key) => oldest.push({ key, ts: Number(entry?.ts) || 0 }));
  oldest.sort((a, b) => a.ts - b.ts);
  for (let i = 0; i < oldest.length - DLC_CACHE_MAX_DETAILS; i += 1) {
    detailCache.delete(oldest[i].key);
  }
}

/** Cached ownership: `{ loggedIn, ids }` or null when stale/absent. */
export function getCachedOwnedApps() {
  return isFresh(ownedCache, DLC_OWNED_TTL_MS) ? ownedCache : null;
}

export function setCachedOwnedApps(value) {
  ownedCache = { ...value, ts: Date.now() };
  schedulePersist();
}

export function persistDlcCacheNow() {
  clearTimeout(persistTimer);
  persistTimer = null;
  const snapshot = { base: {}, details: {}, owned: null };
  baseCache.forEach((entry, key) => {
    if (isFresh(entry, DLC_CACHE_TTL_MS)) snapshot.base[key] = entry;
  });
  detailCache.forEach((entry, key) => {
    if (isFresh(entry, DLC_CACHE_TTL_MS)) snapshot.details[key] = entry;
  });
  if (isFresh(ownedCache, DLC_OWNED_TTL_MS)) snapshot.owned = ownedCache;
  try {
    GM_setValue(DLC_CACHE_KEY, snapshot);
  } catch (error) {
    logWarn(Codes.DLC_CACHE, 'failed to persist add-on cache', { error });
  }
}

export function clearDlcCache() {
  clearTimeout(persistTimer);
  persistTimer = null;
  baseCache.clear();
  detailCache.clear();
  ownedCache = null;
  try {
    GM_deleteValue(DLC_CACHE_KEY);
  } catch (error) {
    logWarn(Codes.DLC_CACHE, 'failed to clear add-on cache', { error });
  }
}
