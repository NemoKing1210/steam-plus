import { getSettings } from '../../core/settings.js';
import { SEARCH_MAX_ROWS } from '../../core/constants.js';
import { Codes, fail } from '../../core/debug.js';
import { getRegion } from '../prices/regions.js';
import {
  buildRequestUrl,
  getSteamStoreLanguage,
  getStoreCountryCode,
  guestFetch,
} from '../region/request.js';

const APP_ID_RE = /\/app\/(\d+)/i;

export function getGuestCountryCode(settings = getSettings().region) {
  return getStoreCountryCode(settings);
}

export function getGuestCountryName(cc) {
  if (!cc) return '';
  return getRegion(cc)?.name ?? String(cc).toUpperCase();
}

export function buildSuggestUrl(term, { cc = '', lang = 'english' } = {}) {
  const url = new URL('https://store.steampowered.com/search/suggest');
  url.searchParams.set('term', term);
  url.searchParams.set('f', 'games');
  if (cc) url.searchParams.set('cc', cc);
  if (lang) url.searchParams.set('l', lang);
  return url.toString();
}

export function parseSuggestHtml(html) {
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
  const seen = new Set();
  const results = [];
  for (const anchor of doc.querySelectorAll('a')) {
    const href = anchor.getAttribute('href') || '';
    const appid = anchor.dataset?.dsAppid || href.match(APP_ID_RE)?.[1] || '';
    if (!appid || seen.has(appid)) continue;
    seen.add(appid);
    results.push({
      appid,
      url: anchor.getAttribute('href') || `https://store.steampowered.com/app/${appid}/`,
      name: anchor.querySelector('.match_name')?.textContent?.trim() || '',
      img: anchor.querySelector('.match_img img')?.getAttribute('src') || '',
      price: anchor.querySelector('.match_price')?.textContent?.trim() || '',
    });
  }
  return results;
}

export async function fetchGuestSuggestions(term, settings = getSettings().region, cc = getGuestCountryCode(settings)) {
  const url = buildRequestUrl(buildSuggestUrl(term, { cc, lang: getSteamStoreLanguage() }), settings);
  const response = await guestFetch(url, settings);
  if (response.status < 200 || response.status >= 400) {
    throw fail(Codes.REGION_REQUEST, 'guest suggest request failed', { status: response.status });
  }
  return { cc, results: parseSuggestHtml(response.responseText || '') };
}

export function getSearchRowLimit(settings = getSettings().region) {
  const wanted = settings?.searchMaxRows;
  return Number.isInteger(wanted) ? Math.min(SEARCH_MAX_ROWS, Math.max(1, wanted)) : 6;
}

function textOf(root, selector) {
  return root.querySelector?.(selector)?.textContent?.trim() || '';
}

function parseReviewSummary(anchor) {
  const node = anchor.querySelector?.('.search_review_summary');
  if (!node) return '';
  const tooltip = node.getAttribute('data-tooltip-html') || '';
  const parts = tooltip.split(/<br\s*\/?>|&lt;br\s*\/?&gt;/i);
  const label = (parts[0] || '').replace(/&[^;]+;/g, '').trim();
  const percent = (parts[1] || '').match(/(\d+%)/)?.[1] || '';
  return [label, percent].filter(Boolean).join(' · ');
}

const PLATFORM_CLASSES = ['win', 'mac', 'linux'];

function parsePlatforms(anchor) {
  const platforms = [];
  for (const node of anchor.querySelectorAll?.('.platform_img') ?? []) {
    for (const name of PLATFORM_CLASSES) {
      if (node.classList?.contains(name) && !platforms.includes(name)) platforms.push(name);
    }
  }
  return platforms;
}

export function parseSearchResults(html) {
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
  const rows = new Map();
  for (const anchor of doc.querySelectorAll('a.search_result_row[data-ds-appid]')) {
    const appid = anchor.dataset?.dsAppid || '';
    if (!appid || rows.has(appid)) continue;
    const priceBox = anchor.querySelector?.('.search_price_discount_combined');
    rows.set(appid, {
      appid,
      date: textOf(anchor, '.search_released'),
      review: parseReviewSummary(anchor),
      platforms: parsePlatforms(anchor),
      discount: textOf(anchor, '.discount_pct'),
      original: textOf(anchor, '.discount_original_price'),
      final: textOf(anchor, '.discount_final_price'),
      free: priceBox?.getAttribute?.('data-price-final') === '0',
    });
  }
  return rows;
}

export async function fetchSearchDetails(term, { cc = '', lang = 'english', count = 10, settings = getSettings().region } = {}) {
  const url = new URL('https://store.steampowered.com/search/results/');
  url.searchParams.set('query', '');
  url.searchParams.set('start', '0');
  url.searchParams.set('count', String(count));
  url.searchParams.set('dynamic_data', '');
  url.searchParams.set('sort_by', '_ASC');
  url.searchParams.set('term', term);
  url.searchParams.set('infinite', '1');
  if (cc) url.searchParams.set('cc', cc);
  if (lang) url.searchParams.set('l', lang);
  const response = await guestFetch(buildRequestUrl(url.toString(), settings), settings);
  if (response.status < 200 || response.status >= 400) {
    throw fail(Codes.REGION_REQUEST, 'guest search results request failed', { status: response.status });
  }
  let json;
  try {
    json = JSON.parse(response.responseText || '{}');
  } catch {
    throw fail(Codes.REGION_RESPONSE, 'guest search results parse failed');
  }
  if (json?.success !== 1 && json?.success !== true) {
    throw fail(Codes.REGION_RESPONSE, 'guest search results unsuccessful');
  }
  return { cc, total: json.total_count ?? 0, rows: parseSearchResults(json.results_html || '') };
}
