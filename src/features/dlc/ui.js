import { t } from '../../i18n/index.js';
import { el } from '../../utils/dom.js';

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function createDlcRoot() {
  const root = el('section', 'sp-dlc');
  root.dataset.spDlc = '';
  root.setAttribute('aria-label', t('dlc.title'));

  const head = el('div', 'sp-dlc__head');
  head.appendChild(el('span', 'sp-dlc__title', t('dlc.title')));
  const summary = el('span', 'sp-dlc__summary', '');
  summary.dataset.spDlcSummary = '';
  summary.hidden = true;
  const status = el('span', 'sp-dlc__status', '');
  status.dataset.spDlcStatus = '';
  const refresh = el('button', 'sp-dlc__refresh', '⟳');
  refresh.type = 'button';
  refresh.dataset.spDlcRefresh = '';
  refresh.title = t('dlc.refresh');
  refresh.setAttribute('aria-label', t('dlc.refresh'));
  const toggle = el('button', 'sp-dlc__toggle', '▾');
  toggle.type = 'button';
  toggle.dataset.spDlcToggle = '';
  toggle.setAttribute('aria-expanded', 'true');
  toggle.title = t('dlc.collapse');
  toggle.setAttribute('aria-label', t('dlc.collapse'));
  head.append(summary, status, refresh, toggle);
  root.appendChild(head);

  const hint = el('p', 'sp-dlc__hint', '');
  hint.dataset.spDlcHint = '';
  hint.hidden = true;
  root.appendChild(hint);

  const body = el('div', 'sp-dlc__body');
  body.dataset.spDlcBody = '';
  root.appendChild(body);
  return root;
}

export function setDlcCollapsed(root, collapsed) {
  root.classList.toggle('is-collapsed', collapsed);
  const toggle = root.querySelector('[data-sp-dlc-toggle]');
  if (!toggle) return;
  toggle.setAttribute('aria-expanded', String(!collapsed));
  const label = t(collapsed ? 'dlc.expand' : 'dlc.collapse');
  toggle.title = label;
  toggle.setAttribute('aria-label', label);
}

/** Owned add-ons last (default), or the store's own order. */
function orderRows(rows, sort, settings) {
  const visible = settings.showOwned === false ? rows.filter((row) => !row.owned) : rows.slice();
  if (sort !== 'store') {
    visible.sort((a, b) => Number(a.owned) - Number(b.owned));
  }
  return visible;
}

function priceNode(price) {
  const meta = el('span', 'sp-dlc__price');
  if (price?.initial) meta.appendChild(el('s', 'sp-dlc__initial', price.initial));
  meta.appendChild(el('span', 'sp-dlc__final', price?.final || ''));
  if (price?.discount > 0) meta.appendChild(el('span', 'sp-dlc__badge', `-${price.discount}%`));
  return meta;
}

function thumbNode(row, settings) {
  if (settings.showThumbnails === false || !row.image) return null;
  const img = el('img', 'sp-dlc__thumb');
  img.src = row.image;
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';
  img.addEventListener('error', () => img.remove());
  if (settings.viewer === false) return img;
  img.dataset.spViewerSrc = row.imageLarge || row.image;
  if (row.imageLarge) img.dataset.spViewerLarge = '1';
  const button = el('button', 'sp-dlc__thumb-btn');
  button.type = 'button';
  button.title = t('viewer.open');
  button.setAttribute('aria-label', t('viewer.open'));
  button.appendChild(img);
  return button;
}

function dateNode(row, settings) {
  if (settings.showReleaseDate === false || !row.release?.date) return null;
  const date = el('span', 'sp-dlc__date', row.release.date);
  date.title = t('dlc.released');
  return date;
}

function metaNode(row, settings) {
  const meta = el('span', 'sp-dlc__meta');
  if (row.owned) {
    meta.appendChild(el('span', 'sp-pill is-on', t('dlc.owned')));
  } else if (settings.showPrices !== false) {
    if (row.comingSoon && !row.price) {
      meta.appendChild(el('span', 'sp-dlc__soon', t('dlc.soon')));
    } else if (row.free && !row.price) {
      meta.appendChild(el('span', 'sp-dlc__final is-free', t('dlc.free')));
    } else if (row.price) {
      meta.appendChild(priceNode(row.price));
    }
  }
  const date = dateNode(row, settings);
  if (date) meta.appendChild(date);
  return meta;
}

function applyRowContent(node, row, settings) {
  node.className = `sp-dlc__row${row.owned ? ' is-owned' : ''}`;
  node.textContent = '';
  const thumb = thumbNode(row, settings);
  if (thumb) node.appendChild(thumb);
  const link = el('a', 'sp-dlc__name', row.name || `App ${row.appid}`);
  link.href = `/app/${row.appid}/`;
  link.title = link.textContent;
  node.appendChild(link);
  node.appendChild(metaNode(row, settings));
}

function buildRow(row, settings) {
  const node = el('li', 'sp-dlc__row');
  node.dataset.spDlcAppid = String(row.appid);
  applyRowContent(node, row, settings);
  return node;
}

/** Repaint one row in place as its detail request lands. */
export function updateDlcRow(root, row, settings) {
  const node = root.querySelector(`[data-sp-dlc-appid="${row.appid}"]`);
  if (!node) return false;
  applyRowContent(node, row, settings);
  return true;
}

export function setDlcStatus(root, text) {
  const status = root.querySelector('[data-sp-dlc-status]');
  if (status) status.textContent = text || '';
}

export function setDlcProgress(root, done, total) {
  setDlcStatus(root, total > 0 ? t('dlc.loadingProgress', { done, total }) : '');
}

export function setDlcUpdated(root, ts) {
  setDlcStatus(root, ts ? t('dlc.updated', { time: formatTime(ts) }) : '');
}

/**
 * Paint the block: `view.status` is 'loading' | 'error' | 'ready', `view.rows`
 * are the add-on rows of the current game (already merged with ownership and
 * cached details), `handlers` wires refresh / retry / first expand.
 */
export function paintDlc(root, view, settings, handlers) {
  const body = root.querySelector('[data-sp-dlc-body]');
  const summary = root.querySelector('[data-sp-dlc-summary]');
  const hint = root.querySelector('[data-sp-dlc-hint]');
  const refresh = root.querySelector('[data-sp-dlc-refresh]');
  const toggle = root.querySelector('[data-sp-dlc-toggle]');
  if (!body || !summary || !hint || !refresh || !toggle) return;

  refresh.onclick = () => handlers.onRefresh();
  toggle.onclick = () => {
    const collapsed = !root.classList.contains('is-collapsed');
    setDlcCollapsed(root, collapsed);
    if (!collapsed) handlers.onExpand();
  };
  body.onclick = (event) => {
    const button = event.target instanceof Element ? event.target.closest('.sp-dlc__thumb-btn') : null;
    const row = button?.closest('[data-sp-dlc-appid]');
    if (row) handlers.onOpenImage(Number(row.dataset.spDlcAppid));
  };
  setDlcCollapsed(root, root.classList.contains('is-collapsed'));
  refresh.hidden = view.status !== 'ready';
  body.replaceChildren();

  hint.textContent = '';
  hint.hidden = true;
  summary.hidden = true;

  if (view.status === 'loading') {
    const state = el('div', 'sp-dlc__state');
    state.appendChild(el('span', 'sp-dlc__spinner'));
    state.appendChild(el('span', '', t('dlc.loading')));
    body.appendChild(state);
    setDlcStatus(root, '');
    return;
  }
  if (view.status === 'error') {
    const state = el('div', 'sp-dlc__state');
    state.appendChild(el('span', '', t('dlc.failed')));
    const retry = el('button', 'sp-button sp-button--ghost', t('dlc.retry'));
    retry.type = 'button';
    retry.addEventListener('click', () => handlers.onRefresh());
    state.appendChild(retry);
    body.appendChild(state);
    setDlcStatus(root, '');
    return;
  }

  if (settings.showSummary !== false && view.loggedIn) {
    summary.textContent = t('dlc.summary', { owned: view.ownedCount, total: view.total });
    summary.classList.toggle('is-on', view.total > 0 && view.ownedCount === view.total);
    summary.hidden = false;
  }

  const rows = orderRows(view.rows, view.sort, settings);
  if (!rows.length) {
    body.appendChild(el('p', 'sp-dlc__state', view.total ? t('dlc.allOwned') : t('dlc.empty')));
  } else {
    const list = el('ul', 'sp-dlc__list');
    for (let i = 0; i < rows.length; i += 1) list.appendChild(buildRow(rows[i], settings));
    body.appendChild(list);
  }

  let hintText = '';
  if (view.truncated) hintText = t('dlc.truncated', { count: view.total });
  else if (!view.loggedIn) hintText = t('dlc.loginHint');
  if (hintText) {
    hint.textContent = hintText;
    hint.hidden = false;
  }

  if (view.pending) {
    setDlcProgress(root, view.loaded, view.pendingTotal);
  } else {
    setDlcUpdated(root, view.updatedAt);
  }
}
