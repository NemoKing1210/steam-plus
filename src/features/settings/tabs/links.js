import { el } from '../../../utils/dom.js';
import { t } from '../../../i18n/index.js';
import { getDefaults } from '../../../core/constants.js';
import { LINK_POSITIONS, MAX_LINKS, makeLinkId } from '../../../core/settings.js';
import {
  createButton,
  createField,
  createHint,
  createSection,
  createSelect,
  createSwitchRow,
  createTextInput,
} from '../controls.js';
import {
  getGameContext,
  isValidLinkTemplate,
  resolveLinkUrl,
} from '../../links/template.js';

function previewContext() {
  return getGameContext() ?? { appid: '440', name: 'Team Fortress 2' };
}

function faviconPreview(link, sizeClass) {
  const holder = el('span', `sp-link-card__favicon ${sizeClass ?? ''}`.trim());
  if (link.icon) {
    const img = el('img', 'sp-links__icon');
    img.src = link.icon;
    img.alt = '';
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => {
      holder.textContent = '';
      holder.appendChild(el('span', 'sp-links__letter', (link.name.trim().charAt(0).toUpperCase() || '?')));
    });
    holder.appendChild(img);
  } else {
    holder.appendChild(el('span', 'sp-links__letter', (link.name.trim().charAt(0).toUpperCase() || '?')));
  }
  return holder;
}

function moveItem(items, from, to) {
  if (to < 0 || to >= items.length) return false;
  const [entry] = items.splice(from, 1);
  items.splice(to, 0, entry);
  return true;
}

export const linksTab = {
  id: 'links',
  titleKey: 'tab.links',
  icon: 'cursor',
  descKey: 'tab.links.desc',
  renderInto(pane, draft) {
    const ln = draft.links;
    if (!Array.isArray(ln.items)) ln.items = [];
    const context = previewContext();

    const mainSection = createSection({ icon: 'cursor', title: t('links.title') });
    mainSection.appendChild(createHint(t('links.desc')));
    mainSection.appendChild(
      createSwitchRow({
        checked: ln.enabled !== false,
        label: t('links.enabled'),
        onChange: (checked) => {
          ln.enabled = checked;
        },
      }),
    );
    mainSection.appendChild(createHint(t('links.enabledDesc')));
    mainSection.appendChild(
      createField({
        label: t('links.position'),
        hint: t('links.positionDesc'),
        control: createSelect(
          LINK_POSITIONS.map((position) => ({ value: position, label: t(`pricesPos.${position}`) })),
          ln.position,
          (value) => {
            ln.position = value;
          },
        ),
      }),
    );
    mainSection.appendChild(
      createSwitchRow({
        checked: ln.openInNewTab !== false,
        label: t('links.newTab'),
        onChange: (checked) => {
          ln.openInNewTab = checked;
        },
      }),
    );
    mainSection.appendChild(createHint(t('links.newTabDesc')));
    pane.appendChild(mainSection);

    const listSection = createSection({ icon: 'tag', title: t('links.list') });
    listSection.appendChild(createHint(t('links.listDesc')));
    listSection.appendChild(createHint(t('links.templateHelp')));
    const list = el('div', 'sp-link-list');
    listSection.appendChild(list);

    const paintPreview = (card, link) => {
      const line = card.querySelector('[data-sp-link-preview]');
      const open = card.querySelector('[data-sp-link-open]');
      const title = card.querySelector('[data-sp-link-name]');
      const icon = card.querySelector('[data-sp-link-favicon]');
      if (title) title.textContent = link.name || '—';
      if (icon) {
        const next = faviconPreview(link);
        icon.replaceWith(next);
        next.setAttribute('data-sp-link-favicon', '');
      }
      const href = link.name && link.url ? resolveLinkUrl(link.url, context) : null;
      if (line) {
        line.textContent = href ? `${t('links.preview')}: ${href}` : '';
        line.hidden = !href;
      }
      if (open) {
        open.hidden = !href;
        if (href) open.href = href;
      }
    };

    const renderList = () => {
      list.textContent = '';
      if (!ln.items.length) {
        list.appendChild(createHint(t('links.empty')));
      }
      ln.items.forEach((link, index) => {
        const card = el('div', 'sp-link-card');
        const top = el('div', 'sp-link-card__top');
        const favicon = faviconPreview(link);
        favicon.setAttribute('data-sp-link-favicon', '');
        top.appendChild(favicon);
        top.appendChild(el('span', 'sp-link-card__name', link.name || '—'));
        const nameHolder = top.querySelector('.sp-link-card__name');
        nameHolder.setAttribute('data-sp-link-name', '');
        const actions = el('div', 'sp-link-card__actions');
        const up = el('button', 'sp-button sp-button--ghost sp-link-card__btn', '↑');
        up.type = 'button';
        up.title = t('links.moveUp');
        up.setAttribute('aria-label', t('links.moveUp'));
        up.disabled = index === 0;
        up.addEventListener('click', () => {
          if (moveItem(ln.items, index, index - 1)) renderList();
        });
        const down = el('button', 'sp-button sp-button--ghost sp-link-card__btn', '↓');
        down.type = 'button';
        down.title = t('links.moveDown');
        down.setAttribute('aria-label', t('links.moveDown'));
        down.disabled = index === ln.items.length - 1;
        down.addEventListener('click', () => {
          if (moveItem(ln.items, index, index + 1)) renderList();
        });
        const remove = el('button', 'sp-button sp-button--ghost sp-link-card__btn', '×');
        remove.type = 'button';
        remove.title = t('links.remove');
        remove.setAttribute('aria-label', t('links.remove'));
        remove.addEventListener('click', () => {
          ln.items.splice(index, 1);
          renderList();
        });
        actions.append(up, down, remove);
        top.appendChild(actions);
        const toggle = el('label', 'sp-switch');
        const checkbox = el('input', '');
        checkbox.type = 'checkbox';
        checkbox.checked = link.enabled !== false;
        checkbox.setAttribute('aria-label', link.name || t('links.list'));
        checkbox.addEventListener('change', () => {
          link.enabled = checkbox.checked;
        });
        toggle.append(checkbox, el('span', 'sp-switch__track'));
        top.appendChild(toggle);
        card.appendChild(top);

        const nameInput = createTextInput({
          value: link.name,
          placeholder: t('links.namePlaceholder'),
          maxLength: 60,
          onChange: (value) => {
            link.name = value.trim().slice(0, 60);
            paintPreview(card, link);
          },
        });
        card.appendChild(createField({ label: t('links.name'), control: nameInput }));
        const urlInput = createTextInput({
          value: link.url,
          placeholder: t('links.urlPlaceholder'),
          maxLength: 500,
          inputMode: 'url',
          onChange: (value) => {
            link.url = value.trim().slice(0, 500);
            urlInput.classList.toggle('is-invalid', !!link.url && !isValidLinkTemplate(link.url));
            paintPreview(card, link);
          },
        });
        if (link.url && !isValidLinkTemplate(link.url)) urlInput.classList.add('is-invalid');
        card.appendChild(createField({ label: t('links.url'), control: urlInput }));
        const iconInput = createTextInput({
          value: link.icon ?? '',
          placeholder: t('links.iconPlaceholder'),
          maxLength: 500,
          inputMode: 'url',
          onChange: (value) => {
            link.icon = value.trim().slice(0, 500);
            paintPreview(card, link);
          },
        });
        card.appendChild(createField({ label: t('links.icon'), control: iconInput }));
        const preview = el('p', 'sp-hint');
        preview.setAttribute('data-sp-link-preview', '');
        card.appendChild(preview);
        const open = el('a', 'sp-button sp-button--ghost sp-link-card__open', t('links.open'));
        open.setAttribute('data-sp-link-open', '');
        open.target = '_blank';
        open.rel = 'noopener noreferrer';
        card.appendChild(open);
        paintPreview(card, link);
        list.appendChild(card);
      });
    };
    renderList();

    const addCard = el('div', 'sp-link-card sp-link-card--add');
    const addName = createTextInput({ value: '', placeholder: t('links.namePlaceholder'), maxLength: 60, onChange: () => {} });
    const addUrl = createTextInput({ value: '', placeholder: t('links.urlPlaceholder'), maxLength: 500, inputMode: 'url', onChange: () => {} });
    const addIcon = createTextInput({ value: '', placeholder: t('links.iconPlaceholder'), maxLength: 500, inputMode: 'url', onChange: () => {} });
    addCard.appendChild(createField({ label: t('links.name'), control: addName }));
    addCard.appendChild(createField({ label: t('links.url'), control: addUrl }));
    addCard.appendChild(createField({ label: t('links.icon'), control: addIcon }));
    const addRow = el('div', 'sp-link-card__add-row');
    const addButton = createButton(t('links.add'), () => {
      const name = addName.value.trim().slice(0, 60);
      const url = addUrl.value.trim().slice(0, 500);
      const valid = !!name && isValidLinkTemplate(url);
      addUrl.classList.toggle('is-invalid', !isValidLinkTemplate(url));
      if (!valid || ln.items.length >= MAX_LINKS) return;
      ln.items.push({ id: makeLinkId(), name, url, icon: addIcon.value.trim().slice(0, 500), enabled: true });
      addName.value = '';
      addUrl.value = '';
      addIcon.value = '';
      renderList();
    });
    const restoreButton = createButton(t('links.restore'), () => {
      ln.items = getDefaults().links.items.map((entry) => ({ ...entry }));
      renderList();
    }, 'sp-button--ghost');
    addRow.append(addButton, restoreButton);
    addCard.appendChild(addRow);
    listSection.appendChild(addCard);
    pane.appendChild(listSection);
  },
};
