import { el } from '../../../utils/dom.js';
import { t } from '../../../i18n/index.js';
import {
  createButton,
  createField,
  createHint,
  createNumberInput,
  createSection,
  createSelect,
  createSegmented,
  createSwitchRow,
  createTextInput,
} from '../controls.js';
import {
  clearRegionCache,
  formatRegionCacheBytes,
  getRegionCacheStats,
} from '../../region/cache.js';
import { bypassRegionBlock, isRegionInjected } from '../../region/bypass.js';
import { isRegionBlockedPage } from '../../region/detect.js';

const PROXY_MODES = ['gateway', 'path', 'query'];

function cacheStatusLine() {
  const stats = getRegionCacheStats();
  if (!stats.count) return t('region.cacheEmpty');
  return t('region.cacheStatus', {
    count: stats.count,
    size: formatRegionCacheBytes(stats.bytes),
  });
}

export const regionTab = {
  id: 'region',
  titleKey: 'tab.region',
  icon: 'globe',
  descKey: 'tab.region.desc',
  renderInto(pane, draft) {
    const rg = draft.region;

    const mainSection = createSection({ icon: 'globe', title: t('region.title') });
    mainSection.appendChild(createHint(t('region.desc')));
    mainSection.appendChild(
      createSwitchRow({
        checked: rg.enabled !== false,
        label: t('region.enabled'),
        onChange: (checked) => {
          rg.enabled = checked;
        },
      }),
    );
    mainSection.appendChild(createHint(t('region.enabledDesc')));
    mainSection.appendChild(
      createField({
        label: t('region.mode'),
        hint: t('region.modeDesc'),
        control: createSegmented(
          [
            { value: 'auto', label: t('regionMode.auto'), icon: 'bolt' },
            { value: 'manual', label: t('regionMode.manual'), icon: 'cursor' },
          ],
          rg.mode,
          (value) => {
            rg.mode = value;
          },
        ),
      }),
    );
    mainSection.appendChild(
      createField({
        label: t('region.country'),
        hint: t('region.countryDesc'),
        control: createTextInput({
          value: rg.countryCode || '',
          placeholder: t('region.countryPlaceholder'),
          maxLength: 2,
          onChange: (value) => {
            rg.countryCode = String(value || '').trim().toUpperCase();
          },
        }),
      }),
    );
    pane.appendChild(mainSection);

    const cacheSection = createSection({ icon: 'database', title: t('region.cache') });
    cacheSection.appendChild(createHint(t('region.cacheDesc')));
    cacheSection.appendChild(
      createField({
        label: t('region.cacheMinutes'),
        hint: t('region.cacheMinutesDesc'),
        control: createNumberInput({
          value: rg.cacheMinutes,
          min: 0,
          max: 10080,
          step: 1,
          onChange: (value) => {
            rg.cacheMinutes = value;
          },
        }),
      }),
    );
    cacheSection.appendChild(
      createField({
        label: t('region.cacheMax'),
        hint: t('region.cacheMaxDesc'),
        control: createNumberInput({
          value: rg.cacheMaxEntries,
          min: 1,
          max: 100,
          step: 1,
          onChange: (value) => {
            rg.cacheMaxEntries = value;
          },
        }),
      }),
    );
    const status = createHint(cacheStatusLine());
    cacheSection.appendChild(status);
    const row = el('div', 'sp-cache-row');
    row.appendChild(
      createButton(
        t('region.cacheClear'),
        () => {
          const count = clearRegionCache();
          status.textContent =
            count > 0
              ? t('region.cacheCleared', { count })
              : t('region.cacheEmpty');
        },
        'sp-button--ghost',
      ),
    );
    if (isRegionBlockedPage() && !isRegionInjected() && rg.enabled !== false) {
      row.appendChild(
        createButton(t('region.reload'), () => {
          bypassRegionBlock({ forceRefresh: true });
        }),
      );
    }
    cacheSection.appendChild(row);
    pane.appendChild(cacheSection);

    const proxySection = createSection({ icon: 'swap', title: t('region.proxy') });
    proxySection.appendChild(createHint(t('region.proxyDesc')));
    proxySection.appendChild(
      createSwitchRow({
        checked: rg.proxyEnabled === true,
        label: t('region.proxyEnabled'),
        onChange: (checked) => {
          rg.proxyEnabled = checked;
        },
      }),
    );
    proxySection.appendChild(
      createField({
        label: t('region.proxyMode'),
        hint: t('region.proxyModeDesc'),
        control: createSelect(
          PROXY_MODES.map((mode) => ({ value: mode, label: t(`regionProxyMode.${mode}`) })),
          rg.proxyMode,
          (value) => {
            rg.proxyMode = value;
          },
        ),
      }),
    );
    proxySection.appendChild(
      createField({
        label: t('region.proxyHost'),
        control: createTextInput({
          value: rg.proxyHost || '',
          placeholder: '127.0.0.1',
          maxLength: 253,
          onChange: (value) => {
            rg.proxyHost = String(value || '').trim();
          },
        }),
      }),
    );
    proxySection.appendChild(
      createField({
        label: t('region.proxyPort'),
        control: createTextInput({
          value: rg.proxyPort || '',
          placeholder: '8765',
          maxLength: 5,
          inputMode: 'numeric',
          onChange: (value) => {
            rg.proxyPort = String(value || '').trim();
          },
        }),
      }),
    );
    proxySection.appendChild(
      createField({
        label: t('region.proxyUser'),
        control: createTextInput({
          value: rg.proxyUser || '',
          maxLength: 128,
          onChange: (value) => {
            rg.proxyUser = String(value || '');
          },
        }),
      }),
    );
    proxySection.appendChild(
      createField({
        label: t('region.proxyPass'),
        control: createTextInput({
          value: rg.proxyPass || '',
          maxLength: 256,
          type: 'password',
          onChange: (value) => {
            rg.proxyPass = String(value || '');
          },
        }),
      }),
    );
    pane.appendChild(proxySection);
  },
};
