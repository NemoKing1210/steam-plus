import { SEARCH_MIN_TERM_LENGTH, SEARCH_ROW_OPTIONS, SEARCH_SUGGEST_DEBOUNCE_MS } from '../../core/constants.js';
import { getSettings, saveSettings } from '../../core/settings.js';
import { Codes, logError } from '../../core/debug.js';
import { t } from '../../i18n/index.js';
import { debounce, el } from '../../utils/dom.js';
import {
  fetchGuestSuggestions,
  fetchSearchDetails,
  getGuestCountryName,
  getSearchRowLimit,
} from './suggest.js';
import { getSteamStoreLanguage } from '../region/request.js';

const MAGNIFIER_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg>';

let overlay = null;
let input = null;
let rowsSelect = null;
let results = null;
let note = null;
let state = null;
let scrollLock = null;

function isSearchEnabled() {
  const region = getSettings().region;
  return region?.enabled !== false && region?.searchEnabled !== false;
}

function defaultGuestCc() {
  const cc = getSettings().region?.countryCode;
  return /^[A-Za-z]{2}$/.test(cc || '') ? cc.toUpperCase() : 'US';
}

function setResults(node) {
  results.textContent = '';
  if (node) results.appendChild(node);
}

function updateNote() {
  if (note && state) note.textContent = t('search.guestHint', { country: getGuestCountryName(state.guestCc) });
}

function renderLoading() {
  const wrap = el('div', 'sp-search__loading');
  wrap.appendChild(el('span', 'sp-search__spinner'));
  wrap.appendChild(el('span', '', t('search.loading')));
  setResults(wrap);
}

function renderError(term, message) {
  const wrap = el('div', 'sp-search__notice');
  wrap.appendChild(el('span', '', t('region.errorFailed', { error: message })));
  const retry = el('button', 'sp-button sp-search__retry');
  retry.type = 'button';
  retry.textContent = t('region.retry');
  retry.addEventListener('click', () => void requestFor(term, true));
  wrap.appendChild(retry);
  setResults(wrap);
}

function renderEmpty() {
  const wrap = el('div', 'sp-search__notice');
  wrap.appendChild(el('span', '', t('search.empty')));
  setResults(wrap);
}

function metaLine(info) {
  if (!info) return '';
  return [info.date, info.review].filter(Boolean).join(' • ');
}

function paintPrice(box, info, fallbackPrice) {
  box.textContent = '';
  if (info && (info.discount || info.original || info.final)) {
    if (info.discount) {
      if (info.original) box.appendChild(el('span', 'sp-search__price-old', info.original));
      if (info.final) box.appendChild(el('span', 'sp-search__price-final', info.final));
      box.appendChild(el('span', 'sp-search__discount', info.discount));
      return;
    }
    if (info.final) {
      box.appendChild(el('span', 'sp-search__price-final', info.final));
      return;
    }
  }
  if (info?.free) {
    box.appendChild(el('span', 'sp-search__price-final', t('search.free')));
    return;
  }
  if (fallbackPrice) box.appendChild(el('span', 'sp-search__price', fallbackPrice));
}

function renderRows(rows) {
  const list = el('div', 'sp-search__list');
  for (const row of rows.slice(0, state?.rows ?? getSearchRowLimit())) {
    const link = el('a', 'sp-search__row');
    link.href = row.url;
    if (row.appid) link.dataset.appid = row.appid;
    if (row.img) {
      const thumb = el('span', 'sp-search__thumb');
      const img = el('img');
      img.src = row.img;
      img.alt = '';
      img.loading = 'lazy';
      thumb.appendChild(img);
      link.appendChild(thumb);
    } else {
      link.appendChild(el('span', 'sp-search__letter', (row.name || '?').slice(0, 1).toUpperCase()));
    }
    const main = el('span', 'sp-search__main');
    main.appendChild(el('span', 'sp-search__name', row.name || row.url));
    main.appendChild(el('span', 'sp-search__meta', ''));
    link.appendChild(main);
    const price = el('span', 'sp-search__prices');
    if (row.price) {
      price.dataset.fallback = row.price;
      price.appendChild(el('span', 'sp-search__price', row.price));
    }
    link.appendChild(price);
    list.appendChild(link);
  }
  setResults(list);
}

async function enrichRows(term, rows, cc) {
  const gen = state?.gen;
  let details;
  try {
    details = await fetchSearchDetails(term, {
      cc,
      lang: getSteamStoreLanguage(),
      count: rows.length,
      settings: getSettings().region,
    });
  } catch (error) {
    logError(Codes.SEARCH_FAILED, 'region search details failed', {
      error: String(error?.message || error),
      term,
    });
    return;
  }
  if (!state || gen !== state.gen || state.term !== term || !results) return;
  for (const [appid, info] of details.rows) {
    const link = results.querySelector(`.sp-search__row[data-appid="${appid}"]`);
    if (!link || !info) continue;
    const meta = link.querySelector('.sp-search__meta');
    if (meta) {
      meta.textContent = metaLine(info);
      if (!meta.textContent) meta.remove();
    }
    if (Array.isArray(info.platforms) && info.platforms.length) {
      const platformsRow = el('div', 'sp-search__platforms');
      for (const platform of info.platforms) {
        const icon = el('span', `platform_img ${platform} sp-search__platform`);
        icon.setAttribute('aria-hidden', 'true');
        platformsRow.appendChild(icon);
      }
      const anchor = link.querySelector('.sp-search__meta') ?? link.querySelector('.sp-search__name');
      if (anchor) anchor.after(platformsRow);
      else link.querySelector('.sp-search__main')?.appendChild(platformsRow);
    }
    const price = link.querySelector('.sp-search__prices');
    if (price) paintPrice(price, info, price.dataset.fallback || '');
  }
}

async function requestFor(term, force = false) {
  if (!state || state.term !== term) return;
  const gen = force ? ++state.gen : state.gen;
  const { guestCc } = state;
  renderLoading();
  const settings = getSettings().region;
  try {
    const guest = await fetchGuestSuggestions(term, settings, guestCc);
    if (gen !== state.gen || state.term !== term) return;
    const shown = guest.results.slice(0, state?.rows ?? getSearchRowLimit());
    if (!shown.length) renderEmpty();
    else {
      renderRows(shown);
      void enrichRows(term, shown, guestCc);
    }
  } catch (error) {
    if (gen !== state.gen || state.term !== term) return;
    logError(Codes.SEARCH_FAILED, 'region search suggest failed', {
      error: String(error?.message || error),
      term,
    });
    renderError(term, String(error?.message || error));
  }
}

const debouncedRequest = debounce((term) => {
  if (state) void requestFor(term);
}, SEARCH_SUGGEST_DEBOUNCE_MS);

function onInput() {
  if (!state) return;
  const term = input.value.trim();
  state.term = term;
  state.gen++;
  if (term.length < SEARCH_MIN_TERM_LENGTH) {
    setResults(null);
    return;
  }
  debouncedRequest(term);
}


function buildOverlay() {
  overlay = el('div', 'sp-search-overlay');
  overlay.setAttribute('hidden', '');
  overlay.addEventListener('mousedown', (event) => {
    if (event.target === overlay) closeSearchOverlay();
  });
  const card = el('div', 'sp-search');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', t('search.title'));

  const head = el('div', 'sp-search__head');
  head.appendChild(el('div', 'sp-search__title', t('search.title')));
  const close = el('button', 'sp-search__close');
  close.type = 'button';
  close.textContent = '×';
  close.setAttribute('aria-label', t('common.close'));
  close.addEventListener('click', closeSearchOverlay);
  head.appendChild(close);
  card.appendChild(head);

  const box = el('div', 'sp-search__box');
  const icon = el('span', 'sp-search__icon');
  icon.innerHTML = MAGNIFIER_SVG;
  box.appendChild(icon);
  input = el('input', 'sp-search__input');
  input.type = 'text';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.placeholder = t('search.placeholder');
  input.addEventListener('input', onInput);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeSearchOverlay();
    else if (event.key === 'Enter' && input.value.trim()) {
      location.href = `https://store.steampowered.com/search/?term=${encodeURIComponent(input.value.trim())}`;
    }
  });
  box.appendChild(input);
  rowsSelect = el('select', 'sp-select sp-search__select sp-search__rows');
  rowsSelect.setAttribute('aria-label', t('region.searchRows'));
  for (const rows of SEARCH_ROW_OPTIONS) {
    const opt = document.createElement('option');
    opt.value = rows;
    opt.textContent = rows;
    rowsSelect.appendChild(opt);
  }
  rowsSelect.addEventListener('change', () => {
    if (!state) return;
    state.rows = Number(rowsSelect.value) || getSearchRowLimit();
    saveSettings({ region: { searchMaxRows: state.rows } });
    if (state.term.length >= SEARCH_MIN_TERM_LENGTH) void requestFor(state.term, true);
  });
  box.appendChild(rowsSelect);
  card.appendChild(box);
  results = el('div', 'sp-search__results');
  card.appendChild(results);

  const foot = el('div', 'sp-search__foot');
  const advanced = el('a', 'sp-search__advanced');
  advanced.href = 'https://store.steampowered.com/search/';
  advanced.textContent = t('search.advanced');
  foot.appendChild(advanced);
  note = el('span', 'sp-search__note');
  foot.appendChild(note);
  card.appendChild(foot);

  overlay.appendChild(card);
  document.documentElement.appendChild(overlay);
  document.addEventListener('keydown', onDocumentKeyDown);
}

function onDocumentKeyDown(event) {
  if (event.key === 'Escape' && overlay && !overlay.hasAttribute('hidden')) closeSearchOverlay();
}

export function isSearchOverlayOpen() {
  return !!overlay && !overlay.hasAttribute('hidden');
}

export function openSearchOverlay(initialTerm = '') {
  if (!isSearchEnabled()) return;
  if (!overlay) buildOverlay();
  const term = String(initialTerm || '').trim();
  state = { guestCc: defaultGuestCc(), term, gen: 0, rows: getSearchRowLimit() };
  rowsSelect.value = String(state.rows);
  input.value = term;
  updateNote();
  setResults(null);
  overlay.removeAttribute('hidden');
  lockScroll();
  input.focus();
  if (term.length >= SEARCH_MIN_TERM_LENGTH) void requestFor(term, true);
}

export function closeSearchOverlay() {
  if (state) state.gen++;
  state = null;
  overlay?.setAttribute('hidden', '');
  unlockScroll();
}

function isPanelOverlayOpen() {
  const panel = document.getElementById('sp-panel-overlay');
  return !!panel && !panel.hasAttribute('hidden');
}

function onOverlayScrollGuard(event) {
  if (!state) return;
  const scroller = overlay?.querySelector('.sp-search__results');
  if (scroller && event.target instanceof Node && scroller.contains(event.target)) return;
  event.preventDefault();
}

function lockScroll() {
  // The settings panel owns its own lock: while it stays open the page
  // remains pinned by it, so the overlay must not touch body styles.
  if (scrollLock || isPanelOverlayOpen()) return;
  const root = document.documentElement;
  const body = document.body;
  const y = window.scrollY || root.scrollTop || body.scrollTop || 0;
  const pad = Math.max(0, window.innerWidth - root.clientWidth);
  scrollLock = { y, pad: body.style.paddingRight };
  root.classList.add('sp-modal-open');
  if (pad) body.style.paddingRight = `${pad}px`;
  body.style.top = `-${y}px`;
  document.addEventListener('wheel', onOverlayScrollGuard, { passive: false, capture: true });
  document.addEventListener('touchmove', onOverlayScrollGuard, { passive: false, capture: true });
}

function unlockScroll() {
  if (!scrollLock) return;
  if (isPanelOverlayOpen()) return;
  const { y, pad } = scrollLock;
  scrollLock = null;
  document.removeEventListener('wheel', onOverlayScrollGuard, { capture: true });
  document.removeEventListener('touchmove', onOverlayScrollGuard, { capture: true });
  document.documentElement.classList.remove('sp-modal-open');
  document.body.style.top = '';
  document.body.style.paddingRight = pad;
  window.scrollTo(0, y);
}
