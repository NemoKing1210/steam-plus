import { el } from '../../../utils/dom.js';
import { t } from '../../../i18n/index.js';
import {
  createField,
  createHint,
  createSection,
  createSegmented,
  createSwitchCell,
  createSwitchRow,
} from '../controls.js';
import { GAMEPAGE_BLOCKS } from '../../gamepage/blocks.js';

export const gamepageTab = {
  id: 'gamepage',
  titleKey: 'tab.gamepage',
  icon: 'grid',
  descKey: 'tab.gamepage.desc',
  renderInto(pane, draft) {
    const gp = draft.gamepage;

    const mainSection = createSection({ icon: 'grid', title: t('gamepage.title') });
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
    // Early Access lives in its own tri-state section below, not as a plain hide switch.
    for (const block of GAMEPAGE_BLOCKS) {
      if (block.id === 'earlyaccess') continue;
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

    const eaSection = createSection({ icon: 'grid', title: t('gamepage.earlyAccess') });
    eaSection.appendChild(createHint(t('gamepage.earlyAccessDesc')));
    gp.hidden ??= {};
    gp.compact ??= {};
    const eaMode = gp.hidden.earlyaccess === true ? 'hidden' : gp.compact.earlyaccess === true ? 'compact' : 'full';
    eaSection.appendChild(
      createField({
        control: createSegmented(
          [
            { value: 'full', label: t('earlyAccess.full') },
            { value: 'compact', label: t('earlyAccess.compact') },
            { value: 'hidden', label: t('earlyAccess.hidden') },
          ],
          eaMode,
          (value) => {
            gp.hidden.earlyaccess = value === 'hidden';
            gp.compact.earlyaccess = value === 'compact';
          },
        ),
      }),
    );
    pane.appendChild(eaSection);
  },
};
