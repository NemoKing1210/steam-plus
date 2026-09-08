/**
 * Translation target registry.
 *
 * A target describes a content scope on Steam pages:
 * {
 *   id: 'gameDescription',       // key in settings.translation.scopes
 *   labelKey: 'scope.gameDescription',
 *   selector: 'css, selector, list', // elements containing text to translate
 *   placeButton, // optional (button, element) => void override for below-mode placement
 * }
 *
 * The engine scans the DOM for `selector` matches and attaches
 * controllers to each element. Add a new scope by registering a new
 * target — the settings UI picks it up automatically.
 */
const targets = new Map();

export function registerTarget(target) {
  if (!target || !target.id || typeof target.selector !== 'string') {
    throw new Error('[Steam Plus] invalid translation target');
  }
  targets.set(target.id, target);
}

export function getTarget(id) {
  return targets.get(id) || null;
}

export function listTargets() {
  return [...targets.values()];
}
