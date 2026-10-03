/**
 * Page scroll lock shared by modal overlays. Nested locks are counted and a
 * lock taken while another owner already pinned the page is released
 * without touching that owner's state.
 */

const MODAL_CLASS = 'sp-modal-open';

let depth = 0;
/** @type {{ y: number, pad: string } | null} */
let saved = null;

export function lockPageScroll() {
  depth += 1;
  if (depth > 1 || saved) return;
  const root = document.documentElement;
  if (root.classList.contains(MODAL_CLASS)) return;
  const body = document.body;
  const y = window.scrollY || root.scrollTop || body.scrollTop || 0;
  const pad = Math.max(0, window.innerWidth - root.clientWidth);
  saved = { y, pad: body.style.paddingRight };
  root.classList.add(MODAL_CLASS);
  if (pad) body.style.paddingRight = `${pad}px`;
  body.style.top = `-${y}px`;
}

export function unlockPageScroll() {
  depth = Math.max(0, depth - 1);
  if (depth > 0 || !saved) return;
  const root = document.documentElement;
  const body = document.body;
  const { y, pad } = saved;
  saved = null;
  root.classList.remove(MODAL_CLASS);
  body.style.top = '';
  body.style.paddingRight = pad;
  window.scrollTo(0, y);
}
