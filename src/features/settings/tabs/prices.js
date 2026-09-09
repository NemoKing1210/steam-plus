import { el } from '../../../utils/dom.js';
import { t } from '../../../i18n/index.js';
import {
  createButton,
  createField,
  createHint,
  createSection,
  createSelect,
  createSwitchCell,
  createSwitchRow,
} from '../controls.js';
import { PRICE_REGIONS } from '../../prices/regions.js';
import { clearFxCache, peekFxCache } from '../../prices/fx.js';

const POSITIONS = ['purchase', 'sidebar', 'description'];
const SORTS = ['custom', 'priceAsc', 'discountDesc'];
const FX_TTLS = [
  { value: 3600000, key: '1h' },
  { value: 21600000, key: '6h' },
  { value: 86400000, key: '24h' },
  { value: 604800000, key: '7d' },
];

function fxCacheStatus() {
  const cached = peekFxCache();
  if (!cached?.rates) return t('prices.fxCacheEmpty');
  let date = '';
  try {
    date = new Date(cached.ts).toLocaleString();
  } catch {
    date = '';
  }
  return t('prices.fxCached', { provider: cached.provider ?? '?', date });
}

const TARGET_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'PLN', 'UAH', 'RUB', 'KZT', 'BRL', 'JPY',
  'CNY', 'KRW', 'INR', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'MXN',
  'AED', 'SGD', 'CZK',
];

export const pricesTab = {
  id: 'prices',
  titleKey: 'tab.prices',
  icon: 'cash',
  descKey: 'tab.prices.desc',
  renderInto(pane, draft) {
    const pr = draft.prices;

    const mainSection = createSection({ icon: 'cash', title: t('prices.title') });
    mainSection.appendChild(createHint(t('prices.desc')));
    mainSection.appendChild(
      createSwitchRow({
        checked: pr.enabled !== false,
        label: t('prices.enabled'),
        onChange: (checked) => {
          pr.enabled = checked;
        },
      }),
    );
    mainSection.appendChild(createHint(t('prices.enabledDesc')));
    mainSection.appendChild(
      createSwitchRow({
        checked: pr.autoLoad !== false,
        label: t('prices.autoLoad'),
        onChange: (checked) => {
          pr.autoLoad = checked;
        },
      }),
    );
    mainSection.appendChild(createHint(t('prices.autoLoadDesc')));
    mainSection.appendChild(
      createField({
        label: t('prices.position'),
        hint: t('prices.positionDesc'),
        control: createSelect(
          POSITIONS.map((position) => ({ value: position, label: t(`pricesPos.${position}`) })),
          pr.position,
          (value) => {
            pr.position = value;
          },
        ),
      }),
    );
    mainSection.appendChild(
      createField({
        label: t('prices.sort'),
        hint: t('prices.sortDesc'),
        control: createSelect(
          SORTS.map((sort) => ({ value: sort, label: t(`pricesSort.${sort}`) })),
          pr.sort,
          (value) => {
            pr.sort = value;
          },
        ),
      }),
    );
    pane.appendChild(mainSection);

    const conversionSection = createSection({ icon: 'swap', title: t('prices.conversion') });
    conversionSection.appendChild(createHint(t('prices.conversionDesc')));
    conversionSection.appendChild(
      createField({
        label: t('prices.convertTo'),
        hint: t('prices.convertToDesc'),
        control: createSelect(
          [
            { value: 'auto', label: t('convertTo.auto') },
            { value: 'off', label: t('convertTo.off') },
            ...TARGET_CURRENCIES.map((code) => ({ value: code, label: code })),
          ],
          pr.convertTo,
          (value) => {
            pr.convertTo = value;
          },
        ),
      }),
    );
    conversionSection.appendChild(
      createSwitchRow({
        checked: pr.showConverted !== false,
        label: t('prices.showConverted'),
        onChange: (checked) => {
          pr.showConverted = checked;
        },
      }),
    );
    conversionSection.appendChild(
      createField({
        label: t('prices.fxCache'),
        hint: t('prices.fxCacheDesc'),
        control: createSelect(
          FX_TTLS.map(({ value, key }) => ({ value, label: t(`fxTtl.${key}`) })),
          pr.fxTtl,
          (value) => {
            pr.fxTtl = Number(value);
          },
        ),
      }),
    );
    const fxStatus = createHint(fxCacheStatus());
    conversionSection.appendChild(fxStatus);
    conversionSection.appendChild(
      createButton(t('prices.fxClear'), () => {
        clearFxCache();
        fxStatus.textContent = t('prices.fxCacheEmpty');
      }, 'sp-button--ghost'),
    );
    pane.appendChild(conversionSection);

    const regionsSection = createSection({ icon: 'globe', title: t('prices.regions') });
    regionsSection.appendChild(createHint(t('prices.regionsDesc')));
    const regionsList = el('div', 'sp-switch-grid');
    for (const region of PRICE_REGIONS) {
      regionsList.appendChild(
        createSwitchCell({
          label: `${region.name} · ${region.currency}`,
          checked: pr.regions.includes(region.cc),
          onChange: (checked) => {
            const next = new Set(pr.regions);
            if (checked) next.add(region.cc);
            else next.delete(region.cc);
            pr.regions = PRICE_REGIONS.filter((entry) => next.has(entry.cc)).map((entry) => entry.cc);
          },
        }),
      );
    }
    regionsSection.appendChild(regionsList);
    pane.appendChild(regionsSection);

    const displaySection = createSection({ icon: 'sliders', title: t('prices.display') });
    displaySection.appendChild(
      createSwitchRow({
        checked: pr.collapsed === true,
        label: t('prices.collapsed'),
        onChange: (checked) => {
          pr.collapsed = checked;
        },
      }),
    );
    displaySection.appendChild(createHint(t('prices.collapsedDesc')));
    const toggles = [
      ['showOriginal', 'prices.showOriginal'],
      ['showDiscount', 'prices.showDiscount'],
      ['showSavings', 'prices.showSavings'],
      ['highlightCheapest', 'prices.highlightCheapest'],
      ['showHomeRow', 'prices.showHomeRow'],
    ];
    for (const [key, labelKey] of toggles) {
      displaySection.appendChild(
        createSwitchRow({
          checked: pr[key] !== false,
          label: t(labelKey),
          onChange: (checked) => {
            pr[key] = checked;
          },
        }),
      );
    }
    pane.appendChild(displaySection);
  },
};
