import { getDefaults, SCRIPT_NAME } from '../../core/constants.js';
import { getSettings } from '../../core/settings.js';
import { on } from '../../core/bus.js';
import { t } from '../../i18n/index.js';
import { registerPage, togglePanel } from './panel.js';
import { generalTab } from './tabs/general.js';
import { translationTab } from './tabs/translation.js';
import { gamepageTab } from './tabs/gamepage.js';
import { pricesTab } from './tabs/prices.js';
import { regionTab } from './tabs/region.js';
import { cacheTab } from './tabs/cache-pane.js';
import { aboutTab } from './tabs/about.js';

registerPage(generalTab);
registerPage(translationTab);
registerPage(gamepageTab);
registerPage(pricesTab);
registerPage(regionTab);
registerPage(cacheTab);
registerPage(aboutTab);

const BUTTON_ID = 'sp-settings-btn';

function waitForElement(selector, timeout = 20000) {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(document.querySelector(selector));
    }, timeout);
  });
}

function getAccountMenuBody() {
  return document.querySelector('#account_dropdown .popup_body.popup_menu');
}

function hideAccountDropdown() {
  if (typeof window.HideMenu === 'function') {
    try {
      window.HideMenu('account_pulldown', 'account_dropdown');
      return;
    } catch {
      /* fall through to manual hide */
    }
  }
  const dropdown = document.getElementById('account_dropdown');
  if (dropdown) {
    dropdown.style.display = 'none';
    dropdown.style.visibility = 'hidden';
  }
}

function onSettingsTriggerClick(event) {
  event.preventDefault();
  event.stopPropagation();
  hideAccountDropdown();
  togglePanel();
}

/**
 * Native-looking entry inside Steam's account dropdown (signed-in pages).
 * Steam styles `popup_menu_item`; we only add our own state class.
 */
function injectAccountMenuItem(menu) {
  const existing = document.getElementById(BUTTON_ID);
  if (existing) return existing;

  const item = document.createElement('a');
  item.id = BUTTON_ID;
  item.className = 'popup_menu_item sp-menu-item sp-settings-btn';
  item.href = '#';
  item.title = t('menu.settings');
  const label = document.createElement('span');
  label.textContent = t('menu.settings');
  item.appendChild(label);
  item.addEventListener('click', onSettingsTriggerClick);
  menu.appendChild(item);
  return item;
}

/** Compact Steam-blue header button used when there is no account dropdown. */
function injectHeaderFallback(host) {
  const existing = document.getElementById(BUTTON_ID);
  if (existing) return existing;

  const button = document.createElement('button');
  button.type = 'button';
  button.id = BUTTON_ID;
  button.className = 'sp-header-btn sp-settings-btn';
  button.title = t('menu.settings');
  button.innerHTML = `
    <span class="sp-header-btn__text"></span>
    <span class="sp-header-btn__dot" aria-hidden="true"></span>`;
  button.querySelector('.sp-header-btn__text').textContent =
    `${t('common.settings')} · ${SCRIPT_NAME}`;
  button.addEventListener('click', onSettingsTriggerClick);
  host.insertBefore(button, host.firstChild);
  updateSettingsButtonState();
  return button;
}

function isCustomized() {
  try {
    return JSON.stringify(getSettings()) !== JSON.stringify(getDefaults());
  } catch {
    return false;
  }
}

function updateSettingsButtonState() {
  const dot = document.querySelector(`#${BUTTON_ID}.sp-header-btn .sp-header-btn__dot`);
  if (!dot) return;
  const customized = isCustomized();
  dot.classList.toggle('is-on', customized);
  dot.title = customized ? t('common.on') : t('common.off');
}

export async function ensureSettingsButton() {
  const host = await waitForElement('#global_actions');
  if (!host || document.getElementById(BUTTON_ID)) {
    if (document.getElementById(BUTTON_ID)) updateSettingsButtonState();
    return document.getElementById(BUTTON_ID);
  }
  const menu = getAccountMenuBody();
  if (menu) return injectAccountMenuItem(menu);
  return injectHeaderFallback(host);
}

/** Watch Steam re-renders: keep one entry, prefer the account dropdown. */
let headerObserver = null;

export function observeHeader() {
  headerObserver?.disconnect();
  const observer = new MutationObserver(() => {
    const existing = document.getElementById(BUTTON_ID);
    const menu = getAccountMenuBody();
    if (existing?.classList.contains('sp-header-btn') && menu) {
      existing.remove();
      void ensureSettingsButton();
      return;
    }
    if (!existing && document.querySelector('#global_actions')) {
      void ensureSettingsButton();
    }
  });
  headerObserver = observer;
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

let settingsSubscribed = false;

export function initSettingsFeature() {
  void ensureSettingsButton();
  observeHeader();
  if (settingsSubscribed) return;
  settingsSubscribed = true;
  // Keep the header fallback dot in sync with persisted settings.
  on('settings:translation', updateSettingsButtonState);
  on('settings:gamepage', updateSettingsButtonState);
  on('settings:prices', updateSettingsButtonState);
  on('settings:language', updateSettingsButtonState);
  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand(t('menu.settings'), () => togglePanel(true));
  }
}
