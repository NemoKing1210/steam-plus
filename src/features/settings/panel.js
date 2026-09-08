import { SCRIPT_NAME, getDefaults } from '../../core/constants.js';
import { configureLocale } from '../../i18n/index.js';
import { emit } from '../../core/bus.js';
import { getSettings, saveSettings } from '../../core/settings.js';
import { el } from '../../utils/dom.js';
import { t } from '../../i18n/index.js';
import { paintCachePane } from './tabs/cache-pane.js';
import { clearTranslationCache } from '../../translation/cache.js';
import { confirmDialog } from './confirm.js';
import { showToast } from '../../ui/toast.js';
import { getIconSvg, refreshSegmented } from './controls.js';

/**
 * Settings panel shell in the style of steam-gamestatus: sticky header with
 * title + close, a home screen listing the settings pages vertically, a
 * scrollable body with a per-page back crumb, and a sticky footer with
 * Reset / Cancel / Save. Pages render into a mutable draft; nothing is
 * persisted until Save.
 */
const pages = new Map();
let activePageId = null;
let panelOpen = false;
let draft = null;
let escapeListenerInstalled = false;

export function getScriptVersion() {
  try {
    if (typeof GM_info !== 'undefined' && GM_info.script?.version) {
      return GM_info.script.version;
    }
  } catch {
    /* sandbox without GM_info */
  }
  return '';
}

function installEscapeClose() {
  if (escapeListenerInstalled) return;
  escapeListenerInstalled = true;
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !panelOpen) return;
    if (activePageId) showHome();
    else togglePanel(false);
  });
}

export function registerPage(page) {
  if (!page?.id || typeof page.renderInto !== 'function') return;
  pages.set(page.id, page);
}

function buildHomeView() {
  const home = el('div', 'sp-panel__view sp-panel__home');
  const list = el('nav', 'sp-panel__nav');
  list.setAttribute('aria-label', t('menu.settings'));

  for (const [id, page] of pages) {
    const item = el('button', 'sp-panel__nav-item');
    item.type = 'button';

    if (page.icon && getIconSvg(page.icon)) {
      const icon = el('span', 'sp-panel__nav-icon');
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = getIconSvg(page.icon);
      item.appendChild(icon);
    }

    const text = el('span', 'sp-panel__nav-text');
    text.appendChild(el('span', 'sp-panel__nav-title', t(page.titleKey)));
    if (page.descKey) {
      text.appendChild(el('span', 'sp-panel__nav-desc', t(page.descKey)));
    }
    item.appendChild(text);

    if (id === 'cache') {
      const badge = el('span', 'sp-panel__tab-badge');
      badge.dataset.spCacheTabBadge = '';
      item.appendChild(badge);
    }
    item.appendChild(el('span', 'sp-panel__nav-chevron', '›'));

    item.addEventListener('click', () => switchPanelPage(id));
    list.appendChild(item);
  }

  home.appendChild(list);
  return home;
}

function buildPageView(id) {
  const page = pages.get(id);
  if (!page) return buildHomeView();

  const view = el('div', 'sp-panel__view sp-panel__page');
  const crumb = el('div', 'sp-panel__crumb');
  const back = el('button', 'sp-panel__back', `‹ ${t('panel.back')}`);
  back.type = 'button';
  back.setAttribute('aria-label', t('panel.back'));
  back.addEventListener('click', showHome);
  crumb.append(back, el('span', 'sp-panel__crumb-title', t(page.titleKey)));
  view.appendChild(crumb);

  const content = el('div', 'sp-panel__page-content');
  page.renderInto(content, draft);
  view.appendChild(content);
  return view;
}

function mountView(body, view, dir) {
  body.dataset.spDir = dir;
  body.replaceChildren(view);
  body.scrollTop = 0;
}

function renderCurrentView() {
  const overlay = document.getElementById('sp-panel-overlay');
  if (!overlay || !draft) return;
  const body = overlay.querySelector('.sp-panel__body');
  const view = activePageId ? buildPageView(activePageId) : buildHomeView();
  mountView(body, view, activePageId ? 'fwd' : 'back');
  paintCachePane(overlay);
  requestAnimationFrame(() => refreshSegmented(overlay));
}

export function showHome() {
  activePageId = null;
  renderCurrentView();
}

export function switchPanelPage(id) {
  const overlay = document.getElementById('sp-panel-overlay');
  if (!overlay || !pages.has(id) || !draft || id === activePageId) return;
  activePageId = id;
  renderCurrentView();
}

function persistPanelForm() {
  if (!draft) return;
  const previousTarget = getSettings().translation.targetLanguage;
  saveSettings({
    language: draft.language,
    translation: draft.translation,
    gamepage: draft.gamepage,
    prices: draft.prices,
    region: draft.region,
    toasts: draft.toasts,
  });
  configureLocale(draft.language);
  emit('settings:language', draft.language);
  emit('settings:translation');
  emit('settings:gamepage');
  emit('settings:prices');
  emit('settings:region');
  if (draft.translation.targetLanguage !== previousTarget) {
    clearTranslationCache();
    showToast({
      type: 'success',
      title: t('toast.saved'),
      message: t('toast.cacheCleared'),
    });
  } else {
    showToast({ type: 'success', title: t('toast.saved') });
  }
}

function ensurePanel() {
  if (document.getElementById('sp-panel-overlay')) return;

  const overlay = el('div', 'sp-panel-overlay');
  overlay.id = 'sp-panel-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'presentation');

  const panel = el('div', 'sp-panel');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', t('menu.settings'));

  const header = el('div', 'sp-panel__header');
  const titleBlock = el('div');
  const titleRow = el('div', 'sp-panel__title-row');
  titleRow.appendChild(el('div', 'sp-panel__title', SCRIPT_NAME));
  const version = getScriptVersion();
  if (version) titleRow.appendChild(el('span', 'sp-panel__version', `v${version}`));
  titleBlock.appendChild(titleRow);
  titleBlock.appendChild(el('div', 'sp-panel__subtitle', t('panel.subtitle')));
  header.appendChild(titleBlock);
  const closeButton = el('button', 'sp-panel__close', '×');
  closeButton.type = 'button';
  closeButton.dataset.sp = 'close';
  closeButton.setAttribute('aria-label', t('common.close'));
  header.appendChild(closeButton);

  const body = el('div', 'sp-panel__body');

  const footer = el('div', 'sp-panel__footer');
  const footerActions = el('div', 'sp-panel__footer-actions');
  const resetButton = el('button', 'sp-button sp-button--danger', t('common.reset'));
  resetButton.type = 'button';
  resetButton.dataset.sp = 'reset';
  resetButton.style.marginRight = 'auto';
  const cancelButton = el('button', 'sp-button sp-button--ghost', t('common.cancel'));
  cancelButton.type = 'button';
  cancelButton.dataset.sp = 'close';
  const saveButton = el('button', 'sp-button', t('common.save'));
  saveButton.type = 'button';
  saveButton.dataset.sp = 'save';
  footerActions.append(resetButton, cancelButton, saveButton);
  footer.appendChild(footerActions);

  panel.append(header, body, footer);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      togglePanel(false);
      return;
    }
    if (event.target.closest?.('[data-sp="close"]')) {
      togglePanel(false);
      return;
    }
    if (event.target.closest?.('[data-sp="save"]')) {
      persistPanelForm();
      togglePanel(false);
      return;
    }
    if (event.target.closest?.('[data-sp="reset"]')) {
      void confirmDialog({
        title: t('common.reset'),
        message: t('reset.confirm'),
        confirmLabel: t('common.reset'),
      }).then((confirmed) => {
        if (!confirmed || !draft) return;
        draft = getDefaults();
        renderCurrentView();
      });
      return;
    }
    const listToggle = event.target.closest?.('[data-sp="cache-list-toggle"]');
    if (listToggle) {
      event.preventDefault();
      const expanded = listToggle.getAttribute('aria-expanded') === 'true';
      listToggle.setAttribute('aria-expanded', String(!expanded));
      const list = overlay.querySelector('[data-sp-cache-list]');
      if (list) list.hidden = expanded;
      return;
    }
    const removeButton = event.target.closest?.('[data-sp="cache-remove"]');
    if (removeButton) {
      event.preventDefault();
      paintCachePane(overlay, { removeKey: removeButton.dataset.spCacheKey });
    }
  });
}

export function togglePanel(force) {
  ensurePanel();
  const overlay = document.getElementById('sp-panel-overlay');
  if (!overlay) return;
  installEscapeClose();

  panelOpen = typeof force === 'boolean' ? force : !panelOpen;
  overlay.hidden = !panelOpen;
  document.getElementById('sp-settings-btn')?.classList.toggle('is-open', panelOpen);
  setBodyScrollLocked(panelOpen);

  if (panelOpen) {
    draft = JSON.parse(JSON.stringify(getSettings()));
    activePageId = null;
    renderCurrentView();
  } else {
    draft = null;
  }
}

/** @type {{ y: number, pad: string } | null} */
let scrollLockState = null;

function isEventInsidePanelScroller(target) {
  const body = document.querySelector('#sp-panel-overlay .sp-panel__body');
  return !!(body && target instanceof Node && body.contains(target));
}

function onModalScrollGuard(event) {
  if (!panelOpen) return;
  if (isEventInsidePanelScroller(event.target)) return;
  event.preventDefault();
}

function setBodyScrollLocked(locked) {
  const root = document.documentElement;
  const body = document.body;

  if (locked) {
    if (scrollLockState) return;
    const y = window.scrollY || root.scrollTop || body.scrollTop || 0;
    const pad = Math.max(0, window.innerWidth - root.clientWidth);
    scrollLockState = { y, pad: body.style.paddingRight };
    root.classList.add('sp-modal-open');
    if (pad) body.style.paddingRight = `${pad}px`;
    body.style.top = `-${y}px`;
    document.addEventListener('wheel', onModalScrollGuard, { passive: false, capture: true });
    document.addEventListener('touchmove', onModalScrollGuard, { passive: false, capture: true });
    return;
  }

  if (!scrollLockState) {
    root.classList.remove('sp-modal-open');
    return;
  }

  const { y, pad } = scrollLockState;
  scrollLockState = null;
  document.removeEventListener('wheel', onModalScrollGuard, { capture: true });
  document.removeEventListener('touchmove', onModalScrollGuard, { capture: true });
  root.classList.remove('sp-modal-open');
  body.style.top = '';
  body.style.paddingRight = pad;
  window.scrollTo(0, y);
}
