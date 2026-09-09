import { on } from '../../core/bus.js';
import { getSettings } from '../../core/settings.js';
import { logInfo } from '../../core/debug.js';
import { isGamePageUrl } from '../gamepage/blocks.js';
import { watchStoreNavigation } from '../../utils/navigation.js';
import { getGameContext, parseAppId } from './template.js';
import { createLinksRoot, paintLinks } from './ui.js';

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
  if (!placeRoot(root, resolveAnchor(links?.position))) {
    logInfo('links', 'no anchor for external links', { appid });
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
