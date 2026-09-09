import { REGION_ASSET_TIMEOUT_MS } from '../../core/constants.js';
import { Codes, fail, logInfo } from '../../core/debug.js';
import { isRegionBlockedPage } from './detect.js';

// Guest catalog data is intentionally allowed: it matches the transplanted
// content, while the live session globals below must never be clobbered.
const SKIP_SCRIPT_RES = [
  /g_AccountID\s*=/,
  /g_sessionID\s*=/,
  /g_bLoggedIn\s*=/,
  /BuildDefaultHeader/,
  /InitCookiePreferencesPopup/,
  /#global_header/,
];

function shouldSkipScript(code) {
  return SKIP_SCRIPT_RES.some((re) => re.test(code));
}

function assetKey(url) {
  try {
    return new URL(url, 'https://store.steampowered.com').pathname;
  } catch {
    return String(url);
  }
}

function syncDocumentTitle(guestDoc) {
  const title = guestDoc.title?.trim();
  if (title) document.title = title;
}

function syncDocumentClasses(guestDoc) {
  for (const tag of ['documentElement', 'body']) {
    const from = guestDoc[tag];
    const into = document[tag];
    if (!from || !into) continue;
    from.classList.forEach((name) => {
      if (!into.classList.contains(name)) into.classList.add(name);
    });
  }
}

function syncHeadStyles(guestDoc) {
  const liveHead = document.head;
  const guestHead = guestDoc.head;
  if (!liveHead || !guestHead) return 0;
  const liveHrefs = new Set(
    [...liveHead.querySelectorAll('link[rel="stylesheet"]')].map((node) =>
      assetKey(node.getAttribute('href') || node.href),
    ),
  );
  let added = 0;
  guestHead.querySelectorAll('link[rel="stylesheet"]').forEach((node) => {
    const href = node.getAttribute('href');
    if (!href || liveHrefs.has(assetKey(href))) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    const media = node.getAttribute('media');
    if (media) link.media = media;
    link.href = href;
    liveHead.appendChild(link);
    liveHrefs.add(assetKey(href));
    added += 1;
  });
  const liveStyles = new Set([...liveHead.querySelectorAll('style')].map((node) => node.textContent));
  guestHead.querySelectorAll('style').forEach((node) => {
    if (liveStyles.has(node.textContent)) return;
    const style = document.createElement('style');
    style.textContent = node.textContent;
    liveHead.appendChild(style);
    added += 1;
  });
  return added;
}

function missingScriptSrcs(guestDoc) {
  const liveSrcs = new Set(
    [...document.querySelectorAll('script[src]')].map((node) =>
      assetKey(node.getAttribute('src') || node.src),
    ),
  );
  const missing = [];
  guestDoc.querySelectorAll('head script[src]').forEach((node) => {
    const src = node.getAttribute('src');
    if (!src) return;
    const key = assetKey(src);
    if (liveSrcs.has(key)) return;
    liveSrcs.add(key);
    missing.push(src);
  });
  return missing;
}

function loadScript(src) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (ok) => {
      if (settled) return;
      settled = true;
      if (!ok) logInfo('region', 'guest bundle failed to load', { src });
      resolve();
    };
    const node = document.createElement('script');
    node.async = false;
    node.onload = () => done(true);
    node.onerror = () => done(false);
    setTimeout(done, Math.max(REGION_ASSET_TIMEOUT_MS, 0));
    node.src = src;
    (document.head || document.documentElement).appendChild(node);
  });
}

async function loadGuestScripts(guestDoc) {
  const missing = missingScriptSrcs(guestDoc);
  for (const src of missing) await loadScript(src);
  return missing.length;
}

function collectGuestScripts(guestDoc) {
  const codes = [];
  guestDoc.querySelectorAll('script:not([src])').forEach((node) => {
    const code = node.textContent || '';
    if (!code.trim() || shouldSkipScript(code)) return;
    codes.push(code);
  });
  return codes;
}

function runGuestScripts(codes) {
  let ran = 0;
  codes.forEach((code) => {
    try {
      const node = document.createElement('script');
      node.textContent = code;
      (document.head || document.documentElement).appendChild(node);
      node.remove();
      ran += 1;
    } catch (error) {
      logInfo('region', 'guest init script failed', { error: String(error) });
    }
  });
  return ran;
}

function keepAdopted(node) {
  if (node.nodeName === 'SCRIPT') return false;
  node.querySelectorAll?.('.banner_open_in_steam').forEach((item) => item.remove());
  node.querySelectorAll?.('script').forEach((item) => item.remove());
  return true;
}

function swapResponsiveShell(guestDoc) {
  const guestShell = guestDoc.querySelector('#responsive_page_template_content');
  const liveShell = document.querySelector('#responsive_page_template_content');
  if (!guestShell || !liveShell) return false;
  const incoming = [...guestShell.childNodes]
    .map((node) => document.adoptNode(node))
    .filter(keepAdopted);
  if (!incoming.length) return false;
  liveShell.replaceChildren(...incoming);
  return true;
}

function swapErrorContainer(guestRoot) {
  const errorBox = document.querySelector('#error_box');
  if (!errorBox || !guestRoot) return false;
  const liveContainer = errorBox.closest('.page_content, .page_content_ctn') || errorBox;
  const node = document.adoptNode(guestRoot);
  if (!keepAdopted(node)) return false;
  liveContainer.replaceWith(node);
  return node.isConnected;
}

export async function transplantGuestContent(guestDoc, guestRoot) {
  syncDocumentTitle(guestDoc);
  syncDocumentClasses(guestDoc);
  const styles = syncHeadStyles(guestDoc);
  const scripts = collectGuestScripts(guestDoc);
  const viaShell = swapResponsiveShell(guestDoc);
  const viaContainer = !viaShell && swapErrorContainer(guestRoot);
  if (!viaShell && !viaContainer) {
    throw fail(Codes.TRANSPLANT, 'guest content had no transplant target');
  }
  const bundles = await loadGuestScripts(guestDoc);
  const ran = runGuestScripts(scripts);
  if (isRegionBlockedPage(document)) {
    throw fail(Codes.TRANSPLANT, 'transplant left the error page behind');
  }
  logInfo('region', 'transplanted guest content', {
    target: viaShell ? 'shell' : 'container',
    styles,
    bundles,
    scripts: ran,
  });
}
