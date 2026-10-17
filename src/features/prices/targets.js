import { PRICE_TARGETS_KEY, PRICE_TARGETS_MAX_ENTRIES } from '../../core/constants.js';
import { Codes, logWarn } from '../../core/debug.js';

let targets = null;

function load() {
  if (targets) return targets;
  targets = new Map();
  try {
    const raw = GM_getValue(PRICE_TARGETS_KEY, null);
    if (!raw || typeof raw !== 'object') return targets;
    for (const [appid, entry] of Object.entries(raw)) {
      if (Number.isFinite(entry?.amount) && entry.amount > 0 && /^[A-Z]{3}$/.test(entry.currency)) {
        targets.set(appid, { amount: entry.amount, currency: entry.currency, ts: Number(entry.ts) || 0 });
      }
    }
  } catch (error) {
    logWarn(Codes.PRICE_TARGETS, 'failed to read price targets', { error });
  }
  return targets;
}

function persist() {
  const newest = [...load()].sort((a, b) => b[1].ts - a[1].ts).slice(0, PRICE_TARGETS_MAX_ENTRIES);
  targets = new Map(newest);
  try {
    GM_setValue(PRICE_TARGETS_KEY, Object.fromEntries(newest));
  } catch (error) {
    logWarn(Codes.PRICE_TARGETS, 'failed to persist price targets', { error });
  }
}

/** Saved target `{ amount, currency }` in major units of a store currency, or null. */
export function getPriceTarget(appid) {
  const entry = load().get(String(appid));
  return entry ? { amount: entry.amount, currency: entry.currency } : null;
}

export function setPriceTarget(appid, amount, currency) {
  load().set(String(appid), { amount, currency: String(currency).toUpperCase(), ts: Date.now() });
  persist();
}

export function clearPriceTarget(appid) {
  if (load().delete(String(appid))) persist();
}
