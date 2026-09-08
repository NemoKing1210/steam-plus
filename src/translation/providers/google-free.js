import { MAX_REQUEST_TEXT_LENGTH } from '../../core/constants.js';
import { Codes, fail, logInfo } from '../../core/debug.js';
import { adjustCutOutsideToken } from '../rich.js';
import { registerProvider } from './index.js';

const ENDPOINT = 'https://translate.googleapis.com/translate_a/single';
const FROM = 'auto';
/** Backoff between 429 retries; the last attempt throws. */
const RETRY_DELAYS_MS = [1000, 3000];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sameLanguage(detected, to) {
  if (typeof detected !== 'string' || !detected) return false;
  const source = detected.toLowerCase().split('-')[0];
  const target = String(to).toLowerCase().split('-')[0];
  return source === target;
}

function request(text, to) {
  const url = new URL(ENDPOINT);
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', FROM);
  url.searchParams.set('tl', to);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', text);

  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: 'GET',
      url: url.toString(),
      timeout: 15000,
      onload: (response) => {
        if (response.status !== 200) {
          reject(
            fail(Codes.REQUEST_FAILED, `Google Translate HTTP ${response.status}`, {
              provider: 'google-free',
              status: response.status,
              to,
              chars: text.length,
            }),
          );
          return;
        }
        try {
          const data = JSON.parse(response.responseText);
          // Response: [[["translated","original",...], ...], ..., "detected-lang"]
          if (sameLanguage(data?.[2], to)) {
            resolve(text);
            return;
          }
          const segments = Array.isArray(data?.[0]) ? data[0] : [];
          const translated = segments
            .map((segment) => (Array.isArray(segment) ? segment[0] : ''))
            .join('');
          if (!translated) {
            reject(
              fail(Codes.BAD_RESPONSE, 'Google Translate returned no text', {
                provider: 'google-free',
                to,
                chars: text.length,
              }),
            );
            return;
          }
          resolve(translated);
        } catch (error) {
          reject(
            fail(
              Codes.BAD_RESPONSE,
              'Google Translate returned an unparsable payload',
              { provider: 'google-free', to, chars: text.length },
              error,
            ),
          );
        }
      },
      onerror: () =>
        reject(
          fail(Codes.REQUEST_FAILED, 'Google Translate network error', {
            provider: 'google-free',
            to,
            chars: text.length,
          }),
        ),
      ontimeout: () =>
        reject(
          fail(Codes.REQUEST_FAILED, 'Google Translate timed out', {
            provider: 'google-free',
            to,
            chars: text.length,
          }),
        ),
    });
  });
}

/**
 * Long texts are split on paragraph, then sentence boundaries so no request
 * exceeds MAX_REQUEST_TEXT_LENGTH characters. The cut never lands inside a
 * structure placeholder token and never breaks a word.
 */
function boundaryAfter(rest, needle, width) {
  const at = rest.lastIndexOf(needle, MAX_REQUEST_TEXT_LENGTH);
  return at >= MAX_REQUEST_TEXT_LENGTH / 2 ? at + width : -1;
}

function splitLongText(text) {
  if (text.length <= MAX_REQUEST_TEXT_LENGTH) return [text];
  const chunks = [];
  let rest = text;
  while (rest.length > MAX_REQUEST_TEXT_LENGTH) {
    let cut = boundaryAfter(rest, '\n', 1);
    if (cut < 0) {
      cut = Math.max(
        boundaryAfter(rest, '. ', 2),
        boundaryAfter(rest, '! ', 2),
        boundaryAfter(rest, '? ', 2),
      );
    }
    if (cut < 0) {
      cut = MAX_REQUEST_TEXT_LENGTH;
      const space = rest.lastIndexOf(' ', cut);
      if (space > cut - 40 && space > 0) cut = space + 1;
    }
    cut = adjustCutOutsideToken(rest, cut);
    if (cut <= 0 || cut >= rest.length) cut = Math.min(MAX_REQUEST_TEXT_LENGTH, rest.length - 1);
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  if (rest) chunks.push(rest);
  return chunks;
}

/**
 * 429 means Google throttles this IP: wait and retry instead of failing
 * the block at once. Other failures throw immediately.
 */
async function requestRetried(text, to) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await request(text, to);
    } catch (error) {
      const throttled = error?.code === Codes.REQUEST_FAILED && error?.details?.status === 429;
      if (!throttled || attempt >= RETRY_DELAYS_MS.length) throw error;
      logInfo('provider', `rate-limited, retrying in ${RETRY_DELAYS_MS[attempt]}ms`, {
        provider: 'google-free',
        to,
        chars: text.length,
        attempt: attempt + 1,
      });
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }
}

async function translate(texts, { to }) {
  const results = await Promise.all(
    texts.map(async (text) => {
      const chunks = splitLongText(text);
      const translatedChunks = await Promise.all(
        chunks.map((chunk) => requestRetried(chunk, to)),
      );
      return translatedChunks.join('');
    }),
  );
  return results;
}

registerProvider({
  id: 'google-free',
  labelKey: 'provider.google-free',
  translate,
});
