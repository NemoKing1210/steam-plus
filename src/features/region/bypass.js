import { getSettings } from '../../core/settings.js';
import { emit } from '../../core/bus.js';
import { Codes, fail, logError, logInfo } from '../../core/debug.js';
import { t } from '../../i18n/index.js';
import { buildRequestUrl, buildTargetUrl, guestFetch } from './request.js';
import { isHostLoggedIn, isRegionBlockedPage } from './detect.js';
import {
  getContentMount,
  extractStoreRoot,
  hideRegionLoader,
  rewriteDocumentWithGuest,
  showRegionLoader,
  showRegionStatus,
} from './inject.js';
import { transplantGuestContent } from './transplant.js';
import { restoreQueueActions } from './queue.js';

let running = false;

export function isRegionBypassActive() {
  return running;
}

export function isRegionInjected() {
  return !!document.querySelector('.sp-region-banner');
}

export async function bypassRegionBlock() {
  if (running) return;
  const mount = getContentMount();
  if (!mount) return;
  const settings = getSettings().region;
  running = true;
  showRegionLoader();
  try {
    const targetUrl = buildTargetUrl(location.href, settings);
    const requestUrl = buildRequestUrl(targetUrl, settings);
    logInfo('region', 'guest fetch');
    const response = await guestFetch(requestUrl, settings);
    if (response.status < 200 || response.status >= 400) {
      throw fail(Codes.REGION_REQUEST, `guest request HTTP ${response.status}`, {
        status: response.status,
      });
    }
    const html = response.responseText || '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (isRegionBlockedPage(doc)) {
      showRegionStatus(
        mount,
        'error',
        settings.proxyEnabled ? t('region.errorBlockedProxy') : t('region.errorBlocked'),
        { onRetry: () => bypassRegionBlock() },
      );
      return;
    }
    if (doc.querySelector('#agecheck_form, .agegate_birthday_desc, #app_agegate')) {
      showRegionStatus(mount, 'error', t('region.errorAgeGate'), {
        onRetry: () => bypassRegionBlock(),
      });
      return;
    }
    const remoteGame = extractStoreRoot(doc);
    if (!remoteGame) {
      throw fail(Codes.REGION_RESPONSE, 'guest page held no store content');
    }
    const viaProxy = !!(settings.proxyEnabled && settings.proxyHost.trim());
    const signedIn = isHostLoggedIn();
    // Transplant first: the live document keeps the logged-in header, styles
    // and scripts — only the error content is swapped for guest content.
    // Full rewrite is the fallback when there is nothing to transplant into.
    let transplanted = false;
    try {
      await transplantGuestContent(doc, remoteGame);
      transplanted = true;
      if (signedIn) restoreQueueActions();
    } catch (error) {
      logInfo('region', 'transplant failed, falling back to rewrite', {
        error: String(error?.message || error),
      });
      rewriteDocumentWithGuest(html);
    }
    hideRegionLoader();
    // `region:rewrote` boots features into the fresh content then main.js
    // emits `region:injected` once they are live.
    emit('region:rewrote', { url: location.href, viaProxy, signedIn, transplanted });
  } catch (error) {
    const message =
      error?.message && !/^SP-141\d/.test(String(error.message))
        ? error.message
        : t('region.errorFailed', { error: error?.details?.status ?? error?.message ?? '' });
    logError(Codes.REGION_FAILED, 'region bypass failed', {
      error: String(error?.message || error),
    });
    showRegionStatus(mount, 'error', message || t('region.errorFailed', { error: '' }), {
      onRetry: () => bypassRegionBlock(),
    });
  } finally {
    running = false;
  }
}
