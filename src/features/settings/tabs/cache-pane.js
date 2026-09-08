import { t } from '../../../i18n/index.js';
import {
  clearTranslationCache,
  getTranslationCacheStats,
  listTranslationCacheEntries,
  persistCacheNow,
  removeTranslationCacheEntry,
} from '../../../translation/cache.js';
import { getProvider } from '../../../translation/providers/index.js';
import { stripPlaceholders } from '../../../translation/rich.js';
import { el } from '../../../utils/dom.js';
import { createButton, createHint, createSection } from '../controls.js';

const CACHE_LIST_LIMIT = 100;

function cacheFillTone(pct) {
  const n = Math.max(0, Math.min(100, Number(pct) || 0));
  if (n >= 90) return 'high';
  if (n >= 70) return 'mid';
  return 'low';
}

function formatBytes(n) {
  const bytes = Math.max(0, Number(n) || 0);
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function truncate(text, maxLength = 90) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function providerLabel(id) {
  try {
    const provider = getProvider(id);
    if (provider) return t(provider.labelKey);
  } catch {
    /* fall through */
  }
  return id;
}

function buildBadge(stats) {
  const pct = Math.round((stats.totalCount / Math.max(1, stats.limitCount)) * 100);
  const badge = el('span', `sp-panel__tab-badge sp-panel__tab-badge--${cacheFillTone(pct)}`, `${pct}%`);
  badge.dataset.spCacheTabBadge = '';
  return badge;
}

function buildMeter(stats) {
  const pct = Math.round((stats.totalCount / Math.max(1, stats.limitCount)) * 100);
  const tone = cacheFillTone(pct);
  const usedText = t('cache.used', { used: formatBytes(stats.usedBytes), count: stats.totalCount });

  const meter = el('div', 'sp-cache-meter');
  meter.dataset.spCacheMeter = '';

  const head = el('div', 'sp-cache-meter__head');
  const pctHolder = el('div', `sp-cache-meter__pct sp-cache-meter__pct--${tone}`);
  pctHolder.appendChild(el('span', 'sp-cache-meter__pct-value', t('cache.pct', { pct })));
  const usedWrap = el('div', 'sp-cache-meter__used-wrap');
  usedWrap.appendChild(el('span', 'sp-cache-meter__used', usedText));
  head.append(pctHolder, usedWrap);
  meter.appendChild(head);

  const bar = el('div', 'sp-cache-meter__bar');
  bar.setAttribute('role', 'img');
  bar.setAttribute('aria-label', usedText);
  const denom = Math.max(stats.limitCount, 1);
  stats.providers.forEach((slot, index) => {
    const width = Math.max(0, Math.min(100, (slot.count / denom) * 100));
    if (width <= 0) return;
    const seg = el('span', `sp-cache-meter__seg sp-cache-meter__seg--p${index % 3}`);
    seg.style.width = `${width}%`;
    seg.title = `${providerLabel(slot.provider)}: ${formatBytes(slot.bytes)}`;
    bar.appendChild(seg);
  });
  const freeSeg = el('span', 'sp-cache-meter__seg sp-cache-meter__seg--free');
  freeSeg.style.width = `${Math.max(0, Math.min(100, (stats.freeCount / denom) * 100))}%`;
  bar.appendChild(freeSeg);
  meter.appendChild(bar);

  const legend = el('ul', 'sp-cache-meter__legend');
  stats.providers.forEach((slot, index) => {
    const row = el('li', 'sp-cache-meter__row');
    row.appendChild(el('span', `sp-cache-meter__swatch sp-cache-meter__swatch--p${index % 3}`));
    row.appendChild(el('span', 'sp-cache-meter__name', providerLabel(slot.provider)));
    const meta = el('span', 'sp-cache-meter__meta');
    meta.appendChild(el('span', 'sp-cache-meter__count', t('cache.entries', { count: slot.count })));
    meta.appendChild(el('span', 'sp-cache-meter__size', formatBytes(slot.bytes)));
    row.appendChild(meta);
    legend.appendChild(row);
  });
  const freeRow = el('li', 'sp-cache-meter__row sp-cache-meter__row--free');
  freeRow.appendChild(el('span', 'sp-cache-meter__swatch sp-cache-meter__swatch--free'));
  freeRow.appendChild(el('span', 'sp-cache-meter__name', t('cache.free')));
  const freeMeta = el('span', 'sp-cache-meter__meta');
  freeMeta.appendChild(el('span', 'sp-cache-meter__count', t('cache.entries', { count: stats.freeCount })));
  freeRow.appendChild(freeMeta);
  legend.appendChild(freeRow);
  meter.appendChild(legend);

  return meter;
}

function buildList() {
  const list = el('div', 'sp-cache-list');
  list.dataset.spCacheList = '';
  const entries = listTranslationCacheEntries();
  if (!entries.length) {
    list.appendChild(el('div', 'sp-cache-list__empty', t('cache.listEmpty')));
    return list;
  }
  for (const entry of entries.slice(0, CACHE_LIST_LIMIT)) {
    const item = el('div', 'sp-cache-list__item');
    const main = el('div', 'sp-cache-list__main');
    const label = el('span', 'sp-cache-list__label', truncate(stripPlaceholders(entry.source)));
    label.title = `${providerLabel(entry.provider)} → ${entry.to}`;
    main.appendChild(label);
    const meta = el('div', 'sp-cache-list__meta');
    meta.appendChild(el('span', '', `→ ${entry.to} · ${formatBytes(entry.bytes)}`));
    const remove = el('button', 'sp-button sp-button--ghost sp-cache-list__remove', '×');
    remove.type = 'button';
    remove.dataset.sp = 'cache-remove';
    remove.dataset.spCacheKey = entry.key;
    remove.title = t('cache.removeEntry');
    remove.setAttribute('aria-label', t('cache.removeEntry'));
    meta.appendChild(remove);
    item.append(main, meta);
    list.appendChild(item);
  }
  if (entries.length > CACHE_LIST_LIMIT) {
    list.appendChild(
      el('div', 'sp-cache-list__more', t('cache.listMore', { count: entries.length - CACHE_LIST_LIMIT })),
    );
  }
  return list;
}

export const cacheTab = {
  id: 'cache',
  titleKey: 'tab.cache',
  renderInto(pane) {
    const usageSection = createSection({ icon: 'database', title: t('cache.usage') });
    const meterSlot = el('div', 'sp-cache-meter-slot');
    meterSlot.dataset.spCacheMeter = '';
    usageSection.appendChild(meterSlot);
    pane.appendChild(usageSection);

    const contentsSection = createSection({ icon: 'tag', title: t('cache.contents') });
    const collapser = el('div', 'sp-cache-collapser');
    const toggle = el('button', 'sp-cache-collapser__toggle');
    toggle.type = 'button';
    toggle.dataset.sp = 'cache-list-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    const chevron = el('span', 'sp-cache-collapser__chevron', '▸');
    chevron.setAttribute('aria-hidden', 'true');
    toggle.append(chevron, el('span', '', t('cache.contents')));
    const count = el('span', 'sp-cache-collapser__count', '');
    count.dataset.spCacheListCount = '';
    toggle.appendChild(count);
    collapser.appendChild(toggle);
    const listSlot = el('div', '');
    listSlot.dataset.spCacheList = '';
    collapser.appendChild(listSlot);
    contentsSection.appendChild(collapser);
    pane.appendChild(contentsSection);

    const clearSection = createSection({ icon: 'engine', title: t('cache.clear') });
    const row = el('div', 'sp-cache-row');
    const clearButton = createButton(t('cache.clear'), () => {
      const stats = getTranslationCacheStats();
      clearTranslationCache();
      const overlay = document.getElementById('sp-panel-overlay');
      const status = overlay?.querySelector('[data-sp-cache-status]');
      if (status) {
        status.textContent = stats.totalCount > 0
          ? t('cache.cleared', { count: stats.totalCount })
          : t('cache.empty');
      }
      if (overlay) paintCachePane(overlay);
    }, 'sp-button--danger');
    clearButton.dataset.sp = 'cache-clear';
    row.appendChild(clearButton);
    clearSection.appendChild(row);
    clearSection.appendChild(createHint(t('cache.clearHint')));
    const status = el('p', 'sp-cache-status', '');
    status.dataset.spCacheStatus = '';
    status.setAttribute('aria-live', 'polite');
    clearSection.appendChild(status);
    pane.appendChild(clearSection);
  },
};

export function paintCachePane(root, { removeKey } = {}) {
  if (removeKey) {
    if (removeTranslationCacheEntry(removeKey)) persistCacheNow();
    const status = root.querySelector?.('[data-sp-cache-status]');
    if (status) status.textContent = t('cache.cleared', { count: 1 });
  }
  const stats = getTranslationCacheStats();
  const meterSlot = root.querySelector?.('[data-sp-cache-meter]');
  if (meterSlot) meterSlot.replaceWith(buildMeter(stats));
  const listSlot = root.querySelector?.('[data-sp-cache-list]');
  if (listSlot) {
    const expanded = root.querySelector?.('[data-sp="cache-list-toggle"]')?.getAttribute('aria-expanded') === 'true';
    const list = buildList();
    list.hidden = !expanded;
    listSlot.replaceWith(list);
  }
  const badge = root.querySelector?.('[data-sp-cache-tab-badge]');
  if (badge) badge.replaceWith(buildBadge(stats));
  const countEl = root.querySelector?.('[data-sp-cache-list-count]');
  if (countEl) countEl.textContent = t('cache.entries', { count: stats.totalCount });
}
