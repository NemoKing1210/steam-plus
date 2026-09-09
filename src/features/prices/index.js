import { on } from '../../core/bus.js';
import { getSettings } from '../../core/settings.js';
import { logInfo } from '../../core/debug.js';
import { watchStoreNavigation } from '../../utils/navigation.js';
import { isGamePageUrl } from '../gamepage/blocks.js';
import { getRegion, isKnownRegion } from './regions.js';
import { loadPriceCache } from './cache.js';
import { loadAppPrices } from './api.js';
import {
  convertMinor,
  formatMoney,
  loadFxRates,
  toUsd,
} from './fx.js';
import { createPricesRoot, paintPrices } from './ui.js';

const APPID_RE = /\/app\/(\d+)/;
const ROOT_SELECTOR = '.sp-prices';

export function parseAppId(url) {
  const match = String(url).match(APPID_RE);
  return match ? match[1] : null;
}

function resolveAnchor(position) {
  const pick = (selector) => document.querySelector(selector);
  if (position === 'sidebar') {
    const target = pick('.rightcol.game_meta_data') ?? pick('#game_area_purchase');
    return { target, mode: target?.classList.contains('game_meta_data') ? 'prepend' : 'before' };
  }
  if (position === 'description') {
    return { target: pick('#game_area_description') ?? pick('#game_area_purchase'), mode: 'after' };
  }
  return { target: pick('#game_area_purchase') ?? pick('#game_area_description'), mode: 'before' };
}

function placeRoot(root, anchor) {
  if (!anchor?.target) return false;
  if (anchor.mode === 'prepend') {
    anchor.target.insertBefore(root, anchor.target.firstChild);
  } else if (anchor.mode === 'before') {
    anchor.target.before(root);
  } else {
    anchor.target.after(root);
  }
  return root.isConnected;
}

/** Target display currency: explicit code, the visitor's store currency, or none. */
function resolveTarget(convertTo, home) {
  if (convertTo === 'off') return null;
  if (convertTo === 'auto') return home?.currency ?? null;
  return convertTo;
}

function formatConverted(final, currency, target, rates) {
  if (!target || currency === target || !rates) return null;
  const amount = convertMinor(final, currency, target, rates);
  return amount === null ? null : `≈ ${formatMoney(amount, target)}`;
}

function normalizeOverview(cc, overview, rates, target, showConverted) {
  if (!overview) return null;
  const region = getRegion(cc);
  return {
    cc,
    name: region?.name ?? cc,
    currency: overview.currency,
    final: overview.final,
    final_formatted: overview.final_formatted || `${(overview.final / 100).toFixed(2)} ${overview.currency}`,
    initial: overview.initial,
    initial_formatted: overview.initial_formatted || '',
    discount: overview.discount_percent ?? 0,
    usd: rates ? toUsd(overview.final, overview.currency, rates) : null,
    converted: showConverted
      ? formatConverted(overview.final, overview.currency, target, rates)
      : null,
  };
}

function savingsPct(homeUsd, usd) {
  if (homeUsd === null || usd === null || !(homeUsd > 0)) return null;
  return Math.round(((homeUsd - usd) / homeUsd) * 100);
}

function formatFxDate(fx) {
  if (!fx?.date) return '';
  const parsed = new Date(fx.date);
  return Number.isNaN(parsed.getTime()) ? String(fx.date) : parsed.toLocaleDateString();
}

/** Current mount: removed on navigation, settings change, or teardown. */
let current = null;

/** Default in-block table sort derived from the settings row order. */
function sortFromSettings(sort) {
  if (sort === 'priceAsc') return { key: 'price', dir: 'asc' };
  if (sort === 'discountDesc') return { key: 'discount', dir: 'desc' };
  return { key: 'custom', dir: 'asc' };
}

function defaultDir(key) {
  return key === 'discount' || key === 'savings' ? 'desc' : 'asc';
}

function repaint() {
  if (!current?.data || !current.root.isConnected) return;
  paintPrices(
    current.root,
    { ...current.data, sort: current.sort },
    getSettings().prices,
    handlers(current.appid, current.root),
  );
}

function teardown() {
  document.querySelector(ROOT_SELECTOR)?.remove();
  current = null;
}

async function loadInto(appid, root, settings, { force } = {}) {
  const handlersRef = handlers(appid, root);
  paintPrices(root, { status: 'loading' }, settings, handlersRef);
  const [prices, fx] = await Promise.all([
    loadAppPrices(appid, settings.regions, { force }),
    loadFxRates({ force }, settings.fxTtl).catch(() => null),
  ]);
  if (!root.isConnected || current?.root !== root) return;
  const { home, homeFailed, regions } = prices;
  const rates = fx?.rates ?? null;
  const target = resolveTarget(settings.convertTo, home);
  const showConverted = settings.showConverted && target !== null;
  const rows = regions
    .map(({ cc, overview }) => normalizeOverview(cc, overview, rates, target, showConverted))
    .filter(Boolean);
  const homeRow = home ? normalizeOverview('home', home, rates, target, showConverted) : null;
  if (!homeRow && !rows.length) {
    if (homeFailed || regions.some((region) => region.failed)) {
      paintPrices(root, { status: 'error' }, getSettings().prices, handlers(appid, root));
    } else {
      root.remove();
      if (current?.root === root) current = null;
    }
    return;
  }
  const homeUsd = homeRow?.usd ?? null;
  for (const row of rows) {
    row.save = settings.showSavings ? savingsPct(homeUsd, row.usd) : null;
  }
  const comparable = rows.filter((row) => row.usd !== null);
  const cheapest = comparable.length
    ? comparable.reduce((best, row) => (row.usd < best.usd ? row : best))
    : null;
  const conversionShown = showConverted && (homeRow?.converted || rows.some((row) => row.converted));
  const rankingShown = settings.showSavings || settings.highlightCheapest || settings.sort !== 'custom';
  if (current?.root === root) {
    current.data = {
      status: 'ready',
      home: homeRow,
      rows,
      cheapestCc: cheapest?.cc ?? null,
      updatedAt: Date.now(),
      fxHint: fx && (conversionShown || rankingShown)
        ? { provider: fx.provider, date: formatFxDate(fx) }
        : null,
    };
    repaint();
  }
}

function handlers(appid, root) {
  return {
    onLoad: () => {
      if (current?.root === root) void loadInto(appid, root, getSettings().prices);
    },
    onRetry: () => {
      if (current?.root === root) void loadInto(appid, root, getSettings().prices);
    },
    onRefresh: () => {
      if (current?.root === root) void loadInto(appid, root, getSettings().prices, { force: true });
    },
    onSort: (key) => {
      if (current?.root !== root) return;
      current.sort = current.sort.key === key
        ? { key, dir: current.sort.dir === 'desc' ? 'asc' : 'desc' }
        : { key, dir: defaultDir(key) };
      repaint();
    },
  };
}

function mount(appid) {
  teardown();
  const settings = getSettings().prices;
  const wanted = settings.regions.filter(isKnownRegion);
  const root = createPricesRoot();
  if (!placeRoot(root, resolveAnchor(settings.position))) {
    logInfo('prices', 'no anchor for regional prices', { appid });
    return;
  }
  current = { appid, root, sort: sortFromSettings(settings.sort), data: null };
  if (!wanted.length) {
    paintPrices(root, { status: 'empty-regions' }, settings, handlers(appid, root));
    return;
  }
  if (!settings.autoLoad) {
    paintPrices(root, { status: 'manual' }, settings, handlers(appid, root));
    return;
  }
  void loadInto(appid, root, settings);
}

/** Reconcile the block with the current URL and settings. */
export function applyPricesSettings() {
  const { prices } = getSettings();
  const appid = isGamePageUrl(location.href) ? parseAppId(location.href) : null;
  if (!prices.enabled || !appid) {
    teardown();
    return;
  }
  mount(appid);
}

let pricesSubscribed = false;

export function initPricesFeature() {
  loadPriceCache();
  applyPricesSettings();
  if (pricesSubscribed) return;
  pricesSubscribed = true;
  on('settings:prices', applyPricesSettings);
  // Region bypass replaces the document without changing the URL, so the
  // navigation watcher never fires — remount into the fresh anchors here.
  on('region:injected', applyPricesSettings);
  watchStoreNavigation(() => applyPricesSettings());
}
