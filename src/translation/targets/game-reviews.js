import { registerTarget } from './index.js';

/**
 * Nearest row with at least two direct buttons (Yes / No / Funny / Award
 * in the new React review UI), searched a few levels up so unrelated
 * button groups elsewhere on the page never match.
 */
function findActionsRow(element) {
  let node = element.parentElement;
  for (let depth = 0; depth < 4 && node instanceof Element; depth += 1) {
    const row = node.querySelector('div:has(> button + button)');
    if (row && !row.contains(element)) return row;
    node = node.parentElement;
  }
  return null;
}

function placeReviewButton(button, element) {
  const row = findActionsRow(element);
  if (row) {
    button.classList.add('sp-translate-btn--actions');
    row.insertBefore(button, row.firstChild);
  } else {
    button.classList.add('sp-translate-btn--above');
    element.insertAdjacentElement('beforebegin', button);
  }
}

registerTarget({
  id: 'gameReviews',
  labelKey: 'scope.gameReviews',
  // Store reviews + community hub review cards + the new React review UI
  // (hashed classes, so also anchor on the review title heading for
  // untitled-proof matching when hashes rotate).
  selector:
    '._1zbKizfCRpoX2D_zOLQes0._3QloCWvWesFo3QI7yfd8sL._3cl9mzgp8WIVuj1VCw9yi0, ' +
    '.review_text, .apphub_CardTextContent, div:has(> h1:first-child)',
  placeButton: placeReviewButton,
});
