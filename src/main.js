import './styles/tokens.css';
import './styles/app.css';
import { SCAN_DEBOUNCE_MS } from './core/constants.js';
import { configureLocale } from './i18n/index.js';
import { getSettings } from './core/settings.js';
import { debounce, isOwnUi } from './utils/dom.js';
import { initSettingsFeature } from './features/settings/index.js';
import { initGamepageFeature } from './features/gamepage/index.js';
import { initPricesFeature } from './features/prices/index.js';
import { persistCacheNow } from './translation/cache.js';
import { persistPriceCacheNow } from './features/prices/cache.js';
import {
  initTranslationEngine,
  scanForTranslatable,
} from './translation/engine.js';

const pendingScanNodes = [];
let hasInitialScan = false;

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

function init() {
  configureLocale(getSettings().language);
  initSettingsFeature();
  initGamepageFeature();
  initPricesFeature();
  initTranslationEngine();
  window.addEventListener('pagehide', persistCacheNow);
  window.addEventListener('pagehide', persistPriceCacheNow);
  scheduleScan();

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.closest('.sp-panel-overlay, .sp-confirm-overlay, .sp-toasts, .sp-settings-btn, .sp-prices')) continue;
        pendingScanNodes.push(node);
      }
    }
    if (pendingScanNodes.length) scheduleScan();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
