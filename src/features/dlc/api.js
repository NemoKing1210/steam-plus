import { MAX_DLC_REQUESTS } from '../../core/constants.js';
import { Codes, fail, logInfo } from '../../core/debug.js';
import { isHostLoggedIn } from '../region/detect.js';
import { parseLiveSession } from '../region/queue.js';
import { getCookie } from '../region/request.js';

const REQUEST_TIMEOUT_MS = 15000;
const APP_HREF_RE = /\/app\/(\d+)/;
const STORE_ROOT = 'https://store.steampowered.com';

/** Response language of the add-on fallback requests (the page's own). */
function pageLanguage() {
  const lang = document.documentElement.lang || '';
  return /^[a-z]{2}/i.test(lang) ? lang.slice(0, 2).toLowerCase() : 'en';
}

/** Store country the page itself is rendered in (`steamCountry` cookie). */
function pageCountry() {
  const cc = (getCookie('steamCountry').split('|')[0] || '').trim();
  return /^[A-Za-z]{2}$/.test(cc) ? cc.toUpperCase() : '';
}

function appdetailsUrl(appids, filters) {
  const params = new URLSearchParams({
    appids: String(appids),
    filters,
    l: pageLanguage(),
  });
  const cc = pageCountry();
  if (cc) params.set('cc', cc);
  return `${STORE_ROOT}/api/appdetails?${params}`;
}

async function fetchJson(url, { signal, code, what }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);
  try {
    const response = await fetch(url, { credentials: 'same-origin', signal: controller.signal });
    if (!response.ok) throw fail(code, `${what} request failed`, { url, status: response.status });
    return await response.json();
  } catch (error) {
    if (error?.code) throw error;
    throw fail(code, `${what} request failed`, { url, error: String(error) }, error);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

function dataNode(payload, appid, code, what) {
  const node = payload?.[String(appid)];
  if (!node || typeof node !== 'object' || !node.success || !node.data) {
    throw fail(code, `${what} response failed for app ${appid}`, { appid });
  }
  return node.data;
}

/** Normalize an `price_overview` (or its absence) into the row price shape. */
function priceFrom(overview) {
  if (!overview) return null;
  return {
    final: overview.final_formatted || '',
    initial: overview.initial > overview.final ? overview.initial_formatted || null : null,
    discount: overview.discount_percent ?? 0,
  };
}

/** Add-on ids of a store app plus its title. */
export async function fetchGameAddons(appid, { signal } = {}) {
  const payload = await fetchJson(appdetailsUrl(appid, 'basic,dlc'), {
    signal,
    code: Codes.DLC_REQUEST,
    what: 'add-on list',
  });
  const data = dataNode(payload, appid, Codes.DLC_RESPONSE, 'add-on list');
  const dlcIds = Array.isArray(data.dlc)
    ? data.dlc.map(Number).filter((id) => Number.isFinite(id) && id > 0)
    : [];
  return { name: String(data.name || ''), dlcIds };
}

/** Title, price, release date and image of one add-on (fallback for partial DOM rows). */
export async function fetchAddonDetail(appid, { signal } = {}) {
  const payload = await fetchJson(appdetailsUrl(appid, 'basic,release_date,price_overview'), {
    signal,
    code: Codes.DLC_REQUEST,
    what: 'add-on detail',
  });
  const data = dataNode(payload, appid, Codes.DLC_RESPONSE, 'add-on detail');
  const rawDate = data.release_date;
  const release = rawDate && typeof rawDate === 'object'
    ? { date: String(rawDate.date || '').trim(), comingSoon: rawDate.coming_soon === true }
    : null;
  return {
    name: String(data.name || ''),
    free: data.is_free === true,
    comingSoon: release?.comingSoon === true,
    release: release?.date ? release : null,
    image: data.capsule_image || data.capsule_imagev5 || data.header_image || '',
    imageLarge: data.header_image || '',
    price: priceFrom(data.price_overview),
  };
}

/**
 * Fetch details for the given add-on ids with bounded parallelism.
 * Each result reaches `onEach(appid, detail | null)` as soon as it lands so
 * the block fills in progressively; single failures never stop the batch.
 */
export async function loadAddonDetails(appids, { onEach, signal } = {}) {
  const queue = appids.slice();
  const workers = Array.from(
    { length: Math.min(MAX_DLC_REQUESTS, Math.max(queue.length, 1)) },
    async () => {
      while (queue.length && !signal?.aborted) {
        const appid = queue.shift();
        let detail = null;
        try {
          detail = await fetchAddonDetail(appid, { signal });
        } catch (error) {
          if (signal?.aborted) return;
          logInfo('dlc', 'add-on detail failed', { appid, error: String(error?.message || error) });
        }
        onEach?.(appid, detail);
      }
    },
  );
  await Promise.all(workers);
}

function readRowPrice(row) {
  const block = row.querySelector('.discount_block');
  const discount = Number(block?.dataset?.discount ?? 0);
  const final = row.querySelector('.discount_final_price')?.textContent?.trim() || '';
  const initial = row.querySelector('.discount_original_price')?.textContent?.trim() || '';
  if (final) {
    return {
      price: { final, initial: discount > 0 && initial ? initial : null, discount: discount > 0 ? discount : 0 },
      known: true,
    };
  }
  const text = (row.querySelector('.game_area_dlc_price')?.textContent || '').replace(/\s+/g, ' ').trim();
  if (!text) return { price: null, known: false };
  if (/^(n\/a|—|-)$/i.test(text)) return { price: null, known: true };
  return { price: { final: text, initial: null, discount: 0 }, known: true };
}

/** Row title without Steam's "Recommended"/"New" style highlight chips. */
function readRowName(row) {
  const node = row.querySelector('.game_area_dlc_name');
  if (!node) return '';
  const clone = node.cloneNode(true);
  clone.querySelector('.dlc_highlight_reason_container, [class*="dlc_highlight"]')?.remove();
  return (clone.textContent || '').replace(/\s+/g, ' ').trim();
}

/** Capsule image Steam already rendered for the row. */
function readRowImage(row) {
  const image = row.querySelector('img');
  return image?.getAttribute('src') || image?.getAttribute('data-src') || '';
}

/** Add-on id of a row: the row itself is usually the store link. */
function readRowAppId(row) {
  const candidates = [
    row.dataset?.dsAppid,
    row.getAttribute?.('data-ds-appid'),
    row.getAttribute?.('id'),
    row.getAttribute?.('href'),
    row.querySelector('[data-ds-appid]')?.getAttribute('data-ds-appid'),
    row.querySelector('a[href*="/app/"]')?.getAttribute('href'),
  ];
  for (let i = 0; i < candidates.length; i += 1) {
    const value = String(candidates[i] ?? '').trim();
    if (!value) continue;
    const bare = value.match(/^(?:dlc_row_)?(\d+)$/);
    if (bare) return Number(bare[1]);
    const match = value.match(APP_HREF_RE);
    if (match) return Number(match[1]);
  }
  return 0;
}

/**
 * Read the store page's own add-on section (name, appid and already
 * formatted price) so the common case renders without extra requests.
 */
export function readAddonSection(root = document) {
  const map = new Map();
  const rows = root.querySelectorAll(
    '#gameAreaDLCSection .game_area_dlc_row, .game_area_dlc_section .game_area_dlc_row',
  );
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const appid = readRowAppId(row);
    if (!appid || map.has(appid)) continue;
    const { price, known } = readRowPrice(row);
    map.set(appid, { name: readRowName(row), image: readRowImage(row), price, priceKnown: known });
  }
  return map;
}

/** Whether the visitor's account owns each app: `{ loggedIn, ids }`. */
export async function fetchOwnedApps({ signal } = {}) {
  if (!isHostLoggedIn()) return { loggedIn: false, ids: [] };
  const { accountId } = parseLiveSession();
  const url = new URL(`${STORE_ROOT}/dynamicstore/userdata/`);
  if (accountId > 0) url.searchParams.set('id', String(accountId));
  const data = await fetchJson(url.toString(), {
    signal,
    code: Codes.DLC_OWNED,
    what: 'owned apps',
  });
  const ids = Array.isArray(data?.rgOwnedApps)
    ? data.rgOwnedApps.map(Number).filter((id) => Number.isFinite(id))
    : [];
  return { loggedIn: true, ids };
}
