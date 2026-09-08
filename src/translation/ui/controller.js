import { Codes, logError, previewText } from '../../core/debug.js';
import { t } from '../../i18n/index.js';
import { showToast } from '../../ui/toast.js';
import { el, resolveTargetLanguage } from '../../utils/dom.js';
import { extractRich, mirrorBlockTag, restoreFragment } from '../rich.js';

const ICON_GLOBE =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"/></svg>';

/**
 * Controls translation of a single DOM element:
 * injects the translate button, fetches and renders the translation
 * according to the current settings (below / replace).
 *
 * Content travels as structure-preserving blocks (see `../rich.js`):
 * paragraphs, headings and list items are translated separately while
 * links, images, line breaks and code keep their nodes, so the rendered
 * translation mirrors the original layout instead of a flat text blob.
 */
export class TranslatableNode {
  static autoId = 0;

  /** @param {Element} element */
  constructor(element) {
    this.element = element;
    this.id = `sp-node-${++TranslatableNode.autoId}`;
    this.scopeId = null;
    this.blocks = [];
    this.originalText = '';
    this.translatedBlocks = null;
    this.translatedTo = null;
    this.translatedProvider = null;
    this.state = 'idle'; // idle | loading | done | error
    this.button = null;
    this.labelNode = null;
    this.translationBox = null;
    this.settings = null;
    this.translateFn = null;
    this.placeButton = null;
    this.visible = false;
    this.attached = false;
    this.destroyed = false;
  }

  get blockTexts() {
    return this.blocks.map((block) => block.text);
  }

  /** Bind current settings and attach UI (hidden until revealed). */
  attach(settings, translateFn) {
    if (this.attached) return;
    const { blocks, plainText } = extractRich(this.element);
    if (!blocks.length) return;
    this.blocks = blocks;
    this.originalText = plainText;
    this.attached = true;
    this.translateFn = translateFn;
    this.settings = settings;

    this.button = this.createButton(this.id);
    this.button.classList.add('sp-translate-btn--pending');
    this.positionButton();
  }

  /** Place the button for the current display mode and target hook. */
  positionButton() {
    if (!this.button) return;
    this.button.classList.remove(
      'sp-translate-btn--replace',
      'sp-translate-btn--actions',
      'sp-translate-btn--above',
    );
    if (this.settings.display === 'replace') {
      // The button toggles between original and translated content and
      // leads the block so it is seen before the text it controls.
      this.button.classList.add('sp-translate-btn--replace');
      this.element.insertBefore(this.button, this.element.firstChild);
    } else if (typeof this.placeButton === 'function') {
      this.placeButton(this.button, this.element);
    } else {
      this.button.classList.add('sp-translate-btn--above');
      this.element.insertAdjacentElement('beforebegin', this.button);
    }
  }

  /** Mark near-viewport: show the button (auto-translate is engine-driven). */
  setVisible() {
    this.visible = true;
    this.button?.classList.remove('sp-translate-btn--pending');
  }

  createButton(id) {
    const button = el('button', 'sp-translate-btn');
    button.id = `${id}-btn`;
    button.type = 'button';
    const icon = el('span', 'sp-translate-btn__icon');
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = ICON_GLOBE;
    this.labelNode = el('span', 'sp-translate-btn__label', t('translate.button'));
    button.append(icon, this.labelNode);
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.onButtonClick();
    });
    return button;
  }

  setLoading(loading) {
    this.button?.classList.toggle('is-loading', loading);
    const icon = this.button?.querySelector('.sp-translate-btn__icon');
    if (icon) icon.innerHTML = loading ? '<span class="sp-translate-btn__spinner"></span>' : ICON_GLOBE;
  }

  onButtonClick() {
    switch (this.state) {
      case 'idle':
      case 'error':
        void this.translate();
        break;
      case 'done':
        if (this.settings.display === 'replace') {
          if (this.element.dataset.spTranslated === 'true') this.renderOriginal();
          else this.renderTranslation();
        } else {
          this.removeTranslationBox();
          this.state = 'idle';
          this.setButtonLabel(t('translate.button'));
        }
        break;
      default:
        break;
    }
  }

  setButtonLabel(label) {
    if (this.labelNode) this.labelNode.textContent = label;
  }

  currentTargetLanguage() {
    try {
      return resolveTargetLanguage(this.settings.targetLanguage);
    } catch {
      return '';
    }
  }

  async translate() {
    if (this.state === 'loading') return;
    this.state = 'loading';
    this.button?.classList.remove('sp-translate-btn--error');
    this.setButtonLabel(t('translate.loadingShort'));
    this.setLoading(true);
    try {
      const translated = await this.translateFn(this.blockTexts);
      if (this.destroyed) return;
      this.blocks.forEach((block, index) => {
        block.translated = translated[index] ?? '';
      });
      this.translatedBlocks = this.blocks.map((block) => block.translated);
      this.translatedTo = this.currentTargetLanguage();
      this.translatedProvider = this.settings.provider;
      this.state = 'done';
      this.setLoading(false);
      this.renderTranslation();
    } catch (error) {
      if (this.destroyed) return;
      this.state = 'error';
      this.setLoading(false);
      this.setButtonLabel(t('translate.retry'));
      this.button?.classList.add('sp-translate-btn--error');
      logError(Codes.TRANSLATE_FAILED, 'translation failed', {
        scope: this.scopeId,
        provider: error?.details?.provider,
        to: error?.details?.to,
        blocks: this.blocks.length,
        chars: this.originalText?.length ?? 0,
        preview: previewText(this.originalText),
        cause: error?.code,
        error,
      });
      this.notifyFailure(error);
    }
  }

  /** Human-readable toast for a failed block; throttled failures dedup. */
  notifyFailure(error) {
    const retryAction = {
      label: t('translate.retry'),
      tone: 'primary',
      onClick: () => {
        if (!this.destroyed) void this.translate();
      },
    };
    if (error?.code === Codes.UNKNOWN_PROVIDER) {
      showToast({
        type: 'error',
        title: t('toast.unknownProvider'),
        message: t('toast.unknownProviderDesc'),
        key: 'sp-translate-provider',
      });
      return;
    }
    if (error?.details?.status === 429) {
      showToast({
        type: 'warning',
        title: t('toast.rateLimited'),
        message: t('toast.rateLimitedDesc'),
        key: 'sp-translate-throttled',
        actions: [retryAction],
      });
      return;
    }
    showToast({
      type: 'error',
      title: t('toast.translateFailed'),
      message: t('toast.translateFailedDesc'),
      key: `sp-translate-failed-${this.scopeId ?? 'block'}`,
      actions: [retryAction],
    });
  }

  renderTranslation() {
    this.button?.classList.remove('sp-translate-btn--error');
    if (this.settings.display === 'replace') {
      this.element.dataset.spTranslated = 'true';
      this.renderReplace();
      this.setButtonLabel(t('translate.original'));
    } else {
      this.removeTranslationBox();
      this.translationBox = this.renderMirror();
      this.element.insertAdjacentElement('afterend', this.translationBox);
      this.setButtonLabel(t('translate.original'));
    }
  }

  /** Below mode: a mirror of the original structure with translated text. */
  renderMirror() {
    const box = el('div', 'sp-translation sp-translation-rich');
    box.id = `${this.id}-translation`;
    const to = this.currentTargetLanguage();
    if (to) box.setAttribute('lang', to);
    let list = null;
    let listKind = null;
    const flushList = () => {
      if (list) box.append(list);
      list = null;
      listKind = null;
    };
    this.blocks.forEach((block, index) => {
      const translated = this.translatedBlocks?.[index] ?? block.translated ?? '';
      if (block.listKind && block.tag === 'li') {
        if (!list || listKind !== block.listKind) {
          flushList();
          listKind = block.listKind;
          list = el(block.listKind === 'ol' ? 'ol' : 'ul', 'sp-translation__list');
        }
        const item = el('li');
        item.append(restoreFragment(block, translated));
        list.append(item);
        return;
      }
      flushList();
      const para = el(mirrorBlockTag(block.tag));
      para.append(restoreFragment(block, translated));
      box.append(para);
    });
    flushList();
    return box;
  }

  /** Replace mode: swap each block's content in place, structure intact. */
  renderReplace() {
    for (const block of this.blocks) {
      const fragment = restoreFragment(block, block.translated ?? '');
      if (block.element?.isConnected) {
        const host = block.element;
        [...host.childNodes].forEach((node) => {
          if (node !== this.button) node.remove();
        });
        host.append(fragment);
      } else if (block.parent?.isConnected) {
        const anchor = this.anonAnchor(block);
        for (const node of block.liveNodes) {
          if (node.parentNode === block.parent) node.remove();
        }
        const inserted = [...fragment.childNodes];
        block.parent.insertBefore(fragment, anchor);
        block.rendered = inserted;
      }
    }
  }

  anonAnchor(block) {
    const last = block.liveNodes[block.liveNodes.length - 1];
    if (last?.isConnected && last.parentNode === block.parent) return last.nextSibling;
    return null;
  }

  restoreBlock(block) {
    const clones = () =>
      (block.originalNodes ?? []).map((node) => node.cloneNode(true));
    if (block.element?.isConnected) {
      const host = block.element;
      [...host.childNodes].forEach((node) => {
        if (node !== this.button) node.remove();
      });
      const fragment = document.createDocumentFragment();
      for (const node of clones()) fragment.append(node);
      if (host === this.element && this.button?.parentNode === host) {
        this.button.insertAdjacentElement('afterend', fragment);
      } else {
        host.append(fragment);
      }
      block.rendered = [];
    } else if (block.parent?.isConnected) {
      for (const node of block.rendered) {
        if (node.parentNode === block.parent) node.remove();
      }
      const anchor = this.anonAnchor(block);
      const fragment = document.createDocumentFragment();
      for (const node of clones()) fragment.append(node);
      block.parent.insertBefore(fragment, anchor);
      block.rendered = [];
    }
  }

  restoreOriginalDom() {
    for (const block of this.blocks) {
      try {
        this.restoreBlock(block);
      } catch {
        /* a re-rendered Steam subtree: nothing left to restore */
      }
    }
    delete this.element.dataset.spTranslated;
  }

  renderOriginal() {
    if (this.settings.display === 'replace') {
      this.restoreOriginalDom();
      this.setButtonLabel(t('translate.button'));
    } else {
      this.removeTranslationBox();
      this.setButtonLabel(t('translate.button'));
      this.state = 'idle';
    }
  }

  removeTranslationBox() {
    this.translationBox?.remove();
    this.translationBox = null;
  }

  /** Called when translation settings change. */
  onConfigChange(settings) {
    if (this.destroyed) return;
    const previousTrigger = this.settings.trigger;
    const previousDisplay = this.settings.display;
    this.settings = settings;

    let becameIdle = false;
    if (
      this.state === 'done' &&
      (settings.provider !== this.translatedProvider ||
        this.currentTargetLanguage() !== this.translatedTo)
    ) {
      this.restoreOriginalDom();
      this.removeTranslationBox();
      this.positionButton();
      this.translatedBlocks = null;
      for (const block of this.blocks) block.translated = null;
      this.state = 'idle';
      this.setButtonLabel(t('translate.button'));
      becameIdle = true;
    } else if (previousDisplay !== settings.display) {
      this.restoreOriginalDom();
      this.removeTranslationBox();
      this.positionButton();
      if (this.state === 'done' && this.translatedBlocks) {
        this.renderTranslation();
      } else {
        this.setButtonLabel(t('translate.button'));
        this.state = 'idle';
      }
      return;
    }

    if (
      this.state === 'idle' &&
      this.visible &&
      settings.trigger === 'auto' &&
      (becameIdle || previousTrigger === 'manual')
    ) {
      void this.translate();
    }
  }

  /** Render an already-cached translation without any request. */
  renderCached(translated) {
    if (this.state !== 'idle') return;
    this.blocks.forEach((block, index) => {
      block.translated = translated[index] ?? '';
    });
    this.translatedBlocks = this.blocks.map((block) => block.translated);
    this.translatedTo = this.currentTargetLanguage();
    this.translatedProvider = this.settings.provider;
    this.state = 'done';
    this.renderTranslation();
  }

  /** Remove all UI and restore original content. */
  destroy() {
    this.destroyed = true;
    try {
      this.restoreOriginalDom();
    } catch {
      /* element already gone with the Steam re-render */
    }
    this.removeTranslationBox();
    this.button?.remove();
  }
}
