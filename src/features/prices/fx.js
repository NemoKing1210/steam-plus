import { FX_RATES_TTL_MS } from '../../core/constants.js';
import { Codes, fail, logInfo } from '../../core/debug.js';

const FX_CACHE_KEY = 'sp_fx_cache_v1';
const REQUEST_TIMEOUT_MS = 15000;

const PROVIDERS = [
  {
    name: 'ExchangeRate-API',
    url: 'https://open.er-api.com/v6/latest/USD',
    normalize(payload) {
      if (payload?.result !== 'success' || !payload?.rates) return null;
      return { rates: payload.rates, date: payload.time_last_update_utc ?? null };
    },
  },
  {
    name: 'jsDelivr currency API',
    url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
    normalize(payload) {
      if (!payload?.usd || typeof payload.usd !== 'object') return null;
      return { rates: payload.usd, date: payload.date ?? null };
    },
  },
];

function getJson(url) {
  if (typeof GM_xmlhttpRequest === 'function') {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        timeout: REQUEST_TIMEOUT_MS,
        onload: (response) => {
          if (response.status !== 200) {
            reject(new Error(`HTTP ${response.status}`));
            return;
          }
          try {
            resolve(JSON.parse(response.responseText));
          } catch (error) {
            reject(error);
          }
        },
        onerror: () => reject(new Error('network error')),
        ontimeout: () => reject(new Error('timed out')),
      });
    });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(url, { signal: controller.signal })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .finally(() => clearTimeout(timer));
}

function readCache() {
  try {
    const raw = GM_getValue(FX_CACHE_KEY, null);
    if (raw && typeof raw === 'object' && raw.rates) return raw;
  } catch (error) {
    logInfo('fx', 'failed to read rates cache', { error: String(error) });
  }
  return null;
}

function writeCache(entry) {
  try {
    GM_setValue(FX_CACHE_KEY, entry);
  } catch (error) {
    logInfo('fx', 'failed to persist rates cache', { error: String(error) });
  }
}

function isFresh(entry, ttlMs = FX_RATES_TTL_MS) {
  return !!entry && Date.now() - entry.ts < ttlMs;
}

function upperRates(rates) {
  const normalized = { USD: 1 };
  for (const [code, rate] of Object.entries(rates)) {
    if (typeof rate === 'number' && rate > 0) normalized[String(code).toUpperCase()] = rate;
  }
  return normalized;
}

/** Read the cached rates without fetching (fresh or stale). */
export function peekFxCache() {
  return readCache();
}

/** Drop the cached rates; the next load fetches them again. */
export function clearFxCache() {
  try {
    if (typeof GM_deleteValue === 'function') GM_deleteValue(FX_CACHE_KEY);
    else GM_setValue(FX_CACHE_KEY, null);
  } catch (error) {
    logInfo('fx', 'failed to clear rates cache', { error: String(error) });
  }
}

/**
 * Live USD-based rates (`{ USD: 1, EUR: 0.86, ... }`) with provider name
 * and rate date. Fresh GM cache wins; otherwise providers are tried in
 * order; a stale cache still beats total failure.
 */
export async function loadFxRates({ force } = {}, ttlMs = FX_RATES_TTL_MS) {
  const cached = readCache();
  if (!force && isFresh(cached, ttlMs)) return cached;

  for (const provider of PROVIDERS) {
    try {
      const data = provider.normalize(await getJson(provider.url));
      if (!data) continue;
      const entry = {
        ts: Date.now(),
        rates: upperRates(data.rates),
        date: data.date,
        provider: provider.name,
      };
      writeCache(entry);
      return entry;
    } catch (error) {
      logInfo('fx', `rates provider "${provider.name}" failed`, { error: String(error?.message ?? error) });
    }
  }
  if (cached) return cached;
  throw fail(Codes.FX_RATES, 'exchange rates are unavailable', {});
}

/** Convert minor units (cents) between currencies through USD. */
export function convertMinor(minorUnits, from, to, rates) {
  const source = rates?.[String(from).toUpperCase()];
  const target = rates?.[String(to).toUpperCase()];
  if (!source || !target || !Number.isFinite(minorUnits)) return null;
  return (minorUnits / 100 / source) * target;
}

/** Minor units (cents) expressed in USD. */
export function toUsd(minorUnits, currency, rates) {
  return convertMinor(minorUnits, currency, 'USD', rates);
}

export function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: String(currency).toUpperCase(),
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
