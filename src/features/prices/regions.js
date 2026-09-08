/**
 * Store regions available for price comparison.
 *
 * `cc` is the country code accepted by the store `appdetails` API.
 * Names stay in English in every UI locale: they are proper nouns, which
 * keeps 24 regions from multiplying translation keys.
 */
export const PRICE_REGIONS = [
  { cc: 'US', name: 'United States', currency: 'USD' },
  { cc: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { cc: 'DE', name: 'Germany', currency: 'EUR' },
  { cc: 'PL', name: 'Poland', currency: 'PLN' },
  { cc: 'UA', name: 'Ukraine', currency: 'UAH' },
  { cc: 'RU', name: 'Russia', currency: 'RUB' },
  { cc: 'KZ', name: 'Kazakhstan', currency: 'KZT' },
  { cc: 'TR', name: 'Türkiye', currency: 'USD' },
  { cc: 'AR', name: 'Argentina', currency: 'USD' },
  { cc: 'BR', name: 'Brazil', currency: 'BRL' },
  { cc: 'MX', name: 'Mexico', currency: 'MXN' },
  { cc: 'CA', name: 'Canada', currency: 'CAD' },
  { cc: 'AU', name: 'Australia', currency: 'AUD' },
  { cc: 'NZ', name: 'New Zealand', currency: 'NZD' },
  { cc: 'JP', name: 'Japan', currency: 'JPY' },
  { cc: 'KR', name: 'South Korea', currency: 'KRW' },
  { cc: 'CN', name: 'China', currency: 'CNY' },
  { cc: 'SG', name: 'Singapore', currency: 'SGD' },
  { cc: 'IN', name: 'India', currency: 'INR' },
  { cc: 'ZA', name: 'South Africa', currency: 'ZAR' },
  { cc: 'AE', name: 'UAE', currency: 'AED' },
  { cc: 'CH', name: 'Switzerland', currency: 'CHF' },
  { cc: 'SE', name: 'Sweden', currency: 'SEK' },
  { cc: 'NO', name: 'Norway', currency: 'NOK' },
];

export function getRegion(cc) {
  return PRICE_REGIONS.find((region) => region.cc === String(cc).toUpperCase()) ?? null;
}

export function isKnownRegion(cc) {
  return getRegion(cc) !== null;
}
