import { on } from '../../core/bus.js';
import { getSettings } from '../../core/settings.js';
import { watchStoreNavigation } from '../../utils/navigation.js';
import { mountSearchBoxes, unmountSearchBoxes } from './box.js';
import { closeSearchOverlay, isSearchOverlayOpen } from './overlay.js';

function isStoreUrl(url) {
  try {
    return new URL(String(url)).hostname === 'store.steampowered.com';
  } catch {
    return false;
  }
}

function isSearchEnabled() {
  const region = getSettings().region;
  return region?.enabled !== false && region?.searchEnabled !== false;
}

function isEditable(target) {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return true;
  return target instanceof Element && (target.isContentEditable || target.tagName === 'SELECT');
}

function onKeyDown(event) {
  if (event.key !== '/' || event.ctrlKey || event.altKey || event.metaKey) return;
  if (!isStoreUrl(location.href) || !isSearchEnabled() || isSearchOverlayOpen()) return;
  if (isEditable(event.target)) return;
  event.preventDefault();
  mountSearchBoxes(document);
  document.querySelector('.sp-searchbox__input')?.focus?.();
}

let searchSubscribed = false;

export function initSearchFeature() {
  if (isStoreUrl(location.href)) mountSearchBoxes(document);
  if (searchSubscribed) return;
  searchSubscribed = true;
  document.addEventListener('keydown', onKeyDown);
  on('settings:region', () => {
    closeSearchOverlay();
    if (isSearchEnabled() && isStoreUrl(location.href)) mountSearchBoxes(document);
    else unmountSearchBoxes(document);
  });
  on('region:injected', () => {
    if (isStoreUrl(location.href)) mountSearchBoxes(document);
  });
  watchStoreNavigation((url) => {
    closeSearchOverlay();
    if (isStoreUrl(url)) mountSearchBoxes(document);
    else unmountSearchBoxes(document);
  });
}
