import {
  CACHE_PERSIST_MS,
  TRANSLATION_CACHE_KEY,
  TRANSLATION_CACHE_MAX_ENTRIES,
  TRANSLATION_CACHE_TTL_MS,
} from '../core/constants.js';
import { Codes, logWarn } from '../core/debug.js';
const memory = new Map(); // key -> { text, time }
let dirty = false;
let persistTimer = null;

function makeKey(provider, to, text) {
  return `${provider}|${to}|${text}`;
}

export function loadMemoryCache() {
  try {
    const raw = GM_getValue(TRANSLATION_CACHE_KEY, null);
    if (raw && typeof raw === 'object') {
      const now = Date.now();
      for (const [key, entry] of Object.entries(raw)) {
        if (entry && typeof entry.text === 'string' && now - entry.time < TRANSLATION_CACHE_TTL_MS) {
          memory.set(key, entry);
        }
      }
    }
  } catch (error) {
    logWarn(Codes.CACHE_LOAD, 'translation cache unavailable, starting empty', { error });
  }
}

/** LRU-trim the in-memory cache down to the entry limit. */
function trimToLimit() {
  const entries = [...memory.entries()]
    .sort((a, b) => b[1].time - a[1].time)
    .slice(0, TRANSLATION_CACHE_MAX_ENTRIES);
  memory.clear();
  for (const [key, entry] of entries) memory.set(key, entry);
}

/** Write dirty entries to GM storage immediately. */
function flush() {
  persistTimer = null;
  if (!dirty) return;
  dirty = false;
  try {
    trimToLimit();
    GM_setValue(TRANSLATION_CACHE_KEY, Object.fromEntries(memory));
  } catch (error) {
    logWarn(Codes.CACHE_PERSIST, 'translation cache write failed, keeping memory copy', {
      entries: memory.size,
      error,
    });
  }
}

/** Debounce writes until CACHE_PERSIST_MS of inactivity. */
function schedulePersist() {
  dirty = true;
  if (persistTimer !== null) return;
  persistTimer = setTimeout(flush, CACHE_PERSIST_MS);
}

/** Flush pending writes synchronously (used on pagehide). */
export function persistCacheNow() {
  if (persistTimer !== null) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  flush();
}

export function getCachedTranslation(provider, to, text) {
  const entry = memory.get(makeKey(provider, to, text));
  if (!entry) return null;
  if (Date.now() - entry.time >= TRANSLATION_CACHE_TTL_MS) {
    memory.delete(makeKey(provider, to, text));
    return null;
  }
  return entry.text;
}

export function setCachedTranslation(provider, to, text, translated) {
  memory.set(makeKey(provider, to, text), { text: translated, time: Date.now() });
  schedulePersist();
}

export function clearTranslationCache() {
  memory.clear();
  try {
    GM_setValue(TRANSLATION_CACHE_KEY, {});
  } catch {
    /* storage unavailable */
  }
}

function entryBytes(entry) {
  const text = typeof entry?.text === 'string' ? entry.text : '';
  try {
    return new TextEncoder().encode(text).length;
  } catch {
    return text.length;
  }
}

/** Storage stats for the settings cache pane. */
export function getTranslationCacheStats() {
  let usedBytes = 0;
  const byProvider = new Map();
  for (const [key, entry] of memory.entries()) {
    const bytes = entryBytes(entry);
    usedBytes += bytes;
    const provider = String(key).split('|')[0] || 'unknown';
    const slot = byProvider.get(provider) ?? { provider, count: 0, bytes: 0 };
    slot.count += 1;
    slot.bytes += bytes;
    byProvider.set(provider, slot);
  }
  const totalCount = memory.size;
  return {
    totalCount,
    limitCount: TRANSLATION_CACHE_MAX_ENTRIES,
    usedBytes,
    freeCount: Math.max(0, TRANSLATION_CACHE_MAX_ENTRIES - totalCount),
    providers: [...byProvider.values()].sort((a, b) => b.bytes - a.bytes),
  };
}

/** Newest-first cache entries for the settings cache pane. */
export function listTranslationCacheEntries() {
  return [...memory.entries()]
    .map(([key, entry]) => {
      const [provider = '', to = '', ...rest] = String(key).split('|');
      return {
        key,
        provider,
        to,
        source: rest.join('|'),
        translated: entry?.text ?? '',
        bytes: entryBytes(entry),
        time: entry?.time ?? 0,
      };
    })
    .sort((a, b) => b.time - a.time);
}

export function removeTranslationCacheEntry(key) {
  return memory.delete(key);
}
