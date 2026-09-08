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
 * Whether the element belongs to Steam Plus UI (and must be skipped
 * by content scans).
 */
export function isOwnUi(node) {
  return node instanceof Element && !!node.closest('.sp-panel-overlay, .sp-confirm-overlay, .sp-toasts, .sp-settings-btn, .sp-translation, .sp-translate-btn, .sp-prices');
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
