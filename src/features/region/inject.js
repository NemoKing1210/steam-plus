import { el } from '../../utils/dom.js';
import { t } from '../../i18n/index.js';
import { isHostLoggedIn } from './detect.js';
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

export function clearErrorPageContent(template) {
  template
    .querySelectorAll(
      [
        '.page_header_ctn',
        '#error_box',
        '.sp-region-shell',
        '.sp-region-status',
        '.sp-region-offer',
        '.sp-region-banner',
        '.sp-region-injected',
        '.game_page_background',
        '#tabletGrid',
        '.page_content_ctn',
      ].join(', '),
    )
    .forEach((node) => node.remove());
  document.querySelectorAll('#app_tagging_modal').forEach((node) => node.remove());
  template.querySelectorAll('.pageheader').forEach((h2) => {
    if (/oops/i.test(h2.textContent || '')) {
      (h2.closest('.page_content') || h2.parentElement)?.remove();
    }
  });
}

export function applyStoreBodyClasses() {
  document.body.classList.remove('redeemwalletcode');
  for (const cls of ['app', 'game_bg', 'menu_background_overlap', 'application']) {
    document.body.classList.add(cls);
  }
}

export function absolutizeUrls(root) {
  root.querySelectorAll('[src], [href], source[srcset]').forEach((node) => {
    for (const attr of ['src', 'href']) {
      const val = node.getAttribute(attr);
      if (
        !val ||
        val.startsWith('#') ||
        val.startsWith('javascript:') ||
        val.startsWith('data:') ||
        val.startsWith('blob:')
      ) {
        continue;
      }
      try {
        node.setAttribute(attr, new URL(val, 'https://store.steampowered.com/').href);
      } catch {
        /* keep original */
      }
    }
    const srcset = node.getAttribute('srcset');
    if (srcset) {
      try {
        node.setAttribute(
          'srcset',
          srcset
            .split(',')
            .map((part) => {
              const bits = part.trim().split(/\s+/);
              bits[0] = new URL(bits[0], 'https://store.steampowered.com/').href;
              return bits.join(' ');
            })
            .join(', '),
        );
      } catch {
        /* keep original */
      }
    }
  });
  root.querySelectorAll('img[data-src]').forEach((img) => {
    if (!img.getAttribute('src')) {
      try {
        img.setAttribute('src', new URL(img.getAttribute('data-src'), 'https://store.steampowered.com/').href);
      } catch {
        img.setAttribute('src', img.getAttribute('data-src'));
      }
    }
  });
}

export function stylesheetKey(href) {
  try {
    const url = new URL(href, location.href);
    return (url.pathname.split('/').pop() || '').toLowerCase() || url.href;
  } catch {
    return String(href || '').toLowerCase();
  }
}

export function detectSteamCssBase() {
  const storeLink = [...document.querySelectorAll('link[rel="stylesheet"]')]
    .map((link) => link.href)
    .find((href) => /\/css\/v6\/store\.css/i.test(href) || /\/store\.css(\?|$)/i.test(href));
  if (storeLink) return storeLink.replace(/store\.css(\?.*)?$/i, '');
  return 'https://store.fastly.steamstatic.com/public/css/v6/';
}

export function resolveSteamStylesheet(fileName, cssV6Base) {
  if (
    [
      'motiva_sans.css',
      'shared_global.css',
      'buttons.css',
      'shared_responsive.css',
      'jquery-ui-1.7.2.custom.css',
    ].includes(fileName)
  ) {
    return `https://store.fastly.steamstatic.com/public/shared/css/${fileName}`;
  }
  if (fileName === 'apphub.css') {
    return 'https://community.fastly.steamstatic.com/public/css/skin_1/apphub.css';
  }
  return `${cssV6Base}${fileName}`;
}

export function ensureStoreStylesheets(remoteDoc) {
  const head = document.head || document.documentElement;
  const existing = new Set(
    [...document.querySelectorAll('link[rel="stylesheet"]')].map((link) => stylesheetKey(link.href)),
  );
  const baseFromPage = detectSteamCssBase();
  const toAdd = [];
  remoteDoc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const raw = link.getAttribute('href');
    if (!raw || /^(chrome-extension|moz-extension|blob):/i.test(raw)) return;
    if (/error\.css/i.test(raw)) return;
    let href;
    try {
      href = new URL(raw, 'https://store.steampowered.com/').href;
    } catch {
      return;
    }
    if (!/steamstatic\.com|steampowered\.com/i.test(href) || href.includes('Steam_files')) {
      const name = raw.split('/').pop().split('?')[0];
      if (!name || !/\.css$/i.test(name)) return;
      href = resolveSteamStylesheet(name, baseFromPage);
    }
    const key = stylesheetKey(href);
    if (!key || existing.has(key)) return;
    existing.add(key);
    toAdd.push(href);
  });
  for (const name of [
    'store_game_shared.css',
    'game.css',
    'store_background_shared.css',
    'apphub.css',
    'user_reviews.css',
    'recommended.css',
    'user_reviews_rewards.css',
    'game_mob.css',
  ]) {
    const href = resolveSteamStylesheet(name, baseFromPage);
    const key = stylesheetKey(href);
    if (existing.has(key)) continue;
    existing.add(key);
    toAdd.push(href);
  }
  for (const href of toAdd) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = href;
    link.dataset.spRegionStyle = '1';
    head.appendChild(link);
  }
  return toAdd.length;
}

export function isExecutableScriptTag(script) {
  const type = (script.getAttribute('type') || 'text/javascript').trim().toLowerCase();
  return (
    !type ||
    type === 'text/javascript' ||
    type === 'application/javascript' ||
    type === 'text/jscript'
  );
}

export function isBlockedScriptSrc(src) {
  return (
    /^(chrome-extension|moz-extension|blob):/i.test(src || '') ||
    /alikeguardian|steamdb\.info\/ext/i.test(src || '')
  );
}

export function isBlockedScriptCode(code) {
  return /alikeguardian|ag_changes|chrome-extension:\/\//i.test(code || '');
}

function scriptKey(href) {
  try {
    const url = new URL(href, location.href);
    const parts = url.pathname.split('/').filter(Boolean);
    return (parts.slice(-3).join('/') || url.href).toLowerCase();
  } catch {
    return String(href || '').toLowerCase();
  }
}

function loadExternalScript(href) {
  return new Promise((resolve) => {
    const node = document.createElement('script');
    node.src = href;
    node.async = false;
    node.dataset.spRegionScript = '1';
    node.onload = () => resolve();
    node.onerror = () => resolve();
    (document.head || document.documentElement).appendChild(node);
  });
}

export function runInlineScript(code) {
  const node = document.createElement('script');
  node.dataset.spRegionScript = '1';
  node.textContent = code;
  (document.body || document.documentElement).appendChild(node);
}

function waitForPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

export async function waitForRegionStylesheets() {
  const links = [...document.querySelectorAll('link[data-sp-region-style="1"]')];
  await Promise.all(
    links.map(
      (link) =>
        new Promise((resolve) => {
          if (link.sheet) {
            resolve();
            return;
          }
          const done = () => resolve();
          link.addEventListener('load', done, { once: true });
          link.addEventListener('error', done, { once: true });
          if (link.sheet) done();
        }),
    ),
  );
  await waitForPaint();
}

export function fixupSteamWidgets() {
  runInlineScript(`
(function () {
if (typeof $J === 'undefined') return;
function fitTags() {
  if (typeof AdjustVisibleAppTags === 'function') {
    $J('.glance_tags.popular_tags, .popular_tags[data-appid], .your_tags[data-appid]').each(function () {
      AdjustVisibleAppTags($J(this));
    });
  }
  $J(window).trigger('resize');
  $J('.glance_tags.popular_tags').each(function () {
    var $tags = $J(this).children('.app_tag:not(.add_button)');
    if ($tags.length && $tags.filter(':visible').length === 0) {
      $tags.show();
    }
  });
}
fitTags();
setTimeout(fitTags, 100);
setTimeout(fitTags, 400);
})();
`);
}

function stripGuestSignedOutChrome(root) {
  if (!isHostLoggedIn()) return;
  const actions = root.querySelector('#queueActionsCtn') || root.querySelector('.queue_actions_ctn');
  actions?.querySelectorAll(':scope > p').forEach((p) => {
    if (p.querySelector('a[href*="/login"]')) p.remove();
  });
  root.querySelectorAll('.banner_open_in_steam').forEach((node) => node.remove());
}

function injectGuestAppTaggingModal(remoteDoc) {
  document.querySelectorAll('#app_tagging_modal').forEach((node) => node.remove());
  const modal = remoteDoc.querySelector('#app_tagging_modal');
  if (!modal) return;
  const node = document.importNode(modal, true);
  node.querySelectorAll('script').forEach((child) => child.remove());
  absolutizeUrls(node);
  (document.body || document.documentElement).appendChild(node);
}

function collectGuestInlineScripts(remoteDoc, wrapper) {
  const codes = [];
  const seen = new Set();
  const push = (code) => {
    const trimmed = (code || '').trim();
    if (!trimmed || seen.has(trimmed) || isBlockedScriptCode(trimmed)) return;
    seen.add(trimmed);
    codes.push(trimmed);
  };
  remoteDoc.querySelectorAll('script:not([src])').forEach((script) => {
    if (!isExecutableScriptTag(script)) return;
    const code = script.textContent || '';
    const isStoreBoot =
      /GStoreItemData|g_bUseOldReviewDisplay|g_rgAppKeywords|g_rgAppData/i.test(code) &&
      !/home_tab_section|InitTopSellersControls|g_rgDelayedLoadImages/i.test(code);
    const isAppTagInit = /InitAppTagModal\s*\(/i.test(code);
    if (isStoreBoot || isAppTagInit) push(code);
  });
  wrapper.querySelectorAll('script').forEach((script) => {
    if (!isExecutableScriptTag(script)) return;
    if (script.getAttribute('src')) return;
    push(script.textContent || '');
  });
  return codes;
}

export function createRegionBanner({ fromCache = false, viaProxy = false } = {}) {
  const banner = el('div', 'sp-region-banner');
  banner.setAttribute('role', 'status');
  const badge = el('span', 'sp-region-banner__badge', t('region.bannerBadge'));
  const body = el('div', 'sp-region-banner__body');
  body.appendChild(el('div', 'sp-region-banner__title', t('region.bannerTitle')));
  const details = [t('region.bannerBody')];
  if (viaProxy) details.push(t('region.bannerViaProxy'));
  if (fromCache) details.push(t('region.bannerViaCache'));
  body.appendChild(el('div', 'sp-region-banner__details', details.join(' · ')));
  const reload = el('button', 'sp-button sp-button--ghost sp-region-banner__reload', t('region.reload'));
  reload.type = 'button';
  reload.addEventListener('click', () => bypassRegionBlock({ forceRefresh: true }));
  banner.append(badge, body, reload);
  return banner;
}

export function insertBannerIntoGrid(root, banner) {
  const grid =
    root.querySelector?.('#tabletGrid') ||
    root.querySelector?.('.tablet_grid') ||
    (root.id === 'tabletGrid' || root.classList?.contains('tablet_grid') ? root : null);
  if (grid) {
    grid.insertBefore(banner, grid.firstChild);
    return;
  }
  const mount =
    root.querySelector?.('.page_content_ctn') ||
    root.querySelector?.('.game_page_background') ||
    root;
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

export function docTitle(root) {
  const name =
    root.querySelector?.('.apphub_AppName')?.textContent ||
    root.querySelector?.('#appHubAppName')?.textContent;
  return name ? `${name.trim()} on Steam` : null;
}

export async function ensureStoreScripts(remoteDoc) {
  const existing = new Set(
    [...document.querySelectorAll('script[src]')].map((node) => scriptKey(node.src)).filter(Boolean),
  );
  const toLoad = [];
  remoteDoc.querySelectorAll('script[src]').forEach((script) => {
    if (!isExecutableScriptTag(script)) return;
    const raw = script.getAttribute('src');
    if (!raw || isBlockedScriptSrc(raw)) return;
    let href;
    try {
      href = new URL(raw, 'https://store.steampowered.com/').href;
    } catch {
      return;
    }
    if (!/steamstatic\.com|steampowered\.com/i.test(href)) return;
    if (/\/javascript\/applications\//i.test(href)) return;
    const key = scriptKey(href);
    if (!key || existing.has(key)) return;
    existing.add(key);
    toLoad.push(href);
  });
  for (const href of toLoad) {
    await loadExternalScript(href);
  }
  return toLoad.length;
}

export async function injectStoreRoot(remoteGame, remoteDoc, { fromCache = false, viaProxy = false } = {}) {
  const template = getContentMount();
  clearErrorPageContent(template);
  applyStoreBodyClasses();
  ensureStoreStylesheets(remoteDoc);

  const shell = el('div', 'sp-region-shell');
  const wrapper = el('div', 'sp-region-injected');
  if (remoteGame.classList.contains('game_page_background')) {
    wrapper.appendChild(document.importNode(remoteGame, true));
  } else if (remoteGame.id === 'tabletGrid' || remoteGame.classList.contains('tablet_grid')) {
    const bg = el('div', 'game_page_background game');
    bg.appendChild(document.importNode(remoteGame, true));
    wrapper.appendChild(bg);
  } else {
    const bg = el('div', 'game_page_background game');
    const grid = el('div', 'tablet_grid');
    grid.id = 'tabletGrid';
    grid.appendChild(document.importNode(remoteGame, true));
    bg.appendChild(grid);
    wrapper.appendChild(bg);
  }

  const inlineScripts = collectGuestInlineScripts(remoteDoc, wrapper);
  wrapper
    .querySelectorAll('script, .alike_sub, #ag_changes_button, .ag_changes')
    .forEach((node) => node.remove());
  absolutizeUrls(wrapper);
  stripGuestSignedOutChrome(wrapper);
  insertBannerIntoGrid(wrapper, createRegionBanner({ fromCache, viaProxy }));

  shell.appendChild(wrapper);
  template.appendChild(shell);
  injectGuestAppTaggingModal(remoteDoc);

  const title = docTitle(wrapper);
  if (title) document.title = title;

  await waitForRegionStylesheets();
  await ensureStoreScripts(remoteDoc);
  await waitForPaint();
  runInlineScript(
    '(function () { if (typeof $J !== "undefined") $J(window).off("resize.VisibleAppTags"); })();',
  );
  for (const code of inlineScripts) {
    try {
      runInlineScript(code);
    } catch {
      /* one guest snippet never breaks the page */
    }
  }
  fixupSteamWidgets();
}
