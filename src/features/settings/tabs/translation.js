import { el } from '../../../utils/dom.js';
import { t } from '../../../i18n/index.js';
import {
  createField,
  createHint,
  createSection,
  createSegmented,
  createSelect,
  createSwitchCell,
  createSwitchRow,
} from '../controls.js';
import { listProviders } from '../../../translation/providers/index.js';
import { listTargets } from '../../../translation/targets/index.js';

const COMMON_TARGET_LANGUAGES = {
  en: 'English',
  ru: 'Русский',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
  'zh-CN': '中文（简体）',
  ja: '日本語',
  ko: '한국어',
  pl: 'Polski',
  it: 'Italiano',
  tr: 'Türkçe',
  uk: 'Українська',
  ar: 'العربية',
  th: 'ไทย',
};

export const translationTab = {
  id: 'translation',
  titleKey: 'tab.translation',
  renderInto(pane, draft) {
    const tr = draft.translation;

    const engineSection = createSection({ icon: 'engine', title: t('translation.title') });
    engineSection.appendChild(createHint(t('translation.desc')));
    engineSection.appendChild(
      createSwitchRow({
        checked: tr.enabled !== false,
        label: t('translation.enabled'),
        onChange: (checked) => {
          tr.enabled = checked;
        },
      }),
    );
    engineSection.appendChild(createHint(t('translation.enabledDesc')));
    const providerOptions = listProviders().map((provider) => ({
      value: provider.id,
      label: t(provider.labelKey),
    }));
    engineSection.appendChild(
      createField({
        label: t('translation.provider'),
        hint: t('translation.providerDesc'),
        control: createSelect(providerOptions, tr.provider, (value) => {
          tr.provider = value;
        }),
      }),
    );
    pane.appendChild(engineSection);

    const behaviorSection = createSection({ icon: 'sliders', title: t('translation.behavior') });
    behaviorSection.appendChild(
      createField({
        label: t('translation.trigger'),
        hint: t('translation.triggerDesc'),
        control: createSegmented(
          [
            { value: 'auto', label: t('trigger.auto'), icon: 'bolt' },
            { value: 'manual', label: t('trigger.manual'), icon: 'cursor' },
          ],
          tr.trigger,
          (value) => {
            tr.trigger = value;
          },
        ),
      }),
    );
    behaviorSection.appendChild(
      createField({
        label: t('translation.display'),
        hint: t('translation.displayDesc'),
        control: createSegmented(
          [
            { value: 'below', label: t('display.below'), icon: 'below' },
            { value: 'replace', label: t('display.replace'), icon: 'swap' },
          ],
          tr.display,
          (value) => {
            tr.display = value;
          },
        ),
      }),
    );
    const languageOptions = [
      { value: 'auto', label: t('targetLanguage.auto') },
      ...Object.entries(COMMON_TARGET_LANGUAGES).map(([code, name]) => ({
        value: code,
        label: name,
      })),
    ];
    behaviorSection.appendChild(
      createField({
        label: t('translation.targetLanguage'),
        hint: t('translation.targetLanguageDesc'),
        control: createSelect(languageOptions, tr.targetLanguage, (value) => {
          tr.targetLanguage = value;
        }),
      }),
    );
    behaviorSection.appendChild(
      createSwitchRow({
        checked: tr.showCached !== false,
        label: t('translation.showCached'),
        onChange: (checked) => {
          tr.showCached = checked;
        },
      }),
    );
    behaviorSection.appendChild(createHint(t('translation.showCachedDesc')));
    pane.appendChild(behaviorSection);

    const scopesSection = createSection({ icon: 'tag', title: t('translation.scopes') });
    scopesSection.appendChild(createHint(t('translation.scopesDesc')));
    const scopesList = el('div', 'sp-switch-grid');
    for (const target of listTargets()) {
      scopesList.appendChild(
        createSwitchCell({
          label: t(target.labelKey),
          checked: tr.scopes[target.id] !== false,
          onChange: (checked) => {
            tr.scopes[target.id] = checked;
          },
        }),
      );
    }
    scopesSection.appendChild(scopesList);
    pane.appendChild(scopesSection);
  },
};
