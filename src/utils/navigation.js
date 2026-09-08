/**
 * Store SPA navigation watcher.
 *
 * Steam swaps store pages without full reloads, so features that depend on
 * the current URL subscribe here instead of patching history themselves.
 */
const listeners = new Set();
let installed = false;

function notify() {
  for (const fn of [...listeners]) {
    try {
      fn(location.href);
    } catch {
      /* one bad listener never breaks navigation */
    }
  }
}

function install() {
  if (installed) return;
  installed = true;
  for (const method of ['pushState', 'replaceState']) {
    try {
      const original = history[method];
      if (typeof original !== 'function' || original.__spWrapped) continue;
      const wrapped = function (...args) {
        const result = original.apply(this, args);
        notify();
        return result;
      };
      wrapped.__spWrapped = true;
      history[method] = wrapped;
    } catch {
      /* history is not patchable here */
    }
  }
  window.addEventListener('popstate', notify);
  window.addEventListener('hashchange', notify);
}

/** Subscribe to store URL changes. Returns an unsubscribe function. */
export function watchStoreNavigation(fn) {
  install();
  listeners.add(fn);
  return () => listeners.delete(fn);
}
