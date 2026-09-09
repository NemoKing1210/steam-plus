import { t } from '../../i18n/index.js';
import { el } from '../../utils/dom.js';

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function createPricesRoot() {
  const root = el('div', 'sp-prices');
  root.dataset.spPrices = '';

  const head = el('div', 'sp-prices__head');
  head.appendChild(el('span', 'sp-prices__title', t('prices.title')));
  const updated = el('span', 'sp-prices__updated', '');
  updated.dataset.spPricesUpdated = '';
  const refresh = el('button', 'sp-prices__refresh', '⟳');
  refresh.type = 'button';
  refresh.dataset.spPricesRefresh = '';
  refresh.title = t('prices.refresh');
  refresh.setAttribute('aria-label', t('prices.refresh'));
  const toggle = el('button', 'sp-prices__toggle', '▾');
  toggle.type = 'button';
  toggle.dataset.spPricesToggle = '';
  toggle.setAttribute('aria-expanded', 'true');
  toggle.title = t('prices.collapse');
  toggle.setAttribute('aria-label', t('prices.collapse'));
  head.append(updated, refresh, toggle);
  root.appendChild(head);

  const hint = el('p', 'sp-prices__hint', '');
  hint.dataset.spPricesHint = '';
  hint.hidden = true;
  root.appendChild(hint);

  const body = el('div', 'sp-prices__body');
  body.dataset.spPricesBody = '';
  root.appendChild(body);
  return root;
}

function compareMaybe(a, b, dir) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return dir === 'asc' ? a - b : b - a;
}

/** Order region rows; the home row stays pinned and never sorts. */
export function orderRows(rows, sort) {
  if (!sort || sort.key === 'custom') return rows;
  const dir = sort.dir === 'desc' ? 'desc' : 'asc';
  const ordered = [...rows];
  if (sort.key === 'region') {
    ordered.sort((a, b) => {
      const cmp = String(a.name).localeCompare(String(b.name));
      return dir === 'asc' ? cmp : -cmp;
    });
  } else if (sort.key === 'price') {
    ordered.sort((a, b) => compareMaybe(a.usd, b.usd, dir));
  } else if (sort.key === 'discount') {
    ordered.sort((a, b) => compareMaybe(a.discount, b.discount, dir));
  } else if (sort.key === 'savings') {
    ordered.sort((a, b) => compareMaybe(a.save, b.save, dir));
  }
  return ordered;
}

function sortButton(column, activeSort, onSort) {
  const button = el('button', 'sp-prices__sort');
  button.type = 'button';
  const active = activeSort?.key === column.key;
  button.appendChild(el('span', '', t(column.labelKey)));
  if (active) {
    const arrow = el('span', 'sp-prices__arrow', activeSort.dir === 'desc' ? '▼' : '▲');
    arrow.setAttribute('aria-hidden', 'true');
    button.appendChild(arrow);
  }
  button.addEventListener('click', () => onSort(column.key));
  return button;
}

function buildHead(columns, activeSort, onSort) {
  const thead = document.createElement('thead');
  const row = document.createElement('tr');
  for (const column of columns) {
    const cell = document.createElement('th');
    cell.className = `sp-prices__th${column.numeric ? ' is-num' : ''}${activeSort?.key === column.key ? ' is-active' : ''}`;
    if (activeSort?.key === column.key) {
      cell.setAttribute('aria-sort', activeSort.dir === 'desc' ? 'descending' : 'ascending');
    }
    cell.appendChild(sortButton(column, activeSort, onSort));
    row.appendChild(cell);
  }
  thead.appendChild(row);
  return thead;
}

function textCell(className, text) {
  const cell = document.createElement('td');
  cell.className = className;
  cell.textContent = text;
  return cell;
}

function buildRegionCell(name, currency, cheapest) {
  const cell = document.createElement('td');
  cell.className = 'sp-prices__td';
  cell.appendChild(el('span', '', name));
  cell.appendChild(el('small', 'sp-prices__currency', currency));
  if (cheapest) {
    cell.appendChild(el('span', 'sp-pill is-on', t('prices.cheapest')));
  }
  return cell;
}

function buildPriceCell(finalFormatted, sub) {
  const cell = document.createElement('td');
  cell.className = 'sp-prices__td is-num';
  cell.appendChild(el('div', 'sp-prices__price-main', finalFormatted));
  if (sub) {
    const details = el('div', 'sp-prices__price-sub');
    if (sub.initial) details.appendChild(el('s', '', sub.initial));
    if (sub.converted) details.appendChild(el('span', '', sub.converted));
    cell.appendChild(details);
  }
  return cell;
}

function buildRow(cells, { home, cheapest }) {
  const row = document.createElement('tr');
  row.className = `sp-prices__tr${home ? ' is-home' : ''}${cheapest ? ' is-cheapest' : ''}`;
  for (const cell of cells) row.appendChild(cell);
  return row;
}

function homeCells(home, columns, settings) {
  return columns.map((column) => {
    if (column.key === 'region') {
      return buildRegionCell(t('prices.yours'), home.currency, false);
    }
    if (column.key === 'price') {
      return buildPriceCell(home.final_formatted, {
        initial: settings.showOriginal && home.initial > home.final ? home.initial_formatted : null,
        converted: home.converted,
      });
    }
    if (column.key === 'discount') {
      const cell = document.createElement('td');
      cell.className = 'sp-prices__td is-num';
      if (settings.showDiscount && home.discount > 0) {
        cell.appendChild(el('span', 'sp-prices__badge', `-${home.discount}%`));
      }
      return cell;
    }
    return textCell('sp-prices__td is-num', '');
  });
}

function regionCells(row, columns, settings, cheapest) {
  return columns.map((column) => {
    if (column.key === 'region') {
      return buildRegionCell(row.name, row.currency, cheapest);
    }
    if (column.key === 'price') {
      return buildPriceCell(row.final_formatted, {
        initial: settings.showOriginal && row.initial > row.final ? row.initial_formatted : null,
        converted: row.converted,
      });
    }
    if (column.key === 'discount') {
      const cell = document.createElement('td');
      cell.className = 'sp-prices__td is-num';
      if (settings.showDiscount && row.discount > 0) {
        cell.appendChild(el('span', 'sp-prices__badge', `-${row.discount}%`));
      }
      return cell;
    }
    if (column.key === 'savings') {
      const cell = document.createElement('td');
      cell.className = 'sp-prices__td is-num';
      if (row.save !== null && row.save !== undefined) {
        const saveEl = el('span', 'sp-prices__save', `${row.save > 0 ? '−' : '+'}${Math.abs(row.save)}%`);
        saveEl.classList.toggle('is-cheap', row.save > 0);
        cell.appendChild(saveEl);
      }
      return cell;
    }
    return textCell('sp-prices__td', '');
  });
}

function actionButton(label, onClick, primary) {
  const button = el('button', `sp-button${primary ? '' : ' sp-button--ghost'}`, label);
  button.type = 'button';
  button.addEventListener('click', onClick);
  return button;
}
export function setPricesCollapsed(root, collapsed) {
  root.classList.toggle('is-collapsed', collapsed);
  const toggle = root.querySelector('[data-sp-prices-toggle]');
  if (!toggle) return;
  toggle.setAttribute('aria-expanded', String(!collapsed));
  const label = t(collapsed ? 'prices.expand' : 'prices.collapse');
  toggle.title = label;
  toggle.setAttribute('aria-label', label);
}

/**
 * Paint the prices block. `view` carries the load status, normalized rows
 * and the active table sort; `settings` is the live prices settings slice;
 * `handlers` wires the load / retry / refresh / sort buttons. The home row
 * stays pinned above the sorted region rows.
 */
export function paintPrices(root, view, settings, handlers) {
  const body = root.querySelector('[data-sp-prices-body]');
  const updated = root.querySelector('[data-sp-prices-updated]');
  const hint = root.querySelector('[data-sp-prices-hint]');
  const refresh = root.querySelector('[data-sp-prices-refresh]');
  const toggle = root.querySelector('[data-sp-prices-toggle]');
  if (!body || !hint || !refresh || !toggle) return;

  refresh.onclick = () => handlers.onRefresh();
  refresh.hidden = view.status !== 'ready';
  toggle.onclick = () => setPricesCollapsed(root, !root.classList.contains('is-collapsed'));
  setPricesCollapsed(root, root.classList.contains('is-collapsed'));
  body.replaceChildren();

  hint.textContent = '';
  hint.hidden = true;
  if (view.status === 'loading') {
    const loading = el('div', 'sp-prices__state');
    loading.appendChild(el('span', 'sp-prices__spinner'));
    loading.appendChild(el('span', '', t('prices.loading')));
    body.appendChild(loading);
    if (updated) updated.textContent = '';
    return;
  }
  if (view.status === 'manual') {
    body.appendChild(actionButton(t('prices.load'), handlers.onLoad, true));
    if (updated) updated.textContent = '';
    return;
  }
  if (view.status === 'empty-regions') {
    body.appendChild(el('p', 'sp-prices__state', t('prices.noRegions')));
    if (updated) updated.textContent = '';
    return;
  }
  if (view.status === 'error') {
    const error = el('div', 'sp-prices__state');
    error.appendChild(el('span', '', t('prices.failed')));
    error.appendChild(actionButton(t('prices.retry'), handlers.onRetry, false));
    body.appendChild(error);
    if (updated) updated.textContent = '';
    return;
  }

  const showDiscountCol = settings.showDiscount
    && [view.home, ...view.rows].some((row) => row && row.discount > 0);
  const showSavingsCol = settings.showSavings
    && view.rows.some((row) => row.save !== null && row.save !== undefined);
  const columns = [
    { key: 'region', labelKey: 'prices.colRegion', numeric: false },
    { key: 'price', labelKey: 'prices.colPrice', numeric: true },
    ...(showDiscountCol ? [{ key: 'discount', labelKey: 'prices.colDiscount', numeric: true }] : []),
    ...(showSavingsCol ? [{ key: 'savings', labelKey: 'prices.colSavings', numeric: true }] : []),
  ];

  const scroller = el('div', 'sp-prices__scroll');
  const table = document.createElement('table');
  table.className = 'sp-prices__table';
  table.appendChild(buildHead(columns, view.sort, handlers.onSort));
  const tbody = document.createElement('tbody');
  if (settings.showHomeRow && view.home) {
    tbody.appendChild(buildRow(homeCells(view.home, columns, settings), { home: true, cheapest: false }));
  }
  for (const row of orderRows(view.rows, view.sort)) {
    tbody.appendChild(
      buildRow(regionCells(row, columns, settings, settings.highlightCheapest && row.cc === view.cheapestCc), {
        home: false,
        cheapest: settings.highlightCheapest && row.cc === view.cheapestCc,
      }),
    );
  }
  table.appendChild(tbody);
  scroller.appendChild(table);
  body.appendChild(scroller);

  if (updated) {
    updated.textContent = view.updatedAt ? t('prices.updated', { time: formatTime(view.updatedAt) }) : '';
  }
  if (view.fxHint) {
    hint.textContent = t('prices.fxHint', view.fxHint);
    hint.hidden = false;
  }
}
