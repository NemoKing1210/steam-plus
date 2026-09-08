import { AUTHOR_NAME, AUTHOR_URL, REPO_URL, SCRIPT_NAME } from '../../../core/constants.js';
import { t } from '../../../i18n/index.js';
import { el } from '../../../utils/dom.js';
import { createHint } from '../controls.js';
import { getScriptVersion } from '../panel.js';

export const aboutTab = {
  id: 'about',
  titleKey: 'tab.about',
  icon: 'info',
  descKey: 'tab.about.desc',
  renderInto(pane) {
    const about = el('div', 'sp-about');
    const hero = el('div', 'sp-about__hero');
    hero.appendChild(el('div', 'sp-about__name', SCRIPT_NAME));
    const version = getScriptVersion();
    if (version) hero.appendChild(el('span', 'sp-panel__version', `v${version}`));
    about.appendChild(hero);

    about.appendChild(el('p', 'sp-about__blurb', t('about.blurb')));

    const author = document.createElement('a');
    author.className = 'sp-about__author';
    author.href = AUTHOR_URL;
    author.target = '_blank';
    author.rel = 'noopener noreferrer';
    const authorMeta = el('span', 'sp-about__author-meta');
    authorMeta.append(el('span', 'sp-about__author-name', AUTHOR_NAME));
    authorMeta.appendChild(el('span', 'sp-about__author-sub', 'github.com/NemoKing1210'));
    author.appendChild(authorMeta);
    about.appendChild(author);

    const actions = el('div', 'sp-about__actions');
    const repo = document.createElement('a');
    repo.className = 'sp-button sp-button--ghost';
    repo.href = REPO_URL;
    repo.target = '_blank';
    repo.rel = 'noopener noreferrer';
    repo.textContent = t('about.repo');
    actions.appendChild(repo);
    about.appendChild(actions);

    about.appendChild(createHint(t('about.repoHint')));
    pane.appendChild(about);
  },
};
