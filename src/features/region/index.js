import { on } from '../../core/bus.js';
import { getSettings } from '../../core/settings.js';
import { logInfo } from '../../core/debug.js';
import { watchStoreNavigation } from '../../utils/navigation.js';
import { isRegionBlockedPage, isSupportedStoreUrl } from './detect.js';
import { bypassRegionBlock, isRegionInjected } from './bypass.js';
import { OTHER_SITE_SELECTOR, showRegionOffer, syncOtherSiteReloadButton } from './inject.js';
const LEGACY_GUEST_CACHE_KEY = 'sp_region_cache_v1';

let bypassedUrl = null;

function buttonState(url) {
  const settings = getSettings().region;
  if (!settings || settings.enabled === false) return { show: false, reloaded: false };
  if (!isSupportedStoreUrl(url)) return { show: false, reloaded: false };
  if (bypassedUrl !== null && url === bypassedUrl) return { show: true, reloaded: !isRegionBlockedPage() };
  if (!isRegionInjected() && isRegionBlockedPage()) return { show: true, reloaded: false };
  return { show: false, reloaded: false };
}

function evaluate(url) {
  if (bypassedUrl !== null && url !== bypassedUrl) bypassedUrl = null;
  const { show, reloaded } = buttonState(url);
  syncOtherSiteReloadButton(show, { reloaded });
  if (!show || !isRegionBlockedPage() || isRegionInjected()) return;
  if (getSettings().region.mode === 'manual') {
    showRegionOffer();
    return;
  }
  void bypassRegionBlock();
}

export function refreshOtherSiteButton() {
  if (!document.querySelector(OTHER_SITE_SELECTOR)) return;
  const { show, reloaded } = buttonState(location.href);
  syncOtherSiteReloadButton(show, { reloaded });
}

let regionSubscribed = false;
let guestCacheWiped = false;

function wipeGuestCacheOnce() {
  if (guestCacheWiped) return;
  guestCacheWiped = true;
  try {
    if (typeof GM_deleteValue === 'function') GM_deleteValue(LEGACY_GUEST_CACHE_KEY);
    else GM_setValue(LEGACY_GUEST_CACHE_KEY, null);
  } catch (error) {
    logInfo('region', 'failed to drop legacy guest cache', { error: String(error) });
  }
}

export function initRegionFeature() {
  wipeGuestCacheOnce();
  evaluate(location.href);
  if (regionSubscribed) return;
  regionSubscribed = true;
  on('settings:region', () => {
    if (getSettings().region.showBanner !== true) document.querySelector('.sp-region-banner')?.remove();
    evaluate(location.href);
  });
  on('region:injected', (payload) => {
    bypassedUrl = payload?.url || location.href;
    evaluate(location.href);
  });
  watchStoreNavigation((url) => evaluate(url));
}
