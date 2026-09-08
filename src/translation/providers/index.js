/**
 * Provider registry. A provider translates an array of strings and
 * returns an array of translated strings (same order).
 *
 * registerProvider({
 *   id: 'google-free',
 *   labelKey: 'provider.google-free',
 *   translate: async (texts, { to }) => [...],
 * })
 */
const providers = new Map();

export function registerProvider(provider) {
  if (!provider || !provider.id || typeof provider.translate !== 'function') {
    throw new Error('[Steam Plus] invalid translation provider');
  }
  providers.set(provider.id, provider);
}

export function getProvider(id) {
  return providers.get(id) || null;
}

export function listProviders() {
  return [...providers.values()];
}
