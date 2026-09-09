import { t } from '../../i18n/index.js';
import { el } from '../../utils/dom.js';
import { resolveLinkUrl } from './template.js';


export function createLinksRoot() {
  const root = el('section', 'sp-links');
  root.setAttribute('aria-label', t('links.title'));
  const head = el('div', 'sp-links__head');
  head.appendChild(el('span', 'sp-links__title', t('links.title')));
  root.appendChild(head);
  root.appendChild(el('div', 'sp-links__body'));
  return root;
}

function fallbackLetter(name) {
  const letter = name.trim().charAt(0).toUpperCase() || '?';
  return el('span', 'sp-links__letter', letter);
}

function chipIcon(link) {
  if (!link.icon) return fallbackLetter(link.name);
  const img = el('img', 'sp-links__icon');
  img.src = link.icon;
  img.alt = '';
  img.loading = 'lazy';
  img.referrerPolicy = 'no-referrer';
  img.addEventListener('error', () => {
    img.replaceWith(fallbackLetter(link.name));
  });
  return img;
}

/**
 * Paint enabled links as chips. Links whose template cannot resolve
 * for this page are skipped, so a bad template never renders a dead chip.
 */
export function paintLinks(root, { context, items, openInNewTab }) {
  const body = root.querySelector('.sp-links__body');
  body.textContent = '';
  let painted = 0;
  for (const link of items) {
    if (link?.enabled === false) continue;
    const href = resolveLinkUrl(link?.url, context);
    if (!href) continue;
    const chip = el('a', 'sp-links__chip');
    chip.href = href;
    chip.title = href;
    if (openInNewTab !== false) {
      chip.target = '_blank';
      chip.rel = 'noopener noreferrer';
    }
    chip.append(chipIcon(link), el('span', 'sp-links__label', link.name));
    body.appendChild(chip);
    painted += 1;
  }
  root.hidden = painted === 0;
  return painted;
}
