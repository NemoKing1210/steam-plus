import {
  PRICE_HISTORY_CACHE_KEY,
  PRICE_HISTORY_MAX_ENTRIES,
  PRICE_HISTORY_TTL_MS,
} from '../../core/constants.js';
import { Codes, fail, logWarn } from '../../core/debug.js';
import { getJson } from '../../utils/http.js';

const API_BASE = 'https://www.cheapshark.com/api/1.0/games';

const memory = new Map();
let persistTimer = null;

function isFresh(entry) {
  return !!entry && Date.now() - entry.ts < PRICE_HISTORY_TTL_MS;
}

function schedulePersist() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => persistPriceHistoryNow(), 1000);
}

export function loadPriceHistoryCache() {
  let raw = null;
  try {
    raw = GM_getValue(PRICE_HISTORY_CACHE_KEY, null);
  } catch (error) {
    logWarn(Codes.PRICE_CACHE, 'failed to read price history cache', { error });
    return;
  }
  if (!raw || typeof raw !== 'object') return;
  for (const [key, entry] of Object.entries(raw)) {
    if (isFresh(entry)) memory.set(key, entry);
  }
}

export function persistPriceHistoryNow() {
  clearTimeout(persistTimer);
  persistTimer = null;
  const fresh = [...memory].filter(([, entry]) => isFresh(entry));
  fresh.sort((a, b) => b[1].ts - a[1].ts);
  const snapshot = Object.fromEntries(fresh.slice(0, PRICE_HISTORY_MAX_ENTRIES));
  try {
    GM_setValue(PRICE_HISTORY_CACHE_KEY, snapshot);
  } catch (error) {
    logWarn(Codes.PRICE_CACHE, 'failed to persist price history cache', { error });
  }
}

function parseLow(payload) {
  const price = Number.parseFloat(payload?.cheapestPriceEver?.price);
  if (!Number.isFinite(price) || price <= 0) return null;
  const seconds = Number(payload.cheapestPriceEver.date);
  return { price, date: Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : null };
}

async function request(appid, params) {
  try {
    return await getJson(`${API_BASE}?${new URLSearchParams(params)}`);
  } catch (error) {
    throw fail(Codes.PRICE_HISTORY, `price history request failed for app ${appid}`, {
      appid,
      error: String(error?.message ?? error),
    });
  }
}

/**
 * All-time low for a Steam app in USD (`{ price, date }`, `date` in ms or
 * null), or null when the provider does not track the game. The provider
 * (CheapShark) covers every store it tracks, not Steam alone. Throws a coded
 * error on transport or payload failures; a missing game is a cached null.
 */
export async function loadPriceHistory(appid, { force } = {}) {
  const key = String(appid);
  if (!force) {
    const cached = memory.get(key);
    if (isFresh(cached)) return cached.low;
  }
  const games = await request(appid, { steamAppID: key });
  if (!Array.isArray(games)) {
    throw fail(Codes.PRICE_HISTORY, `price history response was unusable for app ${appid}`, { appid });
  }
  const gameId = games[0]?.gameID;
  let low = null;
  if (gameId) {
    low = parseLow(await request(appid, { id: String(gameId) }));
  }
  memory.set(key, { ts: Date.now(), low });
  schedulePersist();
  return low;
}
