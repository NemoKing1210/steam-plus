/**
 * Small DOM helpers shared by all features.
 */
export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Wraps a DOM-building callback with an element that we can find later.
 */
export function append(parent, node) {
  parent.appendChild(node);
  return node;
}

/** Debounce helper. */
export function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Iterate a DOM collection (NodeList, HTMLCollection, `addedNodes`) or any
 * array-like by index. DOM collections are only iterable in newer engines —
 * and not in the one Steam's embedded browser ships — so `for...of` over
 * them throws "is not iterable" there.
 */
export function eachNode(collection, callback) {
  if (!collection) return;
  for (let index = 0; index < collection.length; index += 1) callback(collection[index], index);
}

/**
 * Copy a DOM collection (NodeList, HTMLCollection, `childNodes`) or any
 * array-like into a plain array. Also needed on engines whose collections
 * are not iterable, where `[...collection]` throws.
 */
export function toArray(collection) {
  const items = [];
  if (!collection) return items;
  for (let index = 0; index < collection.length; index += 1) items.push(collection[index]);
  return items;
}

/**
 * Whether the element belongs to Steam Plus UI (and must be skipped
 * by content scans).
 */
export function isOwnUi(node) {
  return node instanceof Element && !!node.closest('.sp-panel-overlay, .sp-confirm-overlay, .sp-toasts, .sp-settings-btn, .sp-translation, .sp-translate-btn, .sp-prices, .sp-links, .sp-dlc, .sp-viewer-overlay, .sp-region-banner, .sp-region-offer, .sp-region-status, .sp-region-loader, .sp-region-othersite-reload, .sp-search-overlay, .sp-searchbox');
}

/**
 * Resolves the translation target language: explicit setting or the
 * Steam page language (html lang attr) falling back to the browser.
 */
export function resolveTargetLanguage(targetSetting) {
  if (targetSetting && targetSetting !== 'auto') return targetSetting;
  const htmlLang = document.documentElement.lang;
  if (htmlLang && htmlLang.length >= 2) return htmlLang.slice(0, 2).toLowerCase();
  const browser = (navigator.language || 'en').toLowerCase();
  return browser.split('-')[0];
}
