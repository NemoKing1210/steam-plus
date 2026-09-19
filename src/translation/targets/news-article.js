import { registerTarget } from './index.js';

registerTarget({
  id: 'newsArticle',
  labelKey: 'scope.newsArticle',
  grouped: true,
  // Store news detail pages (/news/app/<id>/view/<gid>, React client):
  // the headline is the last block before the article wrapper (hashed
  // classes, so anchor on the stable .EventDetail sibling) and the body
  // carries the stable .EventDetailsBody class. Per-element buttons stay
  // hidden: one master button above the headline translates the whole
  // article at once, like guides. Hub summaries keep their per-card
  // buttons through the existing gameNews scope.
  selector:
    'div:has(+ .EventDetail) > div:last-child, .EventDetailsBody',
});
