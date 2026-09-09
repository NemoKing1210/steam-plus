import { REGION_BOOT_TIMEOUT_MS } from '../../core/constants.js';
import { el } from '../../utils/dom.js';
import { t } from '../../i18n/index.js';
import { bypassRegionBlock } from './bypass.js';

export function extractStoreRoot(doc) {
  return (
    doc.querySelector?.('.game_page_background') ||
    doc.querySelector?.('#tabletGrid') ||
    doc.querySelector?.('.page_content_ctn[itemscope]') ||
    doc.querySelector?.('#game_highlights')?.closest('.page_content_ctn') ||
    null
  );
}

export function getContentMount() {
  return (
    document.querySelector('#responsive_page_template_content') ||
    document.querySelector('.responsive_page_content') ||
    document.querySelector('#error_box')?.closest('.page_content')?.parentElement ||
    document.body
  );
}

/**
 * Replace the error document with the guest HTML. Parser-inserted scripts
 * then boot exactly like a real page load (execution order, jQuery ready,
 * the store React islands), which surgical node injection cannot reproduce:
 * the store bundle scans for its feature targets once at startup and never
 * hydrates nodes added afterwards.
 */
export function rewriteDocumentWithGuest(html) {
  // GM_addStyle runs once per script evaluation, so rescue our stylesheet:
  // open() wipes the whole document and it would never come back.
  const keep = [...document.querySelectorAll('style')].filter((node) => node.textContent?.includes('--sp-'));
  document.open();
  document.write(html);
  document.close();
  const head = document.head || document.documentElement;
  keep.forEach((node) => head.appendChild(node.cloneNode(true)));
}

/** Resolve once the rewritten document fires window load (bounded). */
export function waitForBootComplete(timeoutMs = REGION_BOOT_TIMEOUT_MS) {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
      return;
    }
    const done = () => resolve();
    window.addEventListener('load', done, { once: true });
    setTimeout(done, Math.max(timeoutMs, 0));
  });
}

export function stripGuestSignedOutChrome(root, { signedIn = false } = {}) {
  if (!signedIn) return;
  const actions = root.querySelector('#queueActionsCtn') || root.querySelector('.queue_actions_ctn');
  actions?.querySelectorAll(':scope > p').forEach((p) => {
    if (p.querySelector('a[href*="/login"]')) p.remove();
  });
  root.querySelectorAll('.banner_open_in_steam').forEach((node) => node.remove());
}

export function createRegionBanner({ viaProxy = false } = {}) {
  const banner = el('div', 'sp-region-banner');
  banner.setAttribute('role', 'status');
  const badge = el('span', 'sp-region-banner__badge', t('region.bannerBadge'));
  const body = el('div', 'sp-region-banner__body');
  body.appendChild(el('div', 'sp-region-banner__title', t('region.bannerTitle')));
  const details = [t('region.bannerBody')];
  if (viaProxy) details.push(t('region.bannerViaProxy'));
  body.appendChild(el('div', 'sp-region-banner__details', details.join(' · ')));
  const reload = el('button', 'sp-button sp-button--ghost sp-region-banner__reload', t('region.reload'));
  reload.type = 'button';
  reload.addEventListener('click', () => bypassRegionBlock());
  return banner;
}

export function insertBannerIntoGrid(root, banner) {
  const scope = root?.querySelector ? root : document;
  const grid =
    scope.querySelector?.('#tabletGrid') ||
    scope.querySelector?.('.tablet_grid') ||
    (root?.id === 'tabletGrid' || root?.classList?.contains('tablet_grid') ? root : null);
  if (grid) {
    grid.insertBefore(banner, grid.firstChild);
    return;
  }
  const mount =
    scope.querySelector?.('.page_content_ctn') ||
    scope.querySelector?.('.game_page_background') ||
    scope.body ||
    scope.documentElement ||
    scope;
  mount.insertBefore(banner, mount.firstChild);
}

export function showRegionLoader() {
  hideRegionLoader();
  document.querySelectorAll('.sp-region-status, .sp-region-offer').forEach((node) => node.remove());
  const overlay = el('div', 'sp-region-loader');
  overlay.id = 'sp-region-loader';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');
  overlay.setAttribute('aria-busy', 'true');
  const card = el('div', 'sp-region-loader__card');
  card.appendChild(el('div', 'sp-region-loader__spinner'));
  card.appendChild(el('div', 'sp-region-loader__text', t('region.loading')));
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-visible'));
}

export function hideRegionLoader() {
  document.getElementById('sp-region-loader')?.remove();
}

export function showRegionStatus(mount, kind, message, { onRetry = null } = {}) {
  document.querySelectorAll('.sp-region-status, .sp-region-offer').forEach((node) => node.remove());
  hideRegionLoader();
  const box = el('div', `sp-region-status sp-region-status--${kind}`);
  box.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  box.appendChild(el('div', 'sp-region-status__text', message));
  if (onRetry) {
    const retry = el('button', 'sp-button sp-region-status__retry', t('region.retry'));
    retry.type = 'button';
    retry.addEventListener('click', onRetry);
    box.appendChild(retry);
  }
  mount.appendChild(box);
}

export function showRegionOffer() {
  const mount = getContentMount();
  if (!mount || mount.querySelector('.sp-region-offer')) return;
  const box = el('div', 'sp-region-offer');
  box.setAttribute('role', 'status');
  box.appendChild(el('div', 'sp-region-offer__text', t('region.offer')));
  const action = el('button', 'sp-button sp-region-offer__button', t('region.offerButton'));
  action.type = 'button';
  action.addEventListener('click', () => bypassRegionBlock());
  box.appendChild(action);
  mount.appendChild(box);
}
