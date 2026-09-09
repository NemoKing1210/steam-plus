import { getSettings } from '../../core/settings.js';
import { emit } from '../../core/bus.js';
import { Codes, fail, logError, logInfo } from '../../core/debug.js';
import { t } from '../../i18n/index.js';
import { buildRequestUrl, buildTargetUrl, guestFetch } from './request.js';
import {
  invalidateRegionCache,
  readRegionCache,
  writeRegionCache,
} from './cache.js';
import { isHostLoggedIn, isRegionBlockedPage } from './detect.js';
import {
  getContentMount,
  extractStoreRoot,
  hideRegionLoader,
  rewriteDocumentWithGuest,
  showRegionLoader,
  showRegionStatus,
} from './inject.js';

let running = false;

export function isRegionBypassActive() {
  return running;
}

export function isRegionInjected() {
  return !!document.querySelector('.sp-region-banner');
}

export async function bypassRegionBlock(options = {}) {
  const forceRefresh = !!options.forceRefresh;
  if (running) return;
  const mount = getContentMount();
  if (!mount) return;
  const settings = getSettings().region;
  running = true;
  showRegionLoader();
  try {
    const targetUrl = buildTargetUrl(location.href, settings);
    let html = null;
    let fromCache = false;
    if (!forceRefresh) {
      html = readRegionCache(targetUrl);
      fromCache = !!html;
    } else {
      invalidateRegionCache(targetUrl);
    }
    if (!html) {
      const requestUrl = buildRequestUrl(targetUrl, settings);
      logInfo('region', 'guest fetch', { cached: false });
      const response = await guestFetch(requestUrl, settings);
      if (response.status < 200 || response.status >= 400) {
        throw fail(Codes.REGION_REQUEST, `guest request HTTP ${response.status}`, {
          status: response.status,
        });
      }
      html = response.responseText || '';
    } else {
      logInfo('region', 'guest fetch', { cached: true });
    }
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (isRegionBlockedPage(doc)) {
      if (fromCache) invalidateRegionCache(targetUrl);
      showRegionStatus(
        mount,
        'error',
        settings.proxyEnabled ? t('region.errorBlockedProxy') : t('region.errorBlocked'),
        { onRetry: () => bypassRegionBlock({ forceRefresh: true }) },
      );
      return;
    }
    if (doc.querySelector('#agecheck_form, .agegate_birthday_desc, #app_agegate')) {
      if (fromCache) invalidateRegionCache(targetUrl);
      showRegionStatus(mount, 'error', t('region.errorAgeGate'), {
        onRetry: () => bypassRegionBlock({ forceRefresh: true }),
      });
      return;
    }
    const remoteGame = extractStoreRoot(doc);
    if (!remoteGame) {
      if (fromCache) invalidateRegionCache(targetUrl);
      throw fail(Codes.REGION_RESPONSE, 'guest page held no store content');
    }
    if (!fromCache) writeRegionCache(targetUrl, html);
    const viaProxy = !!(settings.proxyEnabled && settings.proxyHost.trim());
    const signedIn = isHostLoggedIn();
    rewriteDocumentWithGuest(html);
    hideRegionLoader();
    // The document was replaced: main.js boots features into it on
    // `region:rewrote`, then emits `region:injected` once they are live.
    emit('region:rewrote', { url: location.href, fromCache, viaProxy, signedIn });
  } catch (error) {
    const message =
      error?.message && !/^SP-141\d/.test(String(error.message))
        ? error.message
        : t('region.errorFailed', { error: error?.details?.status ?? error?.message ?? '' });
    logError(Codes.REGION_FAILED, 'region bypass failed', {
      error: String(error?.message || error),
      forceRefresh,
    });
    showRegionStatus(mount, 'error', message || t('region.errorFailed', { error: '' }), {
      onRetry: () => bypassRegionBlock({ forceRefresh: true }),
    });
  } finally {
    running = false;
  }
}
