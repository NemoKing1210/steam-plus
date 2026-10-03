import { MAX_DLC_ITEMS } from '../../core/constants.js';
import { on } from '../../core/bus.js';
import { getSettings } from '../../core/settings.js';
import { Codes, logError, logWarn } from '../../core/debug.js';
import { placeGameBlock, resolveGameAnchor } from '../../utils/gameAnchors.js';
import { watchStoreNavigation } from '../../utils/navigation.js';
import { openViewer } from '../../ui/viewer.js';
import { isGamePageUrl } from '../gamepage/blocks.js';
import { parseAppId } from '../links/template.js';
import {
  getCachedDlcBase,
  getCachedDlcDetail,
  getCachedOwnedApps,
  loadDlcCache,
  setCachedDlcBase,
  setCachedDlcDetail,
  setCachedOwnedApps,
} from './cache.js';
import {
  fetchAddonDetail,
  fetchGameAddons,
  fetchOwnedApps,
  loadAddonDetails,
  readAddonSection,
} from './api.js';
import {
  createDlcRoot,
  paintDlc,
  setDlcCollapsed,
  setDlcProgress,
  setDlcUpdated,
  updateDlcRow,
} from './ui.js';

/** Current mount: aborted and removed on navigation, settings change or teardown. */
let current = null;

function teardown() {
  current?.controller.abort();
  document.querySelector('.sp-dlc')?.remove();
  current = null;
}

/** Merge the add-on's own detail, the store DOM prefill and ownership into one row. */
function buildRow(appid, { detail, prefill, owned }) {
  return {
    appid,
    name: detail?.name || prefill?.name || '',
    image: prefill?.image || detail?.image || '',
    imageLarge: detail?.imageLarge || '',
    price: prefill?.price ?? detail?.price ?? null,
    release: detail?.release ?? null,
    free: detail?.free === true,
    comingSoon: detail?.comingSoon === true,
    priceKnown: prefill?.priceKnown === true,
    owned,
  };
}

/** Rows whose detail the store page itself already provided cost no request. */
function needsDetail(row, settings) {
  if (!row.name) return true;
  if (settings.showThumbnails !== false && !row.image) return true;
  if (settings.showReleaseDate !== false && !row.release) return true;
  if (row.price || row.free || row.comingSoon || row.priceKnown) return false;
  return settings.showPrices !== false;
}

/** Merge a late detail into a row without overriding page-derived values. */
function applyDetail(row, detail) {
  if (!row || !detail) return;
  if (!row.name) row.name = detail.name || '';
  if (!row.image) row.image = detail.image || '';
  if (!row.imageLarge) row.imageLarge = detail.imageLarge || '';
  if (!row.price && !row.priceKnown && !row.free && !row.comingSoon) row.price = detail.price ?? null;
  row.free = detail.free === true;
  row.comingSoon = detail.comingSoon === true;
  if (!row.release) row.release = detail.release ?? null;
}

function viewOf(state) {
  return {
    status: 'ready',
    rows: state.rows,
    total: state.rows.length,
    ownedCount: state.rows.filter((row) => row.owned).length,
    loggedIn: state.loggedIn,
    sort: state.sort,
    truncated: state.truncated,
    pending: state.detailsStarted && state.pendingIds.length > 0,
    loaded: state.loaded,
    pendingTotal: state.loaded + state.pendingIds.length,
    updatedAt: state.updatedAt,
  };
}

/** Fetch the remaining add-on details once, progressively patching their rows. */
function startDetails(state) {
  if (!state || state.detailsStarted || !state.pendingIds.length) return;
  state.detailsStarted = true;
  const { root, controller } = state;
  const settings = getSettings().dlc;
  setDlcProgress(root, state.loaded, state.loaded + state.pendingIds.length);
  void loadAddonDetails(state.pendingIds, {
    signal: controller.signal,
    onEach: (appid, detail) => {
      if (current !== state || !root.isConnected) return;
      const row = state.rows.find((entry) => entry.appid === appid);
      if (detail) {
        setCachedDlcDetail(appid, detail);
        applyDetail(row, detail);
      }
      state.loaded += 1;
      const index = state.pendingIds.indexOf(appid);
      if (index >= 0) state.pendingIds.splice(index, 1);
      if (row) updateDlcRow(root, row, settings);
      setDlcProgress(root, state.loaded, state.loaded + state.pendingIds.length);
    },
  }).then(() => {
    if (current !== state || !root.isConnected) return;
    state.updatedAt = Date.now();
    paintDlc(root, viewOf(state), settings, handlers(state.appid, root));
    setDlcUpdated(root, state.updatedAt);
  });
}

function handlers(appid, root) {
  return {
    onRefresh: () => void load(appid, root, { force: true }),
    onExpand: () => startDetails(current),
    onOpenImage: (rowAppid) => openAddonViewer(root, rowAppid),
  };
}

/** In-flight per-add-on detail requests (viewer image upgrades). */
const detailRequests = new Map();

/**
 * Detail of one add-on, cached or fetched once — used by the viewer to swap
 * the row capsule for the larger store image without loading every add-on.
 */
async function ensureAddonDetail(appid) {
  const cached = getCachedDlcDetail(appid);
  if (cached) return cached;
  const pending = detailRequests.get(appid);
  if (pending) return pending;
  const request = (async () => {
    try {
      const detail = await fetchAddonDetail(appid);
      setCachedDlcDetail(appid, detail);
      return detail;
    } catch (error) {
      logInfo('dlc', 'add-on detail failed', { appid, error: String(error?.message || error) });
      return null;
    } finally {
      detailRequests.delete(appid);
    }
  })();
  detailRequests.set(appid, request);
  return request;
}

/** Open the block's add-on images in the viewer, starting at one row. */
function openAddonViewer(root, rowAppid) {
  const images = [];
  let index = 0;
  const rows = root.querySelectorAll('.sp-dlc__row');
  for (let i = 0; i < rows.length; i += 1) {
    const image = rows[i].querySelector('.sp-dlc__thumb');
    if (!image) continue;
    if (Number(rows[i].dataset.spDlcAppid) === rowAppid) index = images.length;
    images.push({
      appid: Number(rows[i].dataset.spDlcAppid),
      src: image.dataset.spViewerSrc || image.src,
      title: rows[i].querySelector('.sp-dlc__name')?.textContent || '',
      large: image.dataset.spViewerLarge === '1',
    });
  }
  if (!images.length) return;
  const settings = getSettings().dlc;
  openViewer({
    images,
    index,
    loop: settings.viewerLoop !== false,
    thumbnails: settings.viewerThumbnails !== false,
    resolveImage: async (image) => {
      if (image.large) return null;
      const detail = await ensureAddonDetail(image.appid);
      if (!detail?.imageLarge) return null;
      image.large = true;
      return detail.imageLarge;
    },
  });
}

async function load(appid, root, { force } = {}) {
  const state = current;
  if (!state || state.root !== root) return;
  const settings = getSettings().dlc;
  const signal = state.controller.signal;
  paintDlc(root, { ...viewOf(state), status: 'loading' }, settings, handlers(appid, root));

  let base = force ? null : getCachedDlcBase(appid);
  if (!base) {
    try {
      base = await fetchGameAddons(appid, { signal });
      setCachedDlcBase(appid, base);
    } catch (error) {
      if (signal.aborted || current !== state) return;
      logError(Codes.DLC_REQUEST, 'failed to load add-on list', {
        appid,
        error: String(error?.message || error),
      });
      paintDlc(root, { ...viewOf(state), status: 'error' }, settings, handlers(appid, root));
      return;
    }
  }
  if (current !== state || !root.isConnected) return;

  const prefill = readAddonSection();
  let owned = force ? null : getCachedOwnedApps();
  if (!owned) {
    try {
      owned = await fetchOwnedApps({ signal });
      setCachedOwnedApps(owned);
    } catch (error) {
      if (signal.aborted || current !== state) return;
      logError(Codes.DLC_OWNED, 'failed to read owned apps', {
        error: String(error?.message || error),
      });
      owned = { loggedIn: false, ids: [] };
    }
  }
  if (current !== state || !root.isConnected) return;

  const ids = base.dlcIds.slice(0, MAX_DLC_ITEMS);
  const ownedSet = new Set(owned.ids);
  state.loggedIn = owned.loggedIn;
  state.truncated = base.dlcIds.length > ids.length;
  state.rows = ids.map((id) => buildRow(id, {
    detail: getCachedDlcDetail(id),
    prefill: prefill.get(id),
    owned: ownedSet.has(id),
  }));
  state.pendingIds = state.rows.filter((row) => needsDetail(row, settings)).map((row) => row.appid);
  state.loaded = 0;
  state.detailsStarted = false;
  state.updatedAt = Date.now();

  paintDlc(root, viewOf(state), settings, handlers(appid, root));
  if (!state.pendingIds.length) {
    setDlcUpdated(root, state.updatedAt);
    return;
  }
  if (!root.classList.contains('is-collapsed')) startDetails(state);
}

function mount(appid) {
  teardown();
  const settings = getSettings().dlc;
  const root = createDlcRoot();
  setDlcCollapsed(root, settings.collapsed === true);
  if (!placeGameBlock(root, resolveGameAnchor(settings.position))) {
    logWarn(Codes.NO_ANCHOR, 'no anchor for add-on content', { appid, url: location.href });
    return;
  }
  current = {
    appid,
    root,
    controller: new AbortController(),
    rows: [],
    pendingIds: [],
    loaded: 0,
    detailsStarted: false,
    loggedIn: false,
    truncated: false,
    sort: settings.sort,
    updatedAt: 0,
  };
  void load(appid, root);
}

/** Reconcile the block with the current URL and settings. */
export function applyDlcSettings() {
  const { dlc } = getSettings();
  const appid = isGamePageUrl(location.href) ? parseAppId(location.href) : null;
  if (!dlc.enabled || !appid) {
    teardown();
    return;
  }
  mount(appid);
}

let dlcSubscribed = false;

export function initDlcFeature() {
  loadDlcCache();
  applyDlcSettings();
  if (dlcSubscribed) return;
  dlcSubscribed = true;
  on('settings:dlc', applyDlcSettings);
  // Region bypass replaces the document without changing the URL, so the
  // navigation watcher never fires — remount into the fresh anchors here.
  on('region:injected', applyDlcSettings);
  watchStoreNavigation(() => applyDlcSettings());
}
