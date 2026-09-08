import { LOCALE_NATIVE_NAMES, SUPPORTED_LOCALES } from '../../../i18n/index.js';
import { t } from '../../../i18n/index.js';
import {
  createField,
  createHint,
  createNumberInput,
  createSection,
  createSelect,
  createSwitchRow,
} from '../controls.js';

const TOAST_POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];

export const generalTab = {
  id: 'general',
  titleKey: 'tab.general',
  renderInto(pane, draft) {
    const languageSection = createSection({ icon: 'globe', title: t('general.language') });
    const languageOptions = [
      { value: 'auto', label: t('common.auto') },
      ...SUPPORTED_LOCALES.map((locale) => ({
        value: locale,
        label: LOCALE_NATIVE_NAMES[locale],
      })),
    ];
    const languageSelect = createSelect(
      languageOptions,
      draft.language,
      (value) => {
        draft.language = value;
      },
    );
    languageSelect.classList.add('sp-select--block');
    languageSection.appendChild(
      createField({ control: languageSelect, hint: t('general.languageDesc') }),
    );
    pane.appendChild(languageSection);

    const toastsSection = createSection({ icon: 'bell', title: t('general.toasts') });
    toastsSection.appendChild(
      createSwitchRow({
        checked: draft.toasts.enabled !== false,
        label: t('toasts.enabled'),
        onChange: (checked) => {
          draft.toasts.enabled = checked;
        },
      }),
    );
    toastsSection.appendChild(createHint(t('toasts.enabledDesc')));
    const positionOptions = TOAST_POSITIONS.map((position) => ({
      value: position,
      label: t(`toastPos.${position}`),
    }));
    toastsSection.appendChild(
      createField({
        label: t('toasts.position'),
        control: createSelect(positionOptions, draft.toasts.position, (value) => {
          draft.toasts.position = value;
        }),
      }),
    );
    toastsSection.appendChild(
      createField({
        label: t('toasts.duration'),
        hint: t('toasts.durationDesc'),
        control: createNumberInput({
          value: Math.round(draft.toasts.duration / 1000),
          min: 0,
          max: 120,
          onChange: (seconds) => {
            draft.toasts.duration = seconds * 1000;
          },
        }),
      }),
    );
    pane.appendChild(toastsSection);

    pane.appendChild(createHint(t('general.saveHint')));
  },
};
