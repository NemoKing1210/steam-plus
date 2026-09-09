/**
 * External link templates: `{appid}` / `{name}` placeholders resolved
 * against the current game page, like browser search-engine keywords.
 */

const APPID_RE = /\/app\/(\d+)/;

/** Browser-style aliases for the game title, all URL-encoded on resolve. */
const NAME_TOKENS = ['{name}', '%s', '{searchterms}'];

export function parseAppId(url) {
  const match = APPID_RE.exec(String(url ?? ''));
  return match ? match[1] : null;
}

/** Current game context ({ appid, name }) or null outside game pages. */
export function getGameContext() {
  const appid = parseAppId(location.href);
  if (!appid) return null;
  const title = document.querySelector('#appHubAppName')?.textContent?.trim() ?? '';
  const name = title || document.title.replace(/ on Steam\s*$/, '').trim();
  if (!name) return null;
  return { appid, name };
}

/**
 * Resolve a user template into an absolute http(s) URL.
 * Returns null when the template is blank, has no usable scheme,
 * or needs `{appid}` outside a game page.
 */
export function resolveLinkUrl(template, context) {
  const raw = String(template ?? '').trim();
  if (!raw) return null;
  let resolved = raw;
  const name = context?.name ?? '';
  const encodedName = encodeURIComponent(name);
  for (const token of NAME_TOKENS) {
    resolved = resolved.split(token).join(encodedName);
    resolved = resolved.split(token.toUpperCase()).join(encodedName);
  }
  if (context?.appid) {
    resolved = resolved.split('{appid}').join(context.appid);
    resolved = resolved.split('{APPID}').join(context.appid);
  } else if (/\{appid\}/i.test(resolved)) {
    return null;
  }
  let url = null;
  try {
    url = new URL(resolved);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  return url.href;
}

/** A template is usable when it resolves with an example game context. */
export function isValidLinkTemplate(template) {
  return resolveLinkUrl(template, { appid: '440', name: 'Team Fortress 2' }) !== null;
}
