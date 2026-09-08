import { getSettings } from '../core/settings.js';
import { el } from '../utils/dom.js';

/**
 * Steam-styled toast notifications.
 *
 * showToast({
 *   type: 'info' | 'success' | 'warning' | 'error',  // default 'info'
 *   icon,          // built-in key override ('info' | 'success' | 'warning' | 'error')
 *   title,         // bold headline
 *   message,       // secondary text (optional)
 *   duration,      // ms before auto-dismiss, 0 keeps it sticky (default: settings)
 *   key,           // dedup key: a visible toast with the same key is refreshed
 *   onClick,       // whole-toast click action (optional)
 *   actions,       // [{ label, tone: 'primary' | 'ghost' | 'danger', onClick }]
 * })
 * returns { id, dismiss, update({ title, message }) }.
 *
 * At most MAX_VISIBLE toasts stay on screen; older ones are dismissed.
 * Timers pause while hovered. Toasts never block the page.
 */

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 5000;

const ICONS = {
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>',
  success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>',
  error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
};

const ACTION_TONES = {
  primary: 'sp-toast__action',
  ghost: 'sp-toast__action sp-toast__action--ghost',
  danger: 'sp-toast__action sp-toast__action--danger',
};

let toastSeq = 0;
/** key -> toast record for dedup while visible */
const visible = new Map();

function getToastSettings() {
  try {
    return getSettings().toasts ?? null;
  } catch {
    return null;
  }
}

function ensureContainer() {
  let container = document.querySelector('.sp-toasts');
  if (!container) {
    container = el('div', 'sp-toasts');
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  container.classList.remove(
    'sp-toasts--top-right',
    'sp-toasts--top-left',
    'sp-toasts--bottom-left',
  );
  const position = getToastSettings()?.position;
  if (position && position !== 'bottom-right') container.classList.add(`sp-toasts--${position}`);
  return container;
}

function buildToast(options) {
  const {
    type = 'info',
    icon = type,
    title = '',
    message = '',
    duration = DEFAULT_DURATION,
    onClick,
    actions = [],
  } = options;

  const node = el('div', `sp-toast sp-toast--${type}`);
  node.setAttribute('role', type === 'error' ? 'alert' : 'status');
  if (onClick) {
    node.classList.add('sp-toast--clickable');
    node.addEventListener('click', (event) => {
      if (event.target.closest('button')) return;
      onClick();
    });
  }

  const iconHolder = el('span', `sp-toast__icon sp-toast__icon--${type}`);
  iconHolder.setAttribute('aria-hidden', 'true');
  iconHolder.innerHTML = ICONS[icon] ?? ICONS[type] ?? ICONS.info;
  node.appendChild(iconHolder);

  const body = el('div', 'sp-toast__body');
  const titleNode = el('div', 'sp-toast__title', title);
  body.appendChild(titleNode);
  const messageNode = el('div', 'sp-toast__message', message);
  if (!message) messageNode.hidden = true;
  body.appendChild(messageNode);

  const actionRow = el('div', 'sp-toast__actions');
  let hasActions = false;
  for (const action of actions) {
    if (!action?.label || typeof action.onClick !== 'function') continue;
    hasActions = true;
    const button = el('button', ACTION_TONES[action.tone] ?? ACTION_TONES.primary, action.label);
    button.type = 'button';
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      action.onClick();
    });
    actionRow.appendChild(button);
  }
  if (hasActions) {
    actionRow.hidden = false;
    body.appendChild(actionRow);
  }
  node.appendChild(body);

  const closeButton = el('button', 'sp-toast__close', '×');
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', '×');
  node.appendChild(closeButton);

  if (duration > 0) {
    const progress = el('div', 'sp-toast__progress');
    const bar = el('span', '');
    bar.style.animationDuration = `${duration}ms`;
    progress.appendChild(bar);
    node.appendChild(progress);
  }

  return { node, titleNode, messageNode };
}

export function showToast(options = {}) {
  const toastSettings = getToastSettings();
  if (toastSettings && toastSettings.enabled === false) {
    return { id: `sp-toast-off-${++toastSeq}`, dismiss() {}, update() {}, touch() {} };
  }
  const effective = {
    ...options,
    duration: options.duration ?? toastSettings?.duration ?? DEFAULT_DURATION,
  };
  const key = effective.key;
  const existing = key ? visible.get(key) : null;
  if (existing) {
    existing.update({ title: effective.title, message: effective.message });
    existing.touch();
    return existing.handle;
  }

  const container = ensureContainer();
  // Evict oldest first; removal is animated (async), so evict from a
  // bounded snapshot instead of looping on live children.length.
  const overflow = container.children.length - MAX_VISIBLE + 1;
  if (overflow > 0) {
    const evict = new CustomEvent('sp-toast-evict');
    [...container.children].slice(0, overflow).forEach((child) => {
      child.dispatchEvent(evict);
    });
  }

  const id = `sp-toast-${++toastSeq}`;
  const { node, titleNode, messageNode } = buildToast(effective);
  node.dataset.spToast = id;
  const duration = effective.duration ?? DEFAULT_DURATION;

  let timer = null;
  let remaining = duration;
  let startedAt = 0;
  let dismissed = false;

  const record = { node, key };
  const handle = {
    id,
    dismiss: () => dismiss(),
    update: ({ title, message }) => {
      if (title !== undefined) titleNode.textContent = title;
      if (message !== undefined) {
        messageNode.textContent = message;
        messageNode.hidden = !message;
      }
    },
    touch: () => {
      if (duration <= 0 || dismissed) return;
      clearTimeout(timer);
      remaining = duration;
      restartProgress();
      arm();
    },
  };

  function restartProgress() {
    const bar = node.querySelector('.sp-toast__progress span');
    if (!bar) return;
    bar.style.animation = 'none';
    void bar.offsetWidth;
    bar.style.animation = '';
  }

  function arm() {
    if (duration <= 0 || dismissed) return;
    startedAt = Date.now();
    timer = setTimeout(() => dismiss(), remaining);
  }

  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    clearTimeout(timer);
    if (key) visible.delete(key);
    node.classList.add('sp-toast--leaving');
    setTimeout(() => node.remove(), 180);
  }

  node.querySelector('.sp-toast__close').addEventListener('click', (event) => {
    event.stopPropagation();
    dismiss();
  });
  node.addEventListener('sp-toast-evict', () => dismiss());
  if (duration > 0) {
    node.addEventListener('mouseenter', () => {
      clearTimeout(timer);
      remaining = Math.max(0, remaining - (Date.now() - startedAt));
    });
    node.addEventListener('mouseleave', arm);
  }

  container.appendChild(node);
  if (key) visible.set(key, { ...record, ...handle });
  arm();
  return handle;
}
