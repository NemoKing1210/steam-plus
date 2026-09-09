/**
 * Hideable blocks of Steam store game pages (`/app/<id>`).
 *
 * Selectors were collected from a live app page
 * (`/app/3892270/Gamble_With_Your_Friends/`) and cover the surrounding
 * container (header included) so hiding a block leaves no orphan title.
 * Every selector is optional: rules for absent elements simply match
 * nothing, which keeps the feature safe on pages and locales where a
 * block does not exist.
 */
export const GAMEPAGE_STYLE_ID = 'sp-gamepage-style';

/** Matches store game pages, including the age-gate interstitial. */
export const GAMEPAGE_URL_RE = /^\/app\/\d+(\/|$)|^\/agecheck\/app\/\d+(\/|$)/;

export function isGamePageUrl(url) {
  try {
    const parsed = new URL(String(url), location.href);
    return parsed.hostname === 'store.steampowered.com' && GAMEPAGE_URL_RE.test(parsed.pathname);
  } catch {
    return false;
  }
}

export const GAMEPAGE_BLOCKS = [
  {
    id: 'media',
    labelKey: 'block.media',
    selectors: ['#game_highlights'],
  },
  {
    id: 'purchase',
    labelKey: 'block.purchase',
    selectors: ['#game_area_purchase'],
  },
  {
    id: 'description',
    labelKey: 'block.description',
    selectors: ['#aboutThisGame', '#game_area_description'],
  },
  {
    id: 'dlc',
    labelKey: 'block.dlc',
    selectors: ['#gameAreaDLCSection'],
  },
  {
    id: 'sysreq',
    labelKey: 'block.sysreq',
    selectors: ['.game_page_autocollapse.sys_req'],
  },
  {
    id: 'reviews',
    labelKey: 'block.reviews',
    selectors: ['#app_reviews_hash', '.review_ctn', '#userReviews'],
  },
  {
    id: 'curators',
    labelKey: 'block.curators',
    selectors: ['.steam_curators_block'],
  },
  {
    id: 'events',
    labelKey: 'block.events',
    selectors: [
      '#game_area_event',
      '.announcement_section',
      '#events_row',
      '.event_section',
    ],
  },
  {
    id: 'details',
    labelKey: 'block.details',
    selectors: [
      '#category_block',
      '#languageTable',
      '#bannerLanguages',
      '#achievement_block',
      '#appDetailsUnderlinedLinks',
      '.glance_tags_ctn',
    ],
  },
  {
    id: 'recommendations',
    labelKey: 'block.recommendations',
    selectors: [
      '#recommended_block',
      '.recommendation_ctn',
      '.franchise_notice',
    ],
  },
  {
    id: 'sale',
    labelKey: 'block.sale',
    selectors: ['.saleEventBannerLink'],
  },
  // Edition/package descriptions reuse .game_area_description without an id
  // (the main text carries #game_area_description): hide the collapsible
  // container so no empty frame or READ MORE fade remains.
  {
    id: 'edition',
    labelKey: 'block.edition',
    selectors: [
      '.game_page_autocollapse_ctn:has(.game_area_description:not(#game_area_description):not(#game_area_content_descriptors):not(#game_area_legal))',
      '.game_page_autocollapse:has(> .game_area_description:not(#game_area_description):not(#game_area_content_descriptors):not(#game_area_legal))',
    ],
  },
];

export function getBlockIds() {
  return GAMEPAGE_BLOCKS.map((block) => block.id);
}

/**
 * Build the hiding stylesheet for the enabled block ids. Returns an empty
 * string when nothing should be hidden.
 */
export function buildGamepageCss(hidden) {
  if (!hidden || typeof hidden !== 'object') return '';
  const rules = [];
  for (const block of GAMEPAGE_BLOCKS) {
    if (hidden[block.id] !== true) continue;
    rules.push(`${block.selectors.join(', ')} { display: none !important; }`);
  }
  return rules.join('\n');
}
