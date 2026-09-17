import { MAX_CONCURRENT_REQUESTS } from '../core/constants.js';
import { t } from '../i18n/index.js';
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
import { isOwnUi, resolveTargetLanguage } from '../utils/dom.js';
import {
  buildTranslateButton,
  setButtonLoading,
  TranslatableNode,
} from './ui/controller.js';

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

/* ------------------------------------------------------------------ */
/* Grouped scopes: one master button per scope drives every controller  */
/* ------------------------------------------------------------------ */

/**
 * Scopes with `grouped: true` hide per-element buttons (the controller
 * never inserts its own) and share a single master button placed before
 * the first match. One page shows one guide, so the group is simply every
 * live controller of the scope in the document.
 */
const groupButtons = new Map();

function liveGroupControllers(target) {
  const live = [];
  forEachTargetElement(target, (element) => {
    const controller = controllers.get(element);
    if (controller && controller.attached && !controller.destroyed) live.push(controller);
  });
  return live;
}

function removeGroupButton(targetId) {
  groupButtons.get(targetId)?.button.remove();
  groupButtons.delete(targetId);
}

function onGroupButtonClick(target) {
  const live = liveGroupControllers(target);
  if (!live.length) {
    removeGroupButton(target.id);
    return;
  }
  if (live.some((controller) => controller.state === 'loading')) return;
  if (live.some((controller) => controller.state !== 'done')) {
    for (const controller of live) {
      if (controller.state === 'idle' || controller.state === 'error') void controller.translate();
    }
  } else {
    for (const controller of live) controller.renderOriginal();
  }
  updateGroupButton(target);
}

function ensureGroupButton(target, live) {
  let group = groupButtons.get(target.id);
  if (!group) {
    const { button, label } = buildTranslateButton(`sp-group-${target.id}`);
    button.classList.add('sp-translate-btn--above');
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      onGroupButtonClick(target);
    });
    group = { target, button, label };
    group.update = () => updateGroupButton(target);
    groupButtons.set(target.id, group);
  }
  for (const controller of live) {
    if (!controller.group) controller.group = group;
  }
  if (!group.button.isConnected && live.length) {
    live[0].element.insertAdjacentElement('beforebegin', group.button);
  }
  return group;
}

function updateGroupButton(target) {
  const live = liveGroupControllers(target);
  const group = groupButtons.get(target.id);
  if (!live.length) {
    if (group) removeGroupButton(target.id);
    return;
  }
  const active = group ?? ensureGroupButton(target, live);
  for (const controller of live) {
    if (!controller.group) controller.group = active;
  }
  if (!active.button.isConnected) {
    live[0].element.insertAdjacentElement('beforebegin', active.button);
  }
  const hasError = live.some((controller) => controller.state === 'error');
  if (live.some((controller) => controller.state === 'loading')) {
    active.button.classList.remove('sp-translate-btn--error');
    setButtonLoading(active.button, true);
    active.label.textContent = t('translate.loadingShort');
  } else {
    setButtonLoading(active.button, false);
    active.button.classList.toggle('sp-translate-btn--error', hasError);
    if (live.every((controller) => controller.state === 'done')) {
      active.label.textContent = t('translate.original');
    } else if (hasError) {
      active.label.textContent = t('translate.retry');
    } else {
      active.label.textContent = t('translate.button');
    }
  }
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
      if (isOwnUi(element)) continue;
      if (controllers.has(element)) continue;
      const controller = new TranslatableNode(element);
      controller.scopeId = target.id;
      controller.placeButton = target.placeButton ?? null;
      controller.grouped = target.grouped === true;
      controller.attach(translation, translateTexts);
      if (!controller.attached) continue;
      controllers.set(element, controller);
      if (controller.grouped) {
        controller.setVisible();
        if (translation.showCached !== false) {
          const cached = lookupBatchCache(translation, controller.blockTexts);
          if (cached !== null) controller.renderCached(cached);
        }
        if (translation.trigger === 'auto' && controller.state === 'idle') {
          void controller.translate();
        }
        continue;
      }
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
    if (target.grouped) updateGroupButton(target);
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
    if (!enabledIds.has(target.id)) {
      forEachTargetElement(target, destroyController);
      removeGroupButton(target.id);
    }
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
    if (target.grouped) updateGroupButton(target);
  }
}

function pruneAll() {
  for (const target of listTargets()) {
    forEachTargetElement(target, destroyController);
    removeGroupButton(target.id);
  }
}

let engineInitialized = false;

export function initTranslationEngine() {
  if (engineInitialized) return;
  engineInitialized = true;
  loadMemoryCache();
  on('settings:translation', applyTranslationSettings);
  // Guest regional content arrives without navigation or scan roots —
  // rescan explicitly (the WeakMap dedupes live controllers).
  on('region:injected', () => scanForTranslatable(document));
  window.addEventListener('scroll', scheduleVisibilityCheck, { passive: true });
  window.addEventListener('resize', scheduleVisibilityCheck);
}
