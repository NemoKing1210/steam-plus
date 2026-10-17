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
  const flags = el('span', 'sp-prices__flags', '');
  flags.dataset.spPricesFlags = '';
  head.appendChild(flags);
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

/** Parse a user-typed price ("9.99", "9,99"); null when not a positive number. */
function parseTargetInput(value) {
  const amount = Number.parseFloat(String(value).trim().replace(',', '.'));
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : null;
}

function buildStat(history) {
  const stat = el('div', `sp-prices__stat${history.tone ? ' is-good' : ''}`);
  stat.appendChild(el('span', 'sp-prices__stat-label', t('prices.histLow')));
  stat.appendChild(el('span', 'sp-prices__stat-value', history.low));
  const parts = [];
  if (history.date) parts.push(t('prices.histDate', { date: history.date }));
  if (history.tone === 'low') parts.push(t('prices.histAtLow'));
  else if (history.above !== null) parts.push(t('prices.histAbove', { pct: history.above }));
  parts.push(t('prices.histSource', { provider: 'CheapShark' }));
  stat.appendChild(el('span', 'sp-prices__stat-sub', parts.join(' · ')));
  return stat;
}

function buildTarget(alert, handlers) {
  const box = el('div', `sp-prices__target${alert.reached ? ' is-reached' : ''}`);
  box.appendChild(el('span', 'sp-prices__stat-label', t('prices.targetLabel')));

  const row = el('div', 'sp-prices__target-row');
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'sp-input sp-prices__input';
  input.inputMode = 'decimal';
  input.maxLength = 12;
  input.placeholder = t('prices.targetPlaceholder', { currency: alert.currency });
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('aria-label', t('prices.targetLabel'));
  const submit = () => {
    const amount = parseTargetInput(input.value);
    input.classList.toggle('is-invalid', amount === null);
    if (amount !== null) handlers.onSetTarget(amount);
  };
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    submit();
  });
  input.addEventListener('input', () => input.classList.remove('is-invalid'));
  row.append(input, actionButton(t('prices.targetSet'), submit, true));
  if (alert.goal) row.appendChild(actionButton(t('prices.targetClear'), handlers.onClearTarget, false));
  box.appendChild(row);

  if (alert.goal) {
    const status = alert.reached
      ? t('prices.targetReached', { target: alert.goal, price: alert.current })
      : t('prices.targetWaiting', { target: alert.goal, price: alert.current });
    box.appendChild(el('span', 'sp-prices__target-status', status));
  }
  return box;
}

function buildInsight(view, handlers) {
  if (!view.history && !view.alert) return null;
  const insight = el('div', 'sp-prices__insight');
  if (view.history) insight.appendChild(buildStat(view.history));
  if (view.alert) insight.appendChild(buildTarget(view.alert, handlers));
  return insight;
}

function paintFlags(flags, list) {
  flags.replaceChildren();
  for (const flag of list ?? []) {
    flags.appendChild(el('span', `sp-pill${flag.good ? ' is-on' : ''}`, flag.text));
  }
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
  const flags = root.querySelector('[data-sp-prices-flags]');
  if (!body || !hint || !refresh || !toggle || !flags) return;
  paintFlags(flags, view.status === 'ready' ? view.flags : null);

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

  const insight = buildInsight(view, handlers);
  if (insight) body.appendChild(insight);

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
