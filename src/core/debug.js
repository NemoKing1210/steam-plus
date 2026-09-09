/**
 * Structured console diagnostics for Steam Plus.
 *
 * Every failure carries a stable `SP-####` code: grep the codebase for the
 * code to jump straight to the throw site. Errors and warnings always
 * print; `logInfo` traces print only in verbose mode, enabled via
 * `localStorage.setItem('sp_debug', '1')` or `window.__SP_DEBUG__ = true`
 * in the page console.
 */

export const Codes = {
  /** A bus listener threw while handling an event. */
  BUS_LISTENER: 'SP-1001',
  /** Persisting settings to GM storage failed. */
  SETTINGS_PERSIST: 'SP-1002',
  /** No provider is registered for the configured provider id. */
  UNKNOWN_PROVIDER: 'SP-1101',
  /** Provider request failed (network, timeout, HTTP status). */
  REQUEST_FAILED: 'SP-1110',
  /** Provider answered 200 but the payload was unusable. */
  BAD_RESPONSE: 'SP-1111',
  /** Translating one content block failed (logged once, with cause). */
  TRANSLATE_FAILED: 'SP-1201',
  /** Reading the translation cache from GM storage failed. */
  CACHE_LOAD: 'SP-1210',
  /** Writing the translation cache to GM storage failed. */
  CACHE_PERSIST: 'SP-1211',
  /** A target selector threw during a DOM scan. */
  BAD_SELECTOR: 'SP-1220',
  /** A regional price request failed (network, timeout, HTTP status). */
  PRICE_REQUEST: 'SP-1310',
  /** A regional price response was unusable. */
  PRICE_RESPONSE: 'SP-1311',
  /** Exchange rates could not be loaded from any provider. */
  FX_RATES: 'SP-1313',
  /** Reading or writing the regional price cache failed. */
  PRICE_CACHE: 'SP-1312',
  /** Region bypass guest request failed (network, timeout, HTTP status). */
  REGION_REQUEST: 'SP-1410',
  /** Region bypass guest response held no usable store content. */
  REGION_RESPONSE: 'SP-1411',
  /** Region bypass run failed (logged once at the outermost point). */
  REGION_FAILED: 'SP-1413',
  /** Guest content transplant failed (rewrite fallback takes over). */
  TRANSPLANT: 'SP-1414',
};

const BADGE_STYLE =
  'background:#8a3030;color:#fff;border-radius:2px;padding:1px 6px;font-weight:bold';
const WARN_BADGE_STYLE =
  'background:#6b5416;color:#ffe1a8;border-radius:2px;padding:1px 6px;font-weight:bold';
const CODE_STYLE = 'font-weight:bold';
const INFO_STYLE = 'color:#8f98a0';

export function isVerbose() {
  try {
    if (typeof window !== 'undefined' && window.__SP_DEBUG__ === true) return true;
  } catch {
    /* sandbox without window access */
  }
  try {
    return localStorage.getItem('sp_debug') === '1';
  } catch {
    return false;
  }
}

/** Build an Error carrying a stable code plus structured details. */
export function fail(code, message, details, cause) {
  const error = new Error(`[${code}] ${message}`);
  error.code = code;
  if (details !== undefined) error.details = details;
  if (cause !== undefined) error.cause = cause;
  return error;
}

/** Short single-line preview of a translated text for log context. */
export function previewText(text, maxLength = 120) {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function print(printer, badgeStyle, code, message, details) {
  if (details === undefined) {
    printer(`%cSteam Plus%c ${code} ${message}`, badgeStyle, CODE_STYLE);
  } else {
    printer(`%cSteam Plus%c ${code} ${message}`, badgeStyle, CODE_STYLE, details);
  }
}

/** Always printed: a failure the user or developer must see. */
export function logError(code, message, details) {
  print(console.error, BADGE_STYLE, code, message, details);
}

/** Always printed: degraded behavior that recovered on its own. */
export function logWarn(code, message, details) {
  print(console.warn, WARN_BADGE_STYLE, code, message, details);
}

/** Printed only in verbose mode: traces for development. */
export function logInfo(area, message, details) {
  if (!isVerbose()) return;
  if (details === undefined) {
    console.info(`%cSteam Plus · ${area}%c ${message}`, INFO_STYLE, '');
  } else {
    console.info(`%cSteam Plus · ${area}%c ${message}`, INFO_STYLE, '', details);
  }
}
