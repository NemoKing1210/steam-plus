import { on } from '../../core/bus.js';
import { getSettings } from '../../core/settings.js';
import { logInfo } from '../../core/debug.js';
import { watchStoreNavigation } from '../../utils/navigation.js';
import { isRegionBlockedPage, isSupportedStoreUrl } from './detect.js';
import { bypassRegionBlock, isRegionInjected } from './bypass.js';
import { showRegionOffer } from './inject.js';
const LEGACY_GUEST_CACHE_KEY = 'sp_region_cache_v1';

function evaluate(url) {
  const settings = getSettings().region;
  if (!settings || settings.enabled === false) return;
  if (!isSupportedStoreUrl(url)) return;
  if (isRegionInjected()) return;
  if (!isRegionBlockedPage()) return;
  if (settings.mode === 'manual') {
    showRegionOffer();
    return;
  }
  void bypassRegionBlock();
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
  watchStoreNavigation((url) => evaluate(url));
}
