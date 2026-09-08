import { MAX_CONCURRENT_REQUESTS } from '../core/constants.js';
import { on } from '../core/bus.js';
import { Codes, fail, logInfo } from '../core/debug.js';
import { getSettings } from '../core/settings.js';
import './targets/all.js';
import './providers/google-free.js';
import { getProvider } from './providers/index.js';
import { listTargets } from './targets/index.js';
import {
  getCachedTranslation,
  loadMemoryCache,
  setCachedTranslation,
} from './cache.js';
import { resolveTargetLanguage } from '../utils/dom.js';
import { TranslatableNode } from './ui/controller.js';

/** @type {WeakMap<Element, TranslatableNode>} */
const controllers = new WeakMap();

/** Controllers waiting to enter the viewport (pruned on every check). */
const pendingVisible = new Set();
/** px beyond the viewport that still counts as "nearby". */
const VISIBILITY_MARGIN = 500;
let visibilityCheckQueued = false;

/* ------------------------------------------------------------------ */
/* Request queue (concurrency limited)                                 */
/* ------------------------------------------------------------------ */

const queue = [];
let active = 0;

function enqueue(task) {
  return new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject });
    pump();
  });
}

function pump() {
  while (active < MAX_CONCURRENT_REQUESTS && queue.length > 0) {
    const { task, resolve, reject } = queue.shift();
    active += 1;
    task()
      .then(resolve, reject)
      .finally(() => {
        active -= 1;
        pump();
      });
  }
}

/* ------------------------------------------------------------------ */
/* Translation helper                                                  */
/* ------------------------------------------------------------------ */

function resolveProvider(id) {
  return getProvider(id);
}

/**
 * Translate several block texts with the configured provider, using the
 * per-block cache. Misses travel in small sequential groups so one rich
 * element cannot flood the provider with a burst of parallel requests.
 */
export function translateTexts(texts) {
  const { translation } = getSettings();
  const provider = resolveProvider(translation.provider);
  if (!provider) {
    return Promise.reject(
      fail(Codes.UNKNOWN_PROVIDER, `unknown translation provider "${translation.provider}"`, {
        provider: translation.provider,
      }),
    );
  }
  const to = resolveTargetLanguage(translation.targetLanguage);
  const results = new Array(texts.length).fill(null);
  const missIndexes = [];
  const missTexts = [];
  texts.forEach((text, index) => {
    const cached = getCachedTranslation(provider.id, to, text);
    if (cached !== null) results[index] = cached;
    else {
      missIndexes.push(index);
      missTexts.push(text);
    }
  });
  if (!missTexts.length) return Promise.resolve(results);
  const groups = [];
  for (let at = 0; at < missTexts.length; at += MAX_CONCURRENT_REQUESTS) {
    groups.push({ at, texts: missTexts.slice(at, at + MAX_CONCURRENT_REQUESTS) });
  }
  let chain = Promise.resolve();
  for (const group of groups) {
    chain = chain
      .then(() => enqueue(() => provider.translate(group.texts, { to })))
      .then((translated) => {
        group.texts.forEach((source, offset) => {
          const output = translated[offset] ?? '';
          results[missIndexes[group.at + offset]] = output;
          setCachedTranslation(provider.id, to, source, output);
        });
      });
  }
  return chain.then(() => results);
}

/**
 * Translate a single text with the configured provider, using the cache.
 */
export function translateText(text) {
  const { translation } = getSettings();
  const provider = resolveProvider(translation.provider);
  if (!provider) {
    return Promise.reject(
      fail(Codes.UNKNOWN_PROVIDER, `unknown translation provider "${translation.provider}"`, {
        provider: translation.provider,
      }),
    );
  }
  return translateTexts([text]).then((results) => results[0]);
}

/* ------------------------------------------------------------------ */
/* DOM scan                                                            */
/* ------------------------------------------------------------------ */

function isScopeEnabled(target, translationSettings) {
  return translationSettings.scopes[target.id] !== false;
}

function isNearViewport(element, margin = VISIBILITY_MARGIN) {
  try {
    const rect = element.getBoundingClientRect();
    const height = window.innerHeight || 0;
    return rect.bottom >= -margin && rect.top <= height + margin;
  } catch {
    return true;
  }
}

function revealNow(controller) {
  pendingVisible.delete(controller);
  const firstSeen = !controller.visible;
  controller.setVisible();
  if (
    firstSeen &&
    controller.state === 'idle' &&
    getSettings().translation.trigger === 'auto'
  ) {
    void controller.translate();
  }
}

function revealCheck(controller) {
  if (!controller.attached || controller.visible) return;
  if (isNearViewport(controller.element)) revealNow(controller);
  else pendingVisible.add(controller);
}

function runVisibilityCheck() {
  for (const controller of [...pendingVisible]) {
    if (!controller.element.isConnected || controller.destroyed) {
      pendingVisible.delete(controller);
      continue;
    }
    if (isNearViewport(controller.element)) revealNow(controller);
  }
}

function scheduleVisibilityCheck() {
  if (visibilityCheckQueued) return;
  visibilityCheckQueued = true;
  requestAnimationFrame(() => {
    visibilityCheckQueued = false;
    runVisibilityCheck();
  });
}

/** Sync cache read for the instant-cache setting (all blocks must hit). */
function lookupBatchCache(translation, texts) {
  if (!texts.length) return null;
  const provider = resolveProvider(translation.provider);
  if (!provider) return null;
  const to = resolveTargetLanguage(translation.targetLanguage);
  const results = texts.map((text) => getCachedTranslation(provider.id, to, text));
  return results.every((result) => result !== null) ? results : null;
}

/**
 * Scan `root` for translatable content and attach controllers.
 * Called from the main MutationObserver loop.
 */
export function scanForTranslatable(root) {
  const { translation } = getSettings();
  if (!translation.enabled || !(root instanceof Element || root instanceof Document)) {
    return;
  }
  for (const target of listTargets()) {
    if (!isScopeEnabled(target, translation)) continue;
    let elements;
    try {
      elements = root.querySelectorAll(target.selector);
    } catch {
      logInfo('scan', `ignoring invalid selector for scope "${target.id}"`, {
        scope: target.id,
        selector: target.selector,
      });
      continue;
    }
    for (const element of elements) {
      if (controllers.has(element)) continue;
      // Skip elements we created ourselves.
      if (element.closest('.sp-translation, .sp-translate-btn')) continue;
      const controller = new TranslatableNode(element);
      controller.scopeId = target.id;
      controller.placeButton = target.placeButton ?? null;
      controller.attach(translation, translateTexts);
      if (!controller.attached) continue;
      controllers.set(element, controller);
      if (translation.showCached !== false) {
        const cached = lookupBatchCache(translation, controller.blockTexts);
        if (cached !== null) {
          controller.renderCached(cached);
          revealNow(controller);
          continue;
        }
      }
      revealCheck(controller);
    }
  }
}

/**
 * Run `fn` for every element matching `target.selector` in the live
 * document. The controllers WeakMap is not iterable, so detached work
 * always re-queries known targets and lets GC drop dead nodes.
 */
function forEachTargetElement(target, fn) {
  let elements;
  try {
    elements = document.querySelectorAll(target.selector);
  } catch {
    return;
  }
  for (const element of elements) fn(element);
}

function destroyController(element) {
  const controller = controllers.get(element);
  if (controller) pendingVisible.delete(controller);
  controller?.destroy();
  controllers.delete(element);
}

/** Destroy controllers for scopes that are no longer enabled. */
function pruneDisabledScopes() {
  const { translation } = getSettings();
  const enabledIds = new Set(
    listTargets()
      .filter((target) => isScopeEnabled(target, translation))
      .map((target) => target.id),
  );
  for (const target of listTargets()) {
    if (!enabledIds.has(target.id)) forEachTargetElement(target, destroyController);
  }
}

/**
 * Bus listener for settings:translation: reconcile live controllers with the
 * new settings (full teardown when disabled).
 */
export function applyTranslationSettings() {
  const { translation } = getSettings();
  if (!translation.enabled) {
    // Full teardown: restore originals, remove buttons.
    pruneAll();
    return;
  }
  pruneDisabledScopes();
  scanForTranslatable(document);
  // Propagate display/trigger changes to live controllers.
  for (const target of listTargets()) {
    forEachTargetElement(target, (element) => {
      controllers.get(element)?.onConfigChange(translation);
    });
  }
}

function pruneAll() {
  for (const target of listTargets()) forEachTargetElement(target, destroyController);
}

export function initTranslationEngine() {
  loadMemoryCache();
  on('settings:translation', applyTranslationSettings);
  window.addEventListener('scroll', scheduleVisibilityCheck, { passive: true });
  window.addEventListener('resize', scheduleVisibilityCheck);
}
