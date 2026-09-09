import { on } from '../../core/bus.js';
import { getSettings } from '../../core/settings.js';
import { watchStoreNavigation } from '../../utils/navigation.js';
import { isRegionBlockedPage, isSupportedStoreUrl } from './detect.js';
import { bypassRegionBlock, isRegionInjected } from './bypass.js';
import { showRegionOffer } from './inject.js';

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

export function initRegionFeature() {
  evaluate(location.href);
  if (regionSubscribed) return;
  regionSubscribed = true;
  on('settings:region', () => evaluate(location.href));
  watchStoreNavigation((url) => evaluate(url));
}
