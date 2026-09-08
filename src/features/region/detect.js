export const REGION_PATTERNS = [
  /unavailable in your region/i,
  /not available in your (?:country|region)/i,
  /недоступ[еаоы]?н.*(?:регион|стране|вашем регионе)/i,
  /в вашем регионе недоступн/i,
  /este artículo no está disponible en tu región/i,
  /cet article n'est pas disponible dans votre région/i,
];

const APP_RE = /\/(app|bundle|sub)\/(\d+)/i;

export function getStorePageId(url = location.href) {
  const match = String(url).match(APP_RE);
  return match ? { kind: match[1].toLowerCase(), id: match[2] } : null;
}

export function isSupportedStoreUrl(url = location.href) {
  try {
    const parsed = new URL(String(url));
    if (!/^(store\.steampowered\.com|steamcommunity\.com)$/i.test(parsed.hostname)) return false;
    return APP_RE.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function isRegionBlockedPage(root = document) {
  const errorEl = root.querySelector?.('#error_box .error, #error_box');
  if (errorEl) {
    const text = errorEl.textContent || '';
    if (REGION_PATTERNS.some((re) => re.test(text))) return true;
  }
  const oops = root.querySelector?.('.pageheader');
  if (oops && /oops/i.test(oops.textContent || '')) {
    const bodyText =
      root.querySelector?.('.page_header_ctn, #error_box, .page_content')?.textContent || '';
    if (REGION_PATTERNS.some((re) => re.test(bodyText))) return true;
  }
  return false;
}

export function isHostLoggedIn() {
  if (
    document.querySelector(
      '#account_pulldown, #account_dropdown, #header_notification_area, #global_actions .user_avatar, #global_actions .playerAvatar',
    )
  ) {
    return true;
  }
  return !!document.querySelector(
    '#global_actions a[href*="steamcommunity.com/profiles/"], #global_actions a[href*="steamcommunity.com/id/"]',
  );
}
