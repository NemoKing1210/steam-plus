import { isOwnUi } from '../utils/dom.js';

/**
 * Structure-preserving translation model.
 *
 * Plain-text machine translation flattens content: links lose their href,
 * images vanish, paragraphs collapse into one blob. Instead we split each
 * translatable element into block segments (paragraphs, headings, list
 * items), replace every non-text node inside a segment with an opaque
 * placeholder token (`__SP0__`, `__SP1__`, …) that survives translation,
 * send only the placeholdered text to the provider, then rebuild real DOM
 * from the translated string by splicing the original nodes back in.
 * Translated output is never injected via innerHTML: text becomes text
 * nodes, elements are recreated from an allowlist with validated attrs.
 */

const BLOCK_TAGS = new Set([
  'P', 'DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN', 'ASIDE', 'NAV',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE',
  'DT', 'DD', 'TD', 'TH', 'CAPTION', 'FIGCAPTION', 'SUMMARY',
]);

const TRANSPARENT_TAGS = new Set([
  'UL', 'OL', 'DL', 'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'FIGURE',
]);

/**
 * Subtrees that travel through translation untouched and are spliced back
 * verbatim: media and embeds (no text to translate), code-like content
 * (translating it would corrupt it), and scripting/form chrome.
 */
const PRESERVED_TAGS = new Set([
  'IMG', 'VIDEO', 'AUDIO', 'SOURCE', 'TRACK', 'IFRAME', 'EMBED', 'OBJECT',
  'SVG', 'CANVAS', 'HR', 'WBR', 'BR',
  'CODE', 'PRE', 'KBD', 'SAMP', 'VAR', 'TT',
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'TEXTAREA', 'INPUT', 'BUTTON',
  'SELECT', 'OPTION',
]);

const MIRROR_BLOCK_TAGS = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE']);

const INLINE_TAGS = new Set([
  'A', 'B', 'STRONG', 'EM', 'I', 'U', 'S', 'STRIKE', 'DEL', 'INS',
  'SUB', 'SUP', 'SMALL', 'BIG', 'MARK', 'Q', 'ABBR', 'CITE', 'DFN', 'TIME',
  'SPAN', 'FONT',
]);

const SAFE_REL = new Set(['noopener', 'noreferrer', 'ugc', 'nofollow', 'sponsored']);

const TOKEN_PREFIXES = ['__SP', '__SPX', '__SPXX', '__SPXXX'];
const GENERIC_TOKEN_PATTERN = /__SPX*\d+__/g;

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function tokenPattern(prefix) {
  return new RegExp(`${escapeRegExp(prefix)}(\\d+)__`, 'g');
}

function choosePrefix(sample) {
  const text = String(sample || '');
  for (const prefix of TOKEN_PREFIXES) {
    tokenPattern(prefix).lastIndex = 0;
    if (!tokenPattern(prefix).test(text)) return prefix;
  }
  return TOKEN_PREFIXES[TOKEN_PREFIXES.length - 1];
}

/** Remove placeholder tokens so text is human-readable (logs, cache list). */
export function stripPlaceholders(text) {
  return String(text || '').replace(GENERIC_TOKEN_PATTERN, '').replace(/ +/g, ' ').trim();
}

function isTranslatable(text, prefix) {
  const stripped = String(text).replace(tokenPattern(prefix), '').trim();
  return stripped.length > 0 && /\p{L}/u.test(stripped);
}

/**
 * Move a hard-split cut out of a placeholder token so requests never send
 * half a token to the provider (it would come back mangled).
 */
export function adjustCutOutsideToken(text, cut) {
  GENERIC_TOKEN_PATTERN.lastIndex = 0;
  let match;
  while ((match = GENERIC_TOKEN_PATTERN.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (cut > start && cut < end) return start > 0 ? start : end;
  }
  return cut;
}

function isSafeHref(href) {
  return typeof href === 'string' && /^(https?:\/\/|steam:\/\/|\/|#)/i.test(href.trim());
}

function sanitizedRel(rel) {
  const kept = String(rel || '')
    .split(/\s+/)
    .filter((token) => SAFE_REL.has(token.toLowerCase()));
  return kept.length ? kept.join(' ') : null;
}

function mirrorInlineTag(tag) {
  return INLINE_TAGS.has(tag) ? tag.toLowerCase() : 'span';
}

function applyInlineAttrs(node, desc) {
  if (desc.tag === 'A') {
    if (isSafeHref(desc.attrs.href)) node.setAttribute('href', desc.attrs.href);
    if (desc.attrs.title) node.setAttribute('title', desc.attrs.title);
    if (desc.attrs.target === '_blank') node.setAttribute('target', '_blank');
    const rel = sanitizedRel(desc.attrs.rel);
    if (rel) node.setAttribute('rel', rel);
  }
  if (desc.attrs.class) node.setAttribute('class', desc.attrs.class);
}

function snapshotChildren(element) {
  return [...element.childNodes].map((node) => node.cloneNode(true));
}

function startBlock(walker, element, tag) {
  const listKind =
    tag === 'LI' && element.parentElement instanceof Element
      ? element.parentElement.tagName === 'OL'
        ? 'ol'
        : element.parentElement.tagName === 'UL'
          ? 'ul'
          : null
      : null;
  const block = {
    element,
    tag: tag.toLowerCase(),
    listKind,
    parent: null,
    liveNodes: [],
    originalNodes: null,
    tokens: new Map(),
    parts: [],
    prefix: walker.prefix,
    text: '',
    rendered: [],
    translated: null,
  };
  walker.blocks.push(block);
  return block;
}

function finishBlockText(block) {
  block.text = block.parts.join('').replace(/ +/g, ' ').trim();
  block.parts = [];
}

function finalizeAnon(walker) {
  const anon = walker.anon;
  walker.anon = null;
  if (!anon) return;
  finishBlockText(anon);
  anon.originalNodes = anon.liveNodes.map((node) => node.cloneNode(true));
  walker.blocks.push(anon);
}

function ensureAnon(walker, parent) {
  if (!walker.anon || walker.anon.parent !== parent) {
    finalizeAnon(walker);
    walker.anon = {
      element: null,
      tag: 'p',
      listKind: null,
      parent,
      liveNodes: [],
      originalNodes: null,
      tokens: new Map(),
      parts: [],
      prefix: walker.prefix,
      text: '',
      rendered: [],
      translated: null,
    };
  }
  return walker.anon;
}

function noteLiveNode(walker, target, liveNode) {
  if (target.element === null && !target.liveNodes.includes(liveNode)) {
    target.liveNodes.push(liveNode);
  }
}

function emitToken(walker, target, desc) {
  const id = walker.nextId;
  walker.nextId += 1;
  target.tokens.set(id, desc);
  target.parts.push(`${walker.prefix}${id}__`);
}

function isSkippedUi(element) {
  return (
    isOwnUi(element) ||
    (element.closest instanceof Function &&
      !!element.closest('.sp-replaced-content'))
  );
}

function visitNode(node, parent, block, walker) {
  if (node.nodeType === Node.TEXT_NODE) {
    const normalized = node.nodeValue.replace(/\s+/g, ' ');
    if (!normalized) return;
    const target = block ?? ensureAnon(walker, parent);
    target.parts.push(normalized);
    noteLiveNode(walker, target, node);
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  if (isSkippedUi(node)) return;
  const tag = node.tagName;
  if (PRESERVED_TAGS.has(tag)) {
    const target = block ?? ensureAnon(walker, parent);
    emitToken(walker, target, { kind: 'atomic', node: node.cloneNode(true) });
    noteLiveNode(walker, target, node);
    return;
  }
  if (BLOCK_TAGS.has(tag)) {
    finalizeAnon(walker);
    const childBlock = startBlock(walker, node, tag);
    walkChildren(node, childBlock, walker);
    finishBlockText(childBlock);
    childBlock.originalNodes = snapshotChildren(node);
    return;
  }
  if (TRANSPARENT_TAGS.has(tag)) {
    walkChildren(node, block, walker);
    return;
  }
  const target = block ?? ensureAnon(walker, parent);
  const attrs = {
    href: node.getAttribute?.('href'),
    title: node.getAttribute?.('title'),
    target: node.getAttribute?.('target'),
    rel: node.getAttribute?.('rel'),
    class: node.getAttribute?.('class'),
  };
  emitToken(walker, target, { kind: 'open', tag, attrs });
  walkChildren(node, target, walker);
  emitToken(walker, target, { kind: 'close' });
  noteLiveNode(walker, target, node);
}

function walkChildren(parent, block, walker) {
  for (let child = parent.firstChild; child; child = child.nextSibling) {
    visitNode(child, parent, block, walker);
  }
}

/**
 * Split `root` into translatable blocks with placeholdered source text.
 * Never throws for exotic DOM: worst case is a single plain-text block.
 */
export function extractRich(root) {
  const walker = { prefix: '__SP', nextId: 0, blocks: [], anon: null };
  try {
    walker.prefix = choosePrefix(root.textContent || '');
    walkChildren(root, null, walker);
    finalizeAnon(walker);
  } catch {
    walker.blocks.length = 0;
    walker.anon = null;
  }
  let blocks = walker.blocks.filter((block) => isTranslatable(block.text, block.prefix));
  if (!blocks.length) {
    const fallback = String(root.textContent || '').replace(/\s+/g, ' ').trim();
    if (!fallback) return { blocks: [], plainText: '' };
    blocks = [
      {
        element: root,
        tag: (root.tagName || 'p').toLowerCase(),
        listKind: null,
        parent: null,
        liveNodes: [],
        originalNodes: snapshotChildren(root),
        tokens: new Map(),
        parts: [],
        prefix: walker.prefix,
        text: fallback,
        rendered: [],
        translated: null,
      },
    ];
  } else if (blocks.length === 1 && blocks[0].element === null) {
    blocks[0].element = root;
    blocks[0].tag = (root.tagName || 'p').toLowerCase();
    blocks[0].originalNodes = snapshotChildren(root);
    blocks[0].parent = null;
    blocks[0].liveNodes = [];
  } else {
    for (const block of blocks) {
      if (block.element) block.originalNodes = snapshotChildren(block.element);
    }
  }
  const plainText = blocks.map((block) => stripPlaceholders(block.text)).join('\n\n');
  return { blocks, plainText };
}

/** Tag used for a block in the below-mode mirror (unknown tags become `p`). */
export function mirrorBlockTag(tag) {
  return MIRROR_BLOCK_TAGS.has(String(tag).toUpperCase()) ? String(tag).toLowerCase() : 'p';
}

/**
 * Rebuild a block's DOM from translated placeholdered text. Unknown or
 * dropped tokens are skipped so provider hallucinations never leak markup;
 * an empty translation falls back to the source structure.
 */
export function restoreFragment(block, translatedText) {
  const fragment = document.createDocumentFragment();
  const stack = [fragment];
  const source = translatedText || block.text;
  const pattern = tokenPattern(block.prefix);
  let last = 0;
  let match;
  const pushText = (value) => {
    if (value) stack[stack.length - 1].append(document.createTextNode(value));
  };
  while ((match = pattern.exec(source)) !== null) {
    pushText(source.slice(last, match.index));
    last = match.index + match[0].length;
    const desc = block.tokens.get(Number(match[1]));
    if (!desc) continue;
    if (desc.kind === 'open') {
      const node = document.createElement(mirrorInlineTag(desc.tag));
      applyInlineAttrs(node, desc);
      stack[stack.length - 1].append(node);
      stack.push(node);
    } else if (desc.kind === 'close') {
      if (stack.length > 1) stack.pop();
    } else {
      stack[stack.length - 1].append(desc.node.cloneNode(true));
    }
  }
  pushText(source.slice(last));
  return fragment;
}
