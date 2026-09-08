import { el } from '../../utils/dom.js';
import { t } from '../../i18n/index.js';
import { createButton } from './controls.js';

/**
 * Promise-based confirm dialog in Steam Plus chrome.
 *
 * confirmDialog({ title, message, confirmLabel, cancelLabel, tone })
 * resolves to true when the confirm button is pressed and to false on
 * cancel, overlay click or Escape. `tone` picks the confirm button style
 * ('danger' by default, 'primary' for non-destructive confirmations).
 * Only one dialog is open at a time — a second call settles the first
 * with false.
 */
let openSettle = null;

function settleOpen(value) {
  if (openSettle) {
    const settle = openSettle;
    openSettle = null;
    settle(value);
  }
}

export function confirmDialog({
  title,
  message = '',
  confirmLabel,
  cancelLabel = t('common.cancel'),
  tone = 'danger',
} = {}) {
  settleOpen(false);
  return new Promise((resolve) => {
    openSettle = resolve;
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const overlay = el('div', 'sp-confirm-overlay');
    overlay.setAttribute('role', 'presentation');

    const dialog = el('div', 'sp-confirm');
    dialog.setAttribute('role', 'alertdialog');
    dialog.setAttribute('aria-modal', 'true');
    if (title) dialog.setAttribute('aria-label', title);

    if (title) dialog.appendChild(el('div', 'sp-confirm__title', title));
    if (message) dialog.appendChild(el('div', 'sp-confirm__message', message));

    const actions = el('div', 'sp-confirm__actions');
    const cancelButton = createButton(cancelLabel, () => close(false), 'sp-button--ghost');
    const confirmButton = createButton(
      confirmLabel,
      () => close(true),
      tone === 'primary' ? '' : 'sp-button--danger',
    );
    actions.append(cancelButton, confirmButton);
    dialog.appendChild(actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    function close(value) {
      document.removeEventListener('keydown', onKeyDown, true);
      overlay.remove();
      if (openSettle) {
        openSettle = null;
        resolve(value);
      }
      previouslyFocused?.focus?.();
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close(false);
      }
    }

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close(false);
    });
    document.addEventListener('keydown', onKeyDown, true);
    (tone === 'danger' ? cancelButton : confirmButton).focus();
  });
}
