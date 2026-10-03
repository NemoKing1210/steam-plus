/**
 * Anchor resolution for blocks injected into store game pages
 * (regional prices, external links, add-on content).
 */

/**
 * Resolve the anchor of a game-page block from its position setting:
 * `'purchase'` (above the buy options), `'sidebar'` or `'description'`.
 */
export function resolveGameAnchor(position) {
  const pick = (selector) => document.querySelector(selector);
  if (position === 'sidebar') {
    const target = pick('.rightcol.game_meta_data') ?? pick('#game_area_purchase');
    return { target, mode: target?.classList.contains('game_meta_data') ? 'prepend' : 'before' };
  }
  if (position === 'description') {
    return { target: pick('#game_area_description') ?? pick('#game_area_purchase'), mode: 'after' };
  }
  return { target: pick('#game_area_purchase') ?? pick('#game_area_description'), mode: 'before' };
}

/** Insert an injected block at a resolved anchor; false when it has no home. */
export function placeGameBlock(root, anchor) {
  if (!anchor?.target) return false;
  if (anchor.mode === 'prepend') {
    anchor.target.insertBefore(root, anchor.target.firstChild);
  } else if (anchor.mode === 'before') {
    anchor.target.before(root);
  } else {
    anchor.target.after(root);
  }
  return root.isConnected;
}
