import { el } from '../../../utils/dom.js';
import { t } from '../../../i18n/index.js';
import {
  createHint,
  createSection,
  createSwitchCell,
  createSwitchRow,
} from '../controls.js';
import { GAMEPAGE_BLOCKS } from '../../gamepage/blocks.js';

export const gamepageTab = {
  id: 'gamepage',
  titleKey: 'tab.gamepage',
  icon: 'eyeOff',
  descKey: 'tab.gamepage.desc',
  renderInto(pane, draft) {
    const gp = draft.gamepage;

    const mainSection = createSection({ icon: 'eyeOff', title: t('gamepage.title') });
    mainSection.appendChild(createHint(t('gamepage.desc')));
    mainSection.appendChild(
      createSwitchRow({
        checked: gp.enabled !== false,
        label: t('gamepage.enabled'),
        onChange: (checked) => {
          gp.enabled = checked;
        },
      }),
    );
    mainSection.appendChild(createHint(t('gamepage.enabledDesc')));
    pane.appendChild(mainSection);

    const blocksSection = createSection({ icon: 'tag', title: t('gamepage.blocks') });
    blocksSection.appendChild(createHint(t('gamepage.blocksDesc')));
    const blocksList = el('div', 'sp-switch-grid');
    for (const block of GAMEPAGE_BLOCKS) {
      blocksList.appendChild(
        createSwitchCell({
          label: t(block.labelKey),
          checked: gp.hidden[block.id] === true,
          onChange: (checked) => {
            gp.hidden[block.id] = checked;
          },
        }),
      );
    }
    blocksSection.appendChild(blocksList);
    pane.appendChild(blocksSection);
  },
};
