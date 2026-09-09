import { el } from '../../../utils/dom.js';
import { t } from '../../../i18n/index.js';
import {
  createButton,
  createField,
  createHint,
  createSection,
  createSelect,
  createSegmented,
  createSwitchRow,
  createTextInput,
} from '../controls.js';
import { bypassRegionBlock, isRegionInjected } from '../../region/bypass.js';
import { isRegionBlockedPage } from '../../region/detect.js';

const PROXY_MODES = ['gateway', 'path', 'query'];

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
      createSwitchRow({
        checked: rg.showBanner === true,
        label: t('region.showBanner'),
        onChange: (checked) => {
          rg.showBanner = checked;
        },
      }),
    );
    mainSection.appendChild(createHint(t('region.showBannerDesc')));
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
    if (isRegionBlockedPage() && !isRegionInjected() && rg.enabled !== false) {
      const row = el('div', 'sp-cache-row');
      row.appendChild(
        createButton(t('region.reload'), () => {
          bypassRegionBlock();
        }),
      );
      mainSection.appendChild(row);
    }
    pane.appendChild(mainSection);

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
