import { el } from '../../utils/dom.js';
import { t } from '../../i18n/index.js';

/**
 * Reusable settings controls, styled after the Steam client and the
 * steam-gamestatus panel (see DESIGN.md).
 */

const ICONS = {
  globe:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"/></svg>',
  engine:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>',
  sliders:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9"/></svg>',
  bolt:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>',
  cursor:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 3.75l14.25 7.5-6.75 1.5-2.25 6.75-5.25-15.75z"/></svg>',
  below:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h9M4 10h9M4 14h5M18 5v11m0 0l-3.5-3.5M18 16l3.5-3.5"/></svg>',
  swap:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>',
  tag:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z"/></svg>',
  database:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"/></svg>',
  bell:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>',
  eyeOff:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>',
  cash:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
  info:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>',
};

export function getIconSvg(name) {
  return ICONS[name] || '';
}

export function createSection({ icon, title }) {
  const section = el('section', 'sp-panel__section');
  const caption = el('div', 'sp-panel__section-title');
  caption.setAttribute('role', 'heading');
  caption.setAttribute('aria-level', '2');
  if (icon && ICONS[icon]) {
    const iconHolder = el('span', 'sp-panel__section-icon');
    iconHolder.setAttribute('aria-hidden', 'true');
    iconHolder.innerHTML = ICONS[icon];
    caption.appendChild(iconHolder);
  }
  caption.appendChild(el('span', '', title));
  section.appendChild(caption);
  return section;
}

export function createHint(text) {
  return el('p', 'sp-hint', text);
}

export function createField({ label, control, hint }) {
  const field = el('div', 'sp-field');
  if (label) field.appendChild(el('span', 'sp-field__label', label));
  if (control) {
    if (label && control instanceof HTMLSelectElement && !control.getAttribute('aria-label')) {
      control.setAttribute('aria-label', label);
    }
    field.appendChild(control);
  }
  if (hint) field.appendChild(el('p', 'sp-hint', hint));
  return field;
}

function syncPill(pill, on) {
  pill.textContent = on ? t('common.on') : t('common.off');
  pill.classList.toggle('is-on', on);
}

function buildSwitch(checked, onChange, label) {
  const switchControl = el('label', 'sp-switch');
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  if (label) input.setAttribute('aria-label', label);
  input.addEventListener('change', () => onChange(input.checked));
  switchControl.append(input, el('span', 'sp-switch__track'), el('span', 'sp-switch__label', label));
  return { root: switchControl, input };
}

export function createSwitchRow({ checked, onChange, label }) {
  const row = el('div', 'sp-toggle-row');
  const { root, input } = buildSwitch(checked, onChange, label);
  const pill = el('span', 'sp-pill', '');
  syncPill(pill, checked);
  input.addEventListener('change', () => syncPill(pill, input.checked));
  row.append(root, pill);
  return row;
}

export function createSwitchCell({ checked, onChange, label }) {
  return buildSwitch(checked, onChange, label).root;
}

export function createSelect(options, value, onChange) {
  const select = el('select', 'sp-select');
  for (const option of options) {
    const opt = document.createElement('option');
    opt.value = option.value;
    opt.textContent = option.label;
    select.appendChild(opt);
  }
  select.value = value;
  select.addEventListener('change', () => onChange(select.value));
  return select;
}

const thumbPlacements = new Set();
let thumbResizeInstalled = false;

function installThumbResize() {
  if (thumbResizeInstalled) return;
  thumbResizeInstalled = true;
  window.addEventListener('resize', () => {
    for (const placement of thumbPlacements) {
      if (placement.group.isConnected) placement.move();
      else thumbPlacements.delete(placement);
    }
  });
}

export function positionSegmentedThumb(group) {
  const thumb = group.querySelector('.sp-segmented__thumb');
  const active = group.querySelector('.sp-segmented__option--active');
  if (!thumb || !active) return;
  thumb.style.width = `${active.offsetWidth}px`;
  thumb.style.transform = `translateX(${active.offsetLeft - group.scrollLeft}px)`;
}

export function refreshSegmented(root) {
  for (const group of root.querySelectorAll('.sp-segmented')) {
    positionSegmentedThumb(group);
  }
}

export function createSegmented(options, value, onChange) {
  const group = el('div', 'sp-segmented');
  group.setAttribute('role', 'group');
  const thumb = el('span', 'sp-segmented__thumb');
  thumb.setAttribute('aria-hidden', 'true');
  const buttons = new Map();
  let current = value;
  const moveThumb = () => positionSegmentedThumb(group);
  for (const option of options) {
    const button = el('button', 'sp-segmented__option');
    button.type = 'button';
    button.dataset.value = option.value;
    if (option.icon && ICONS[option.icon]) {
      const icon = el('span', 'sp-segmented__icon');
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = ICONS[option.icon];
      button.appendChild(icon);
    }
    button.appendChild(el('span', '', option.label));
    button.setAttribute('aria-pressed', String(option.value === current));
    if (option.value === current) button.classList.add('sp-segmented__option--active');
    button.addEventListener('click', () => {
      if (option.value === current) return;
      current = option.value;
      for (const [optionValue, b] of buttons) {
        const selected = optionValue === current;
        b.classList.toggle('sp-segmented__option--active', selected);
        b.setAttribute('aria-pressed', String(selected));
      }
      moveThumb();
      onChange(current);
    });
    buttons.set(option.value, button);
    group.appendChild(button);
  }
  group.appendChild(thumb);
  requestAnimationFrame(moveThumb);
  installThumbResize();
  thumbPlacements.add({ group, move: moveThumb });
  refreshSegmented(group);
  return group;
}

export function createNumberInput({ value, min = 0, max = 120, step = 1, onChange }) {
  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'sp-select';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  input.addEventListener('change', () => {
    let next = Math.round(Number(input.value));
    if (!Number.isFinite(next)) next = min;
    next = Math.min(max, Math.max(min, next));
    input.value = String(next);
    onChange(next);
  });
  return input;
}

export function createTextInput({ value = '', placeholder = '', maxLength = 253, onChange, inputMode = 'text', type = 'text' }) {
  const input = document.createElement('input');
  input.type = type === 'password' ? 'password' : 'text';
  input.className = 'sp-input';
  input.value = value ?? '';
  if (placeholder) input.placeholder = placeholder;
  if (maxLength) input.maxLength = maxLength;
  if (inputMode && inputMode !== 'text') input.inputMode = inputMode;
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('spellcheck', 'false');
  input.addEventListener('change', () => onChange(input.value));
  return input;
}

export function createButton(labelText, onClick, className = '') {
  const button = el('button', `sp-button ${className}`.trim(), labelText);
  button.type = 'button';
  button.addEventListener('click', onClick);
  return button;
}
