import { REGION_CACHE_KEY } from '../../core/constants.js';
import { getSettings } from '../../core/settings.js';
import { Codes, logWarn } from '../../core/debug.js';

const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

function readStore() {
  try {
    const raw = GM_getValue(REGION_CACHE_KEY, null);
    if (raw && typeof raw === 'object') return raw;
  } catch (error) {
    logWarn(Codes.REGION_CACHE, 'failed to read region cache', { error });
  }
  return {};
}

function writeStore(store) {
  try {
    GM_setValue(REGION_CACHE_KEY, store);
  } catch (error) {
    logWarn(Codes.REGION_CACHE, 'failed to persist region cache', { error });
  }
}

export function getRegionCacheTtlMs(settings = getSettings().region) {
  return Math.max(0, Math.round(Number(settings?.cacheMinutes ?? 60))) * 60 * 1000;
}

export function getRegionCacheMaxEntries(settings = getSettings().region) {
  const n = Math.round(Number(settings?.cacheMaxEntries ?? 30));
  if (!Number.isFinite(n)) return 30;
  return Math.min(100, Math.max(1, n));
}

export function buildRegionCacheKey(targetUrl) {
  try {
    const url = new URL(String(targetUrl));
    url.searchParams.delete('snr');
    return url.toString();
  } catch {
    return String(targetUrl);
  }
}

function pruneStore(store, ttlMs, maxEntries) {
  const now = Date.now();
  const kept = Object.entries(store)
    .filter(([, entry]) => entry && typeof entry.html === 'string' && entry.html)
    .filter(([, entry]) => ttlMs <= 0 || now - Number(entry.savedAt || 0) < ttlMs)
    .sort((a, b) => Number(b[1].savedAt || 0) - Number(a[1].savedAt || 0))
    .slice(0, maxEntries);
  return Object.fromEntries(kept);
}

export function readRegionCache(targetUrl) {
  const ttlMs = getRegionCacheTtlMs();
  if (ttlMs <= 0) return null;
  const key = buildRegionCacheKey(targetUrl);
  const store = readStore();
  const entry = store[key];
  if (!entry || typeof entry.html !== 'string' || !entry.html) return null;
  if (Date.now() - Number(entry.savedAt || 0) >= ttlMs) {
    delete store[key];
    writeStore(store);
    return null;
  }
  return entry.html;
}

export function writeRegionCache(targetUrl, html) {
  if (getRegionCacheTtlMs() <= 0) return;
  if (typeof html !== 'string' || !html) return;
  const key = buildRegionCacheKey(targetUrl);
  const store = readStore();
  store[key] = { html, savedAt: Date.now() };
  writeStore(pruneStore(store, getRegionCacheTtlMs(), getRegionCacheMaxEntries()));
}

export function invalidateRegionCache(targetUrl) {
  const key = buildRegionCacheKey(targetUrl);
  const store = readStore();
  if (key in store) {
    delete store[key];
    writeStore(store);
  }
}

export function clearRegionCache() {
  const store = readStore();
  const count = Object.keys(store).length;
  try {
    GM_setValue(REGION_CACHE_KEY, {});
  } catch (error) {
    logWarn(Codes.REGION_CACHE, 'failed to clear region cache', { error });
  }
  return count;
}

function utf8Bytes(value) {
  if (!encoder) return String(value || '').length;
  try {
    return encoder.encode(String(value || '')).length;
  } catch {
    return String(value || '').length;
  }
}

export function getRegionCacheStats() {
  const store = readStore();
  const entries = Object.entries(store);
  let bytes = 0;
  for (const [key, entry] of entries) {
    bytes += utf8Bytes(key) + utf8Bytes(entry?.html);
  }
  return { count: entries.length, bytes };
}

export function formatRegionCacheBytes(n) {
  const bytes = Math.max(0, Math.round(Number(n) || 0));
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
