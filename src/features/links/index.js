import { on } from '../../core/bus.js';
import { getSettings } from '../../core/settings.js';
import { Codes, logWarn } from '../../core/debug.js';
import { isGamePageUrl } from '../gamepage/blocks.js';
import { watchStoreNavigation } from '../../utils/navigation.js';
import { placeGameBlock, resolveGameAnchor } from '../../utils/gameAnchors.js';
import { getGameContext, parseAppId } from './template.js';
import { createLinksRoot, paintLinks } from './ui.js';

let current = null;

function teardown() {
  current?.remove();
  current = null;
}

/** Reconcile the block with the current URL and settings. */
export function applyLinksSettings() {
  const { links } = getSettings();
  const appid = isGamePageUrl(location.href) ? parseAppId(location.href) : null;
  if (links?.enabled === false || !appid) {
    teardown();
    return;
  }
  teardown();
  const items = Array.isArray(links?.items) ? links.items.filter((item) => item?.enabled !== false && item?.name && item?.url) : [];
  if (!items.length) return;
  const root = createLinksRoot();
  if (!placeGameBlock(root, resolveGameAnchor(links?.position))) {
    logWarn(Codes.NO_ANCHOR, 'no anchor for external links', { appid, url: location.href });
    return;
  }
  const painted = paintLinks(root, {
    context: getGameContext(),
    items,
    openInNewTab: links?.openInNewTab,
  });
  if (!painted) {
    root.remove();
    return;
  }
  current = root;
}

let linksSubscribed = false;

export function initLinksFeature() {
  applyLinksSettings();
  if (linksSubscribed) return;
  linksSubscribed = true;
  on('settings:links', applyLinksSettings);
  on('region:injected', applyLinksSettings);
  watchStoreNavigation(() => applyLinksSettings());
}
