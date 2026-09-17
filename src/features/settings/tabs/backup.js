import { SCRIPT_NAME } from '../../../core/constants.js';
import { getSettings, saveSettings } from '../../../core/settings.js';
import { emit } from '../../../core/bus.js';
import { configureLocale, t } from '../../../i18n/index.js';
import { clearTranslationCache } from '../../../translation/cache.js';
import { showToast } from '../../../ui/toast.js';
import { confirmDialog } from '../confirm.js';
import { getScriptVersion, refreshPanelDraft } from '../panel.js';
import { createButton, createHint, createSection } from '../controls.js';

export const BACKUP_SETTINGS_KEYS = [
  'language',
  'translation',
  'gamepage',
  'prices',
  'links',
  'region',
  'toasts',
];

export function buildBackupPayload(settings, version) {
  const picked = {};
  for (const key of BACKUP_SETTINGS_KEYS) {
    if (settings?.[key] !== undefined) picked[key] = settings[key];
  }
  return {
    app: SCRIPT_NAME,
    format: 1,
    exportedAt: new Date().toISOString(),
    version,
    settings: picked,
  };
}

export function parseBackupPayload(text) {
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false };
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false };
  if (data.app !== undefined && data.app !== SCRIPT_NAME) return { ok: false };
  const raw = data.settings && typeof data.settings === 'object' ? data.settings : data;
  const patch = {};
  for (const key of BACKUP_SETTINGS_KEYS) {
    if (raw[key] !== undefined) patch[key] = raw[key];
  }
  if (Object.keys(patch).length === 0) return { ok: false };
  return { ok: true, patch };
}

function applyImportedSettings(patch) {
  const previousTarget = getSettings().translation.targetLanguage;
  saveSettings(patch);
  const next = getSettings();
  configureLocale(next.language);
  emit('settings:language', next.language);
  emit('settings:translation');
  emit('settings:gamepage');
  emit('settings:prices');
  emit('settings:links');
  emit('settings:region');
  if (next.translation.targetLanguage !== previousTarget) clearTranslationCache();
  refreshPanelDraft();
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const backupTab = {
  id: 'backup',
  titleKey: 'tab.backup',
  icon: 'backup',
  descKey: 'tab.backup.desc',
  renderInto(pane) {
    const exportSection = createSection({ icon: 'backup', title: t('backup.export') });
    exportSection.appendChild(createHint(t('backup.exportDesc')));
    const exportStatus = createHint('');
    exportStatus.setAttribute('aria-live', 'polite');
    exportSection.appendChild(
      createButton(t('backup.download'), () => {
        const payload = buildBackupPayload(getSettings(), getScriptVersion());
        downloadTextFile('steam-plus-settings.json', JSON.stringify(payload, null, 2));
      }),
    );
    exportSection.appendChild(
      createButton(
        t('backup.copy'),
        async () => {
          const payload = buildBackupPayload(getSettings(), getScriptVersion());
          try {
            if (!navigator.clipboard) throw new Error('clipboard unavailable');
            await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
            exportStatus.textContent = t('backup.copied');
          } catch {
            exportStatus.textContent = t('backup.copyFailed');
          }
        },
        'sp-button--ghost',
      ),
    );
    exportSection.appendChild(exportStatus);
    pane.appendChild(exportSection);

    const importSection = createSection({ icon: 'backup', title: t('backup.import') });
    importSection.appendChild(createHint(t('backup.importDesc')));
    const importStatus = createHint('');
    importStatus.setAttribute('aria-live', 'polite');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json,.json';
    fileInput.hidden = true;
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      fileInput.value = '';
      if (!file) return;
      let text = '';
      try {
        text = await file.text();
      } catch {
        text = '';
      }
      const parsed = text ? parseBackupPayload(text) : { ok: false };
      if (!parsed.ok) {
        importStatus.textContent = t('backup.importInvalid');
        showToast({ type: 'error', title: t('backup.importInvalid') });
        return;
      }
      const confirmed = await confirmDialog({
        title: t('backup.importConfirmTitle'),
        message: t('backup.importConfirm'),
        confirmLabel: t('backup.import'),
      });
      if (!confirmed) return;
      applyImportedSettings(parsed.patch);
      importStatus.textContent = t('backup.importDone');
      showToast({ type: 'success', title: t('backup.importDone') });
    });
    importSection.appendChild(
      createButton(t('backup.chooseFile'), () => fileInput.click(), 'sp-button--ghost'),
    );
    importSection.appendChild(fileInput);
    importSection.appendChild(importStatus);
    pane.appendChild(importSection);
  },
};
