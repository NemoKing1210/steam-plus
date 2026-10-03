import { t } from '../i18n/index.js';
import { el } from '../utils/dom.js';
import { lockPageScroll, unlockPageScroll } from '../utils/scrollLock.js';

/**
 * Fullscreen image viewer for injected content: fit-to-screen by default with
 * zoom, pan, rotate, a thumbnail strip and gallery navigation (ViewerJS-style,
 * Steam-styled). One instance; opening while open replaces the gallery.
 *
 * @typedef {{ src: string, title?: string, alt?: string }} ViewerImage
 */

const ROOT_ID = 'sp-viewer-overlay';
const ZOOM_STEP = 0.35;
const DOUBLE_CLICK_ZOOM = 2;
const SWIPE_DISTANCE = 60;
const ROTATION_STEP = 90;

const defaults = {
  images: [],
  index: 0,
  loop: true,
  thumbnails: true,
  minZoom: 1,
  maxZoom: 8,
  labels: null,
  resolveImage: null,
  onClose: null,
};

/** @type {ReturnType<typeof buildState> | null} */
let state = null;
let listenersInstalled = false;

function buildState(options) {
  // Copy into a plain array of this realm: the gallery may arrive as an
  // array-like, and every consumer below indexes it directly (no iterator
  // protocol), so a sandboxed or foreign array can never break the viewer.
  const source = Array.isArray(options.images) ? options.images : [];
  const images = [];
  for (let i = 0; i < source.length; i += 1) {
    const image = source[i];
    if (image && typeof image.src === 'string' && image.src) images.push(image);
  }
  return {
    images,
    index: Math.min(Math.max(0, Number(options.index) || 0), Math.max(0, images.length - 1)),
    opts: { ...defaults, ...options },
    zoom: 1,
    rotation: 0,
    offset: { x: 0, y: 0 },
    pointers: new Map(),
    drag: null,
    pinch: null,
    press: null,
    token: 0,
    focusReturn: document.activeElement instanceof HTMLElement ? document.activeElement : null,
  };
}

function label(key) {
  return state?.opts.labels?.[key] || t(`viewer.${key}`);
}

function parts() {
  const root = document.getElementById(ROOT_ID);
  return {
    root,
    dialog: root?.querySelector('.sp-viewer'),
    title: root?.querySelector('[data-sp-viewer="title"]'),
    counter: root?.querySelector('[data-sp-viewer="counter"]'),
    stage: root?.querySelector('[data-sp-viewer="stage"]'),
    image: root?.querySelector('[data-sp-viewer="image"]'),
    spinner: root?.querySelector('[data-sp-viewer="spinner"]'),
    status: root?.querySelector('[data-sp-viewer="status"]'),
    hint: root?.querySelector('[data-sp-viewer="hint"]'),
    thumbs: root?.querySelector('[data-sp-viewer="thumbs"]'),
    prev: root?.querySelector('[data-sp-viewer="prev"]'),
    next: root?.querySelector('[data-sp-viewer="next"]'),
  };
}

function toolButton(action, glyph, labelKey, extraClass = '') {
  const button = el('button', `sp-viewer__tool ${extraClass}`.trim(), glyph);
  button.type = 'button';
  button.dataset.spViewer = action;
  button.title = label(labelKey);
  button.setAttribute('aria-label', label(labelKey));
  return button;
}

function ensureOverlay() {
  const existing = document.getElementById(ROOT_ID);
  if (existing) return existing;

  const root = el('div', 'sp-viewer-overlay');
  root.id = ROOT_ID;
  root.hidden = true;

  const dialog = el('div', 'sp-viewer');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', t('viewer.title'));

  const bar = el('div', 'sp-viewer__bar');
  const meta = el('div', 'sp-viewer__meta');
  const title = el('span', 'sp-viewer__title', '');
  title.dataset.spViewer = 'title';
  const counter = el('span', 'sp-viewer__counter', '');
  counter.dataset.spViewer = 'counter';
  meta.append(title, counter);
  const tools = el('div', 'sp-viewer__tools');
  tools.append(
    toolButton('zoom-out', '−', 'zoomOut'),
    toolButton('zoom-in', '+', 'zoomIn'),
    el('span', 'sp-viewer__sep'),
    toolButton('rotate', '⟳', 'rotate'),
    toolButton('reset', '⤢', 'reset'),
    el('span', 'sp-viewer__sep'),
    toolButton('close', '×', 'close', 'sp-viewer__tool--close'),
  );
  bar.append(meta, tools);

  const stage = el('div', 'sp-viewer__stage');
  stage.dataset.spViewer = 'stage';
  const prev = el('button', 'sp-viewer__nav sp-viewer__nav--prev', '‹');
  prev.type = 'button';
  prev.dataset.spViewer = 'prev';
  prev.title = label('prev');
  prev.setAttribute('aria-label', label('prev'));
  const next = el('button', 'sp-viewer__nav sp-viewer__nav--next', '›');
  next.type = 'button';
  next.dataset.spViewer = 'next';
  next.title = label('next');
  next.setAttribute('aria-label', label('next'));
  const image = el('img', 'sp-viewer__image');
  image.dataset.spViewer = 'image';
  image.alt = '';
  image.draggable = false;
  const spinner = el('span', 'sp-viewer__spinner');
  spinner.dataset.spViewer = 'spinner';
  const status = el('p', 'sp-viewer__status', '');
  status.dataset.spViewer = 'status';
  status.hidden = true;
  status.setAttribute('role', 'alert');
  stage.append(prev, image, spinner, status, next);

  const hint = el('p', 'sp-viewer__hint', t('viewer.hint'));
  hint.dataset.spViewer = 'hint';
  const thumbs = el('div', 'sp-viewer__thumbs');
  thumbs.dataset.spViewer = 'thumbs';
  thumbs.setAttribute('aria-label', t('viewer.thumbs'));

  dialog.append(bar, stage, thumbs, hint);
  root.appendChild(dialog);
  document.body.appendChild(root);
  return root;
}

function paint() {
  const { dialog, image, counter, thumbs, prev, next } = parts();
  if (!state || !dialog || !image) return;
  const { zoom, rotation, offset, images, index } = state;

  if (zoom > 1 || rotation % 360 !== 0) {
    const stage = image.parentElement;
    const swapped = rotation % 180 !== 0;
    const width = (swapped ? image.clientHeight : image.clientWidth) * zoom;
    const height = (swapped ? image.clientWidth : image.clientHeight) * zoom;
    const maxX = Math.max(0, (width - stage.clientWidth) / 2);
    const maxY = Math.max(0, (height - stage.clientHeight) / 2);
    offset.x = Math.min(maxX, Math.max(-maxX, offset.x));
    offset.y = Math.min(maxY, Math.max(-maxY, offset.y));
  } else {
    offset.x = 0;
    offset.y = 0;
  }
  image.style.transform = zoom === 1 && rotation % 360 === 0
    ? ''
    : `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`;
  dialog.classList.toggle('is-zoomed', zoom > 1);
  dialog.classList.toggle('is-rotated', rotation % 360 !== 0);

  if (counter) counter.textContent = images.length > 1 ? t('viewer.counter', { current: index + 1, total: images.length }) : '';
  const multiple = images.length > 1;
  if (prev) prev.hidden = !multiple;
  if (next) next.hidden = !multiple;
  if (prev) prev.disabled = !multiple || (!state.opts.loop && index === 0);
  if (next) next.disabled = !multiple || (!state.opts.loop && index === images.length - 1);

  if (thumbs) {
    thumbs.hidden = state.opts.thumbnails === false || !multiple;
    const buttons = thumbs.querySelectorAll('[data-sp-viewer-thumb]');
    for (let i = 0; i < buttons.length; i += 1) {
      buttons[i].classList.toggle('is-active', Number(buttons[i].dataset.spViewerThumb) === index);
    }
    thumbs.querySelector('.is-active')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
}

function preload() {
  if (!state || state.images.length < 2) return;
  const next = state.images[wrap(state.index + 1)];
  if (next) new Image().src = next.src;
  const previous = state.images[wrap(state.index - 1)];
  if (previous) new Image().src = previous.src;
}

const LABEL_KEYS = {
  'zoom-out': 'zoomOut',
  'zoom-in': 'zoomIn',
  rotate: 'rotate',
  reset: 'reset',
  close: 'close',
  prev: 'prev',
  next: 'next',
};

function refreshLabels() {
  const { root, dialog } = parts();
  if (!root) return;
  const nodes = root.querySelectorAll('[data-sp-viewer]');
  for (let i = 0; i < nodes.length; i += 1) {
    const key = LABEL_KEYS[nodes[i].dataset.spViewer];
    if (!key) continue;
    nodes[i].title = label(key);
    nodes[i].setAttribute('aria-label', label(key));
  }
  if (dialog) dialog.setAttribute('aria-label', label('title'));
  const thumbs = root.querySelector('[data-sp-viewer="thumbs"]');
  if (thumbs) thumbs.setAttribute('aria-label', label('thumbs'));
}

function buildThumbs() {
  const { thumbs } = parts();
  if (!thumbs) return;
  thumbs.textContent = '';
  for (let index = 0; index < state.images.length; index += 1) {
    const item = state.images[index];
    const button = el('button', 'sp-viewer__thumb');
    button.type = 'button';
    button.dataset.spViewerThumb = String(index);
    button.title = item.title || '';
    const image = el('img', 'sp-viewer__thumb-img');
    image.src = item.src;
    image.alt = '';
    image.loading = 'lazy';
    button.appendChild(image);
    thumbs.appendChild(button);
  }
}

function resetView() {
  state.zoom = 1;
  state.rotation = 0;
  state.offset = { x: 0, y: 0 };
  paint();
}

function show(index) {
  if (!state || !state.images.length) return;
  state.index = wrap(index);
  state.token += 1;
  const item = state.images[state.index];
  const { image, spinner, status, title } = parts();
  resetView();
  if (title) title.textContent = item.title || '';
  if (status) {
    status.hidden = true;
    status.textContent = '';
  }
  if (spinner) spinner.hidden = false;
  image.classList.add('is-loading');
  image.src = item.src;
  image.alt = item.alt || item.title || '';
  preload();
  void upgrade(state.token, state.index, item);
  paint();
}

/**
 * Optional `resolveImage` hook: ask the caller for a higher-resolution source
 * of the image being shown and swap it in without resetting the view.
 */
async function upgrade(token, index, item) {
  const resolve = state?.opts.resolveImage;
  if (!resolve || !item) return;
  let better = null;
  try {
    better = await resolve(item, index);
  } catch {
    return;
  }
  const { image, spinner, thumbs } = parts();
  if (!better || better === item.src || !state || state.token !== token || state.index !== index) return;
  state.images[index] = { ...item, src: better };
  if (spinner) spinner.hidden = false;
  image?.classList.add('is-loading');
  if (image) image.src = better;
  const thumb = thumbs?.querySelector(`[data-sp-viewer-thumb="${index}"] img`);
  if (thumb) thumb.src = better;
}

function wrap(index) {
  const total = state.images.length;
  if (!total) return 0;
  if (state.opts.loop) return ((index % total) + total) % total;
  return Math.min(total - 1, Math.max(0, index));
}

function step(delta) {
  if (!state) return;
  const next = state.index + delta;
  if (!state.opts.loop && (next < 0 || next >= state.images.length)) return;
  show(next);
}

function setZoom(zoom) {
  if (!state) return;
  state.zoom = Math.min(state.opts.maxZoom, Math.max(state.opts.minZoom, Number(zoom.toFixed(3))));
  paint();
}

function close() {
  if (!state) return;
  const { root } = parts();
  const { focusReturn, opts } = state;
  state = null;
  if (root) root.hidden = true;
  document.removeEventListener('keydown', onKeyDown);
  unlockPageScroll();
  focusReturn?.focus?.();
  opts.onClose?.();
}

function onKeyDown(event) {
  if (!state) return;
  const tag = event.target instanceof Element ? event.target.tagName : '';
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
  const keys = {
    Escape: close,
    ArrowLeft: () => step(-1),
    ArrowRight: () => step(1),
    Home: () => show(0),
    End: () => show(state.images.length - 1),
    '+': () => setZoom(state.zoom + ZOOM_STEP),
    '=': () => setZoom(state.zoom + ZOOM_STEP),
    '-': () => setZoom(state.zoom - ZOOM_STEP),
    '0': resetView,
    r: () => {
      state.rotation = (state.rotation + ROTATION_STEP) % 360;
      paint();
    },
  };
  const action = keys[event.key];
  if (!action) return;
  event.preventDefault();
  action();
}

function onWheel(event) {
  if (!state) return;
  event.preventDefault();
  setZoom(state.zoom + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
}

function onDoubleClick() {
  if (!state) return;
  if (state.zoom > 1) resetView();
  else setZoom(DOUBLE_CLICK_ZOOM);
}

/** Two active pointers as `[a, b]` (pinch), or null. */
function activePair() {
  const points = [];
  state.pointers.forEach((point) => points.push(point));
  return points.length === 2 ? points : null;
}

function onPointerDown(event) {
  if (!state) return;
  const pressed = event.target instanceof Element ? event.target : null;
  // Controls inside the stage (arrows) own their clicks: capturing the
  // pointer here would retarget the click to the stage and close the viewer.
  const onControl = !!(pressed && pressed.closest('button'));
  state.press = {
    control: onControl,
    image: !!(pressed && pressed.closest('[data-sp-viewer="image"]')),
    moved: false,
  };
  if (onControl) return;
  const stage = parts().stage;
  stage?.setPointerCapture?.(event.pointerId);
  state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  const pair = activePair();
  if (pair) {
    state.pinch = {
      distance: Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y) || 1,
      zoom: state.zoom,
    };
    state.drag = null;
    return;
  }
  state.drag = { id: event.pointerId, x: event.clientX, y: event.clientY, ox: state.offset.x, oy: state.offset.y };
}

function onPointerMove(event) {
  if (!state?.pointers.has(event.pointerId)) return;
  state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  const pair = state.pinch ? activePair() : null;
  if (state.pinch && pair) {
    const distance = Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y) || 1;
    setZoom(state.pinch.zoom * (distance / state.pinch.distance));
    return;
  }
  if (!state.drag || state.drag.id !== event.pointerId || state.zoom <= 1) return;
  const dx = event.clientX - state.drag.x;
  const dy = event.clientY - state.drag.y;
  if (Math.abs(dx) > SWIPE_DISTANCE / 4 || Math.abs(dy) > SWIPE_DISTANCE / 4) state.press.moved = true;
  state.offset = { x: state.drag.ox + dx, y: state.drag.oy + dy };
  const { dialog } = parts();
  dialog?.classList.add('is-dragging');
  paint();
}

function onPointerUp(event) {
  if (!state) return;
  const drag = state.drag;
  state.pointers.delete(event.pointerId);
  if (state.pointers.size < 2) state.pinch = null;
  if (!drag || drag.id !== event.pointerId) return;
  state.drag = null;
  parts().stage?.releasePointerCapture?.(event.pointerId);
  parts().dialog?.classList.remove('is-dragging');
  const dx = event.clientX - drag.x;
  if (state.zoom <= 1 && Math.abs(dx) >= SWIPE_DISTANCE) {
    state.press.moved = true;
    step(dx < 0 ? 1 : -1);
  }
}

function onOverlayClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const pressed = state?.press ?? null;
  if (state) state.press = null;
  // A drag (pan or swipe) is not a click: never act on it.
  if (pressed?.moved) return;
  const action = target.closest('[data-sp-viewer]')?.dataset.spViewer;
  if (action === 'close') return close();
  if (action === 'prev') return step(-1);
  if (action === 'next') return step(1);
  if (action === 'zoom-in') return setZoom(state.zoom + ZOOM_STEP);
  if (action === 'zoom-out') return setZoom(state.zoom - ZOOM_STEP);
  if (action === 'reset') return resetView();
  if (action === 'rotate') {
    state.rotation = (state.rotation + ROTATION_STEP) % 360;
    return paint();
  }
  const thumb = target.closest('[data-sp-viewer-thumb]');
  if (thumb) return show(Number(thumb.dataset.spViewerThumb));
  // The pointer was captured by the stage, so a click on the image also
  // reports the stage as its target — never treat that as "close".
  if (pressed?.image || action === 'image') return;
  if (action === 'stage' || target === parts().root) close();
}

function onImageLoad() {
  const { spinner, status } = parts();
  if (spinner) spinner.hidden = true;
  if (status) status.hidden = true;
  parts().image?.classList.remove('is-loading');
  paint();
}

function onImageError() {
  const { spinner, status, image } = parts();
  if (spinner) spinner.hidden = true;
  image?.classList.remove('is-loading');
  if (status) {
    status.textContent = label('failed');
    status.hidden = false;
  }
}

function installListeners() {
  if (listenersInstalled) return;
  listenersInstalled = true;
  const { root, stage, image, thumbs } = parts();
  root?.addEventListener('click', onOverlayClick);
  stage?.addEventListener('wheel', onWheel, { passive: false });
  stage?.addEventListener('pointerdown', onPointerDown);
  stage?.addEventListener('pointermove', onPointerMove);
  stage?.addEventListener('pointerup', onPointerUp);
  stage?.addEventListener('pointercancel', onPointerUp);
  stage?.addEventListener('dblclick', onDoubleClick);
  image?.addEventListener('load', onImageLoad);
  image?.addEventListener('error', onImageError);
  thumbs?.addEventListener('wheel', (event) => event.stopPropagation());
}

/**
 * Open the viewer over the current page.
 * @param {typeof defaults & { images: ViewerImage[] }} options
 */
export function openViewer(options = {}) {
  const next = buildState({ ...defaults, ...options });
  if (!next.images.length) return false;
  ensureOverlay();
  installListeners();
  if (!state) {
    document.addEventListener('keydown', onKeyDown);
    lockPageScroll();
  }
  state = next;
  const { root, dialog, hint } = parts();
  root.hidden = false;
  refreshLabels();
  if (hint) hint.textContent = label('hint');
  buildThumbs();
  show(next.index);
  dialog?.focus?.();
  return true;
}

export function closeViewer() {
  close();
}

export function isViewerOpen() {
  return !!state;
}
