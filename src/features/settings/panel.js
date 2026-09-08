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
import { refreshSegmented } from './controls.js';

/**
 * Tabbed settings panel shell in the style of steam-gamestatus: sticky
 * header with a subtitle, tab strip, scrollable body and a sticky footer
 * with Reset / Cancel / Save. Tabs render into a mutable draft; nothing is
 * persisted until Save.
 */
const tabs = new Map();
let activeTabId = null;
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
    if (event.key !== 'Escape') return;
    if (panelOpen) togglePanel(false);
  });
}

export function registerTab(tab) {
  if (!tab?.id || typeof tab.renderInto !== 'function') return;
  tabs.set(tab.id, tab);
  if (!activeTabId) activeTabId = tab.id;
}

function renderTabsHeader(header) {
  const indicator = header.querySelector('.sp-panel__tabs-indicator')
    ?? el('span', 'sp-panel__tabs-indicator');
  indicator.setAttribute('aria-hidden', 'true');
  header.replaceChildren();
  for (const [id, tab] of tabs) {
    const tabButton = el('button', 'sp-panel__tab', t(tab.titleKey));
    tabButton.type = 'button';
    tabButton.setAttribute('role', 'tab');
    tabButton.dataset.spTab = id;
    const active = id === activeTabId;
    tabButton.classList.toggle('is-active', active);
    tabButton.setAttribute('aria-selected', String(active));
    if (id === 'cache') {
      tabButton.appendChild(el('span', 'sp-panel__tab-badge', ''));
      tabButton.querySelector('.sp-panel__tab-badge').dataset.spCacheTabBadge = '';
    }
    tabButton.addEventListener('click', () => switchPanelTab(id));
    header.appendChild(tabButton);
  }
  header.appendChild(indicator);
  positionTabIndicator();
}

function positionTabIndicator() {
  const overlay = document.getElementById('sp-panel-overlay');
  const header = overlay?.querySelector('.sp-panel__tabs');
  const indicator = header?.querySelector('.sp-panel__tabs-indicator');
  const active = header?.querySelector('.sp-panel__tab.is-active');
  if (!header || !indicator || !active) return;
  requestAnimationFrame(() => {
    const offset = active.offsetLeft - header.scrollLeft;
    indicator.style.width = `${active.offsetWidth}px`;
    indicator.style.transform = `translateX(${offset}px)`;
  });
}

function renderPanes(body) {
  body.replaceChildren();
  for (const [id, tab] of tabs) {
    const pane = el('div', 'sp-panel__tabpane');
    pane.dataset.spPane = id;
    pane.setAttribute('role', 'tabpanel');
    if (id !== activeTabId) pane.hidden = true;
    tab.renderInto(pane, draft);
    body.appendChild(pane);
  }
}

function fillPanelForm() {
  const overlay = document.getElementById('sp-panel-overlay');
  if (!overlay || !draft) return;
  const body = overlay.querySelector('.sp-panel__body');
  body.dataset.spDir = 'fwd';
  renderTabsHeader(overlay.querySelector('.sp-panel__tabs'));
  renderPanes(body);
  paintCachePane(overlay);
  requestAnimationFrame(() => refreshSegmented(overlay));
}

function persistPanelForm() {
  if (!draft) return;
  const previousTarget = getSettings().translation.targetLanguage;
  saveSettings({ language: draft.language, translation: draft.translation });
  configureLocale(draft.language);
  emit('settings:language', draft.language);
  emit('settings:translation');
  // Cached translations belong to the previous target language.
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

  const tabsHeader = el('div', 'sp-panel__tabs');
  tabsHeader.setAttribute('role', 'tablist');

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

  panel.append(header, tabsHeader, body, footer);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  window.addEventListener('resize', () => {
    if (panelOpen) positionTabIndicator();
  });

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
        fillPanelForm();
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

export function switchPanelTab(id) {
  const overlay = document.getElementById('sp-panel-overlay');
  if (!overlay || !tabs.has(id) || id === activeTabId) return;
  const order = [...tabs.keys()];
  const body = overlay.querySelector('.sp-panel__body');
  if (body) body.dataset.spDir = order.indexOf(id) > order.indexOf(activeTabId) ? 'fwd' : 'back';
  activeTabId = id;
  overlay.querySelectorAll('[data-sp-tab]').forEach((tab) => {
    const active = tab.dataset.spTab === id;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  overlay.querySelectorAll('[data-sp-pane]').forEach((pane) => {
    pane.hidden = pane.dataset.spPane !== id;
  });
  positionTabIndicator();
  requestAnimationFrame(() => refreshSegmented(overlay));
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
    fillPanelForm();
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
