import './styles/tokens.css';
import './styles/app.css';
import { SCAN_DEBOUNCE_MS } from './core/constants.js';
import { emit, on } from './core/bus.js';
import { configureLocale } from './i18n/index.js';
import { getSettings } from './core/settings.js';
import { debounce, isOwnUi } from './utils/dom.js';
import { initSettingsFeature } from './features/settings/index.js';
import { initGamepageFeature } from './features/gamepage/index.js';
import { initPricesFeature } from './features/prices/index.js';
import { initLinksFeature } from './features/links/index.js';
import { initRegionFeature } from './features/region/index.js';
import {
  createRegionBanner,
  insertBannerIntoGrid,
  stripGuestSignedOutChrome,
  waitForBootComplete,
} from './features/region/inject.js';
import { persistCacheNow } from './translation/cache.js';
import { persistPriceCacheNow } from './features/prices/cache.js';
import {
  initTranslationEngine,
  scanForTranslatable,
} from './translation/engine.js';

const pendingScanNodes = [];
let hasInitialScan = false;
let scanObserver = null;
let pagehideHooked = false;

function runScan() {
  const nodes = pendingScanNodes.splice(0, pendingScanNodes.length);
  if (!hasInitialScan) {
    hasInitialScan = true;
    nodes.length = 0;
  }
  const roots = nodes.length ? nodes : [document];
  for (const node of roots) {
    if (isOwnUi(node)) continue;
    scanForTranslatable(node);
  }
}

const scheduleScan = debounce(runScan, SCAN_DEBOUNCE_MS);

function attachScanObserver() {
  scanObserver?.disconnect();
  scanObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.closest('.sp-panel-overlay, .sp-confirm-overlay, .sp-toasts, .sp-settings-btn, .sp-prices, .sp-links, .sp-region-banner, .sp-region-offer, .sp-region-status, .sp-region-loader')) continue;
      }
    }
    if (pendingScanNodes.length) scheduleScan();
  });
  if (document.body) {
    scanObserver.observe(document.body, { childList: true, subtree: true });
  }
}

/**
 * Boot content features into the live document. Re-runs after a region
 * bypass replaces the document: feature inits are re-runnable (one-shot
 * subscriptions are once-guarded inside), dead-document state is dropped.
 */
function bootDocument() {
  pendingScanNodes.length = 0;
  hasInitialScan = false;
  initSettingsFeature();
  initGamepageFeature();
  initPricesFeature();
  initLinksFeature();
  initRegionFeature();
  attachScanObserver();
  scheduleScan();
}

/**
 * The region bypass replaced the whole document with guest HTML. Wait for
 * its natural boot, attach our features to the fresh document, then notify
 * content features through the uniform `region:injected` contract.
 */
async function handleRegionRewrote({ viaProxy = false, signedIn = false, transplanted = false } = {}) {
  if (!transplanted) {
    await waitForBootComplete();
    stripGuestSignedOutChrome(document, { signedIn });
  }
  bootDocument();
  if (getSettings().region.showBanner === true) insertBannerIntoGrid(document, createRegionBanner({ viaProxy }));
  // The URL never changes, so content features would never notice the
  // fresh DOM on their own — notify them explicitly (bus isolates
  // listener failures, so one broken feature cannot block the rest).
  emit('region:injected', { url: location.href, viaProxy });
}

function init() {
  configureLocale(getSettings().language);
  if (!pagehideHooked) {
    pagehideHooked = true;
    window.addEventListener('pagehide', persistCacheNow);
    window.addEventListener('pagehide', persistPriceCacheNow);
    on('region:rewrote', (payload) => {
      void handleRegionRewrote(payload);
    });
  }
  bootDocument();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
