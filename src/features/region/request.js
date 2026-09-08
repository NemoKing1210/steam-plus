import { getSettings } from '../../core/settings.js';
import { REGION_REQUEST_TIMEOUT_MS } from '../../core/constants.js';
import { Codes, fail } from '../../core/debug.js';
import { getLocale } from '../../i18n/index.js';

const STEAM_LANG_BY_LOCALE = {
  en: 'english',
  ru: 'russian',
  'zh-CN': 'schinese',
  es: 'spanish',
  'pt-BR': 'brazilian',
  de: 'german',
  fr: 'french',
  ja: 'japanese',
  ko: 'koreana',
  pl: 'polish',
};

const ACCEPT_LANG_BY_STEAM = {
  english: 'en-US,en;q=0.9',
  russian: 'ru-RU,ru;q=0.9,en;q=0.8',
  schinese: 'zh-CN,zh;q=0.9,en;q=0.8',
  tchinese: 'zh-TW,zh;q=0.9,en;q=0.8',
  spanish: 'es-ES,es;q=0.9,en;q=0.8',
  latam: 'es-419,es;q=0.9,en;q=0.8',
  brazilian: 'pt-BR,pt;q=0.9,en;q=0.8',
  portuguese: 'pt-PT,pt;q=0.9,en;q=0.8',
  german: 'de-DE,de;q=0.9,en;q=0.8',
  french: 'fr-FR,fr;q=0.9,en;q=0.8',
  japanese: 'ja-JP,ja;q=0.9,en;q=0.8',
  koreana: 'ko-KR,ko;q=0.9,en;q=0.8',
  polish: 'pl-PL,pl;q=0.9,en;q=0.8',
};

export function getCookie(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1].trim()) : '';
}

export function getSteamStoreLanguage() {
  const fromCookie = getCookie('Steam_Language');
  if (fromCookie) return fromCookie;
  return STEAM_LANG_BY_LOCALE[getLocale()] || 'english';
}

export function getStoreCountryCode(settings = getSettings().region) {
  if (settings?.countryCode && /^[A-Za-z]{2}$/.test(settings.countryCode.trim())) {
    return settings.countryCode.trim().toUpperCase();
  }
  const fromCookie = getCookie('steamCountry');
  if (fromCookie) {
    const cc = decodeURIComponent(fromCookie).split('|')[0]?.trim();
    if (/^[A-Za-z]{2}$/.test(cc)) return cc.toUpperCase();
  }
  return '';
}

export function buildTargetUrl(sourceUrl = location.href, settings = getSettings().region) {
  const url = new URL(sourceUrl);
  url.searchParams.delete('snr');
  url.searchParams.set('l', getSteamStoreLanguage());
  const cc = getStoreCountryCode(settings);
  if (cc) url.searchParams.set('cc', cc.toLowerCase());
  return url.toString();
}

export function buildProxyBase(settings = getSettings().region) {
  const host = String(settings?.proxyHost || '').trim().replace(/\/+$/, '');
  const port = String(settings?.proxyPort || '').trim();
  if (/^https?:\/\//i.test(host)) {
    if (port && !/:\d+$/.test(host.replace(/^https?:\/\//i, '').split('/')[0])) {
      return `${host}:${port}`;
    }
    return host;
  }
  return port ? `http://${host}:${port}` : `http://${host}`;
}

export function buildRequestUrl(targetUrl, settings = getSettings().region) {
  if (!settings?.proxyEnabled || !String(settings?.proxyHost || '').trim()) return targetUrl;
  const base = buildProxyBase(settings);
  const mode = settings?.proxyMode || 'gateway';
  if (mode === 'path') return `${base}/${targetUrl.replace(/^https?:\/\//, '')}`;
  if (mode === 'query') return `${base}/?url=${encodeURIComponent(targetUrl)}`;
  return `${base}/${targetUrl}`;
}

function buildRequestHeaders(settings = getSettings().region) {
  const steamLang = getSteamStoreLanguage();
  const cookies = [
    'birthtime=-3338496000',
    'mature_content=1',
    'wants_mature_content=1',
    'lastagecheckage=1-0-1980',
    `Steam_Language=${steamLang}`,
  ];
  const cc = getStoreCountryCode(settings);
  if (cc) cookies.push(`steamCountry=${encodeURIComponent(`${cc}|0`)}`);
  return {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': ACCEPT_LANG_BY_STEAM[steamLang] || navigator.language || 'en-US,en;q=0.9',
    Cookie: cookies.join('; '),
  };
}

export function guestFetch(url, settings = getSettings().region) {
  return new Promise((resolve, reject) => {
    if (typeof GM_xmlhttpRequest !== 'function') {
      reject(fail(Codes.REGION_REQUEST, 'GM_xmlhttpRequest is unavailable'));
      return;
    }
    const opts = {
      method: 'GET',
      url,
      anonymous: true,
      timeout: REGION_REQUEST_TIMEOUT_MS,
      headers: buildRequestHeaders(settings),
      onload: (res) => resolve(res),
      onerror: (res) =>
        reject(
          fail(Codes.REGION_REQUEST, 'guest request failed', {
            status: res?.status,
            statusText: res?.statusText,
          }),
        ),
      ontimeout: () => reject(fail(Codes.REGION_REQUEST, 'guest request timed out', { url })),
    };
    if (settings?.proxyEnabled && settings?.proxyUser) {
      opts.user = settings.proxyUser;
      opts.password = settings.proxyPass || '';
    }
    GM_xmlhttpRequest(opts);
  });
}
