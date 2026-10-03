import { t } from '../../../i18n/index.js';
import { clearDlcCache } from '../../dlc/cache.js';
import {
  createButton,
  createField,
  createHint,
  createSection,
  createSelect,
  createSwitchRow,
} from '../controls.js';

const POSITIONS = ['purchase', 'sidebar', 'description'];
const SORTS = ['missing', 'store'];
const DISPLAY_TOGGLES = [
  ['showSummary', 'dlc.showSummary'],
  ['showOwned', 'dlc.showOwned'],
  ['showPrices', 'dlc.showPrices'],
  ['showThumbnails', 'dlc.showThumbnails'],
  ['showReleaseDate', 'dlc.showReleaseDate'],
];

export const dlcTab = {
  id: 'dlc',
  titleKey: 'tab.dlc',
  icon: 'tag',
  descKey: 'tab.dlc.desc',
  renderInto(pane, draft) {
    const dl = draft.dlc;

    const mainSection = createSection({ icon: 'tag', title: t('dlc.title') });
    mainSection.appendChild(createHint(t('dlc.desc')));
    mainSection.appendChild(
      createSwitchRow({
        checked: dl.enabled !== false,
        label: t('dlc.enabled'),
        onChange: (checked) => {
          dl.enabled = checked;
        },
      }),
    );
    mainSection.appendChild(createHint(t('dlc.enabledDesc')));
    mainSection.appendChild(
      createField({
        label: t('dlc.position'),
        hint: t('dlc.positionDesc'),
        control: createSelect(
          POSITIONS.map((position) => ({ value: position, label: t(`dlcPos.${position}`) })),
          dl.position,
          (value) => {
            dl.position = value;
          },
        ),
      }),
    );
    mainSection.appendChild(
      createField({
        label: t('dlc.sort'),
        hint: t('dlc.sortDesc'),
        control: createSelect(
          SORTS.map((sort) => ({ value: sort, label: t(`dlcSort.${sort}`) })),
          dl.sort,
          (value) => {
            dl.sort = value;
          },
        ),
      }),
    );
    pane.appendChild(mainSection);

    const displaySection = createSection({ icon: 'sliders', title: t('dlc.display') });
    displaySection.appendChild(
      createSwitchRow({
        checked: dl.collapsed === true,
        label: t('dlc.collapsed'),
        onChange: (checked) => {
          dl.collapsed = checked;
        },
      }),
    );
    displaySection.appendChild(createHint(t('dlc.collapsedDesc')));
    for (const [key, labelKey] of DISPLAY_TOGGLES) {
      displaySection.appendChild(
        createSwitchRow({
          checked: dl[key] !== false,
          label: t(labelKey),
          onChange: (checked) => {
            dl[key] = checked;
          },
        }),
      );
    }
    pane.appendChild(displaySection);

    const viewerSection = createSection({ icon: 'eye', title: t('dlc.viewerSection') });
    viewerSection.appendChild(
      createSwitchRow({
        checked: dl.viewer !== false,
        label: t('dlc.viewer'),
        onChange: (checked) => {
          dl.viewer = checked;
        },
      }),
    );
    viewerSection.appendChild(createHint(t('dlc.viewerDesc')));
    viewerSection.appendChild(
      createSwitchRow({
        checked: dl.viewerThumbnails !== false,
        label: t('dlc.viewerThumbnails'),
        onChange: (checked) => {
          dl.viewerThumbnails = checked;
        },
      }),
    );
    viewerSection.appendChild(
      createSwitchRow({
        checked: dl.viewerLoop !== false,
        label: t('dlc.viewerLoop'),
        onChange: (checked) => {
          dl.viewerLoop = checked;
        },
      }),
    );
    pane.appendChild(viewerSection);

    const cacheSection = createSection({ icon: 'database', title: t('dlc.cache') });
    cacheSection.appendChild(createHint(t('dlc.cacheDesc')));
    const status = createHint('');
    status.setAttribute('aria-live', 'polite');
    cacheSection.appendChild(
      createButton(
        t('dlc.clearCache'),
        () => {
          clearDlcCache();
          status.textContent = t('dlc.cacheCleared');
        },
        'sp-button--ghost',
      ),
    );
    cacheSection.appendChild(status);
    pane.appendChild(cacheSection);
  },
};
