import { MAX_PRICE_REQUESTS } from '../../core/constants.js';
import { Codes, fail } from '../../core/debug.js';
import { getCachedPrice, setCachedPrice } from './cache.js';

const REQUEST_TIMEOUT_MS = 15000;

function appdetailsUrl(appid, cc) {
  const params = new URLSearchParams({
    appids: String(appid),
    filters: 'price_overview',
    l: 'en',
  });
  if (cc) params.set('cc', cc);
  return `https://store.steampowered.com/api/appdetails?${params}`;
}

/**
 * Fetch one `price_overview`: the visitor's own store price when `cc` is
 * null, a regional price otherwise. Resolves to null when the app simply
 * has no paid price (free, unreleased); throws a coded error on transport
 * or payload failures.
 */
export async function fetchPriceOverview(appid, cc, { force } = {}) {
  if (!force) {
    const cached = getCachedPrice(appid, cc);
    if (cached !== undefined) return cached;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(appdetailsUrl(appid, cc), {
      credentials: 'same-origin',
      signal: controller.signal,
    });
  } catch (error) {
    throw fail(Codes.PRICE_REQUEST, `price request failed for app ${appid}`, {
      appid,
      cc: cc ?? 'home',
      error: String(error),
    });
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    throw fail(Codes.PRICE_REQUEST, `price request failed for app ${appid}`, {
      appid,
      cc: cc ?? 'home',
      status: response.status,
    });
  }
  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw fail(Codes.PRICE_RESPONSE, `price response was not JSON for app ${appid}`, {
      appid,
      cc: cc ?? 'home',
      error: String(error),
    });
  }
  const node = payload?.[String(appid)];
  if (!node || typeof node !== 'object' || !node.success) {
    throw fail(Codes.PRICE_RESPONSE, `price response failed for app ${appid}`, {
      appid,
      cc: cc ?? 'home',
    });
  }
  const overview = node.data?.price_overview ?? null;
  setCachedPrice(appid, cc, overview);
  return overview;
}

/**
 * Load the home price plus every requested region price with bounded
 * parallelism. Per-region failures resolve to `{ failed: true }` so one
 * unreachable store country never hides the rest.
 */
export async function loadAppPrices(appid, ccs, { force } = {}) {
  const queue = [...new Set(ccs)];
  const regions = [];
  const workers = Array.from(
    { length: Math.min(MAX_PRICE_REQUESTS, Math.max(queue.length, 1)) },
    async () => {
      while (queue.length) {
        const cc = queue.shift();
        try {
          regions.push({ cc, overview: await fetchPriceOverview(appid, cc, { force }) });
        } catch {
          regions.push({ cc, overview: null, failed: true });
        }
      }
    },
  );
  let home = null;
  let homeFailed = false;
  try {
    home = await fetchPriceOverview(appid, null, { force });
  } catch {
    homeFailed = true;
  }
  await Promise.all(workers);
  return { home, homeFailed, regions };
}
