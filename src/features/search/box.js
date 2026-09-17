import { getSettings } from '../../core/settings.js';
import { t } from '../../i18n/index.js';
import { el } from '../../utils/dom.js';
import { isSearchOverlayOpen, openSearchOverlay } from './overlay.js';

const STORE_HOST = 'store.steampowered.com';
const FORM_SELECTOR = 'form[action*="/search"]';
const MAGNIFIER_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg>';

export function isSearchEnabled() {
  const region = getSettings().region;
  return region?.enabled !== false && region?.searchEnabled !== false;
}

function launch(value) {
  if (isSearchOverlayOpen()) return;
  openSearchOverlay(value);
}

function mountIn(form) {
  if (!(form instanceof HTMLFormElement)) return;
  if (form.dataset.spSearchBox === '1') return;
  const termInput = form.querySelector('input[name="term"]');
  if (!termInput || !form.parentElement) return;
  // Header search boxes hold a couple of inputs at most; anything bigger
  // is a filter form (e.g. advanced search) and must keep working natively.
  if (form.querySelectorAll('input, select, textarea').length > 4) return;
  form.dataset.spSearchBox = '1';
  form.dataset.spSearchDisplay = form.style.display || '';
  form.style.display = 'none';
  const box = el('div', 'sp-searchbox');
  const field = el('input', 'sp-searchbox__input');
  field.type = 'text';
  field.autocomplete = 'off';
  field.spellcheck = false;
  field.placeholder = termInput.placeholder || t('search.placeholder');
  field.setAttribute('aria-label', t('search.title'));
  const go = el('button', 'sp-searchbox__go');
  go.type = 'button';
  go.setAttribute('aria-label', t('search.title'));
  go.innerHTML = MAGNIFIER_SVG;
  const launchWith = () => launch(field.value.trim());
  field.addEventListener('focus', () => launch(field.value.trim()));
  field.addEventListener('input', () => {
    if (!isSearchOverlayOpen()) launch(field.value.trim());
  });
  field.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      launchWith();
    }
  });
  go.addEventListener('click', launchWith);
  box.appendChild(field);
  box.appendChild(go);
  form.parentElement.insertBefore(box, form);
}

export function mountSearchBoxes(root = document) {
  if (location.hostname !== STORE_HOST || !isSearchEnabled()) return;
  if (root instanceof HTMLFormElement && root.matches(FORM_SELECTOR)) mountIn(root);
  if (root?.querySelectorAll) {
    for (const form of root.querySelectorAll(FORM_SELECTOR)) mountIn(form);
  }
}

export function unmountSearchBoxes(root = document) {
  const scope = root instanceof Element || root instanceof Document ? root : document;
  for (const box of scope.querySelectorAll('.sp-searchbox')) box.remove();
  for (const form of scope.querySelectorAll('form[data-sp-search-box="1"]')) {
    delete form.dataset.spSearchBox;
    form.style.display = form.dataset.spSearchDisplay || '';
    delete form.dataset.spSearchDisplay;
  }
}
