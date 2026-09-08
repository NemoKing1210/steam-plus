import { on } from '../../core/bus.js';
import { getSettings } from '../../core/settings.js';
import { watchStoreNavigation } from '../../utils/navigation.js';
import {
  GAMEPAGE_STYLE_ID,
  buildGamepageCss,
  isGamePageUrl,
} from './blocks.js';

/**
 * Hiding is pure CSS: a single style element carries
 * `display: none !important` rules for the blocks the user disabled.
 * Stylesheets keep applying to nodes Steam injects later (including
 * SPA-style re-renders), so no DOM observer is needed here — only a
 * URL watcher, because store navigation swaps pages without reloads.
 */
export function applyGamepageSettings() {
  const { gamepage } = getSettings();
  const css = gamepage?.enabled === false ? '' : buildGamepageCss(gamepage?.hidden);
  const wanted = isGamePageUrl(location.href) && css ? css : '';
  const existing = document.getElementById(GAMEPAGE_STYLE_ID);
  if (!wanted) {
    existing?.remove();
    return;
  }
  if (existing?.textContent === wanted) return;
  const style = existing ?? document.createElement('style');
  style.id = GAMEPAGE_STYLE_ID;
  style.textContent = wanted;
  if (!existing) {
    (document.head ?? document.documentElement).appendChild(style);
  }
}

function watchUrlChanges() {
  watchStoreNavigation(() => applyGamepageSettings());
}

export function initGamepageFeature() {
  applyGamepageSettings();
  on('settings:gamepage', applyGamepageSettings);
  watchUrlChanges();
}
