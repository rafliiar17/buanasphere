/**
 * Kurs World — Country Spatial Metadata & Default Currency Rates
 * 195+ UN Member States and Global Territories spatial and currency definitions.
 */

import rawCountrySpatialData from './country_spatial_dataset.json';

export interface CountrySpatialMetadata {
  iso3: string;
  countryName: string;
  currencyCode: string;
  currencyName: string;
  flagEmoji: string;
  region: string;
  capital: string;
  lat: number;
  lng: number;
  utcOffset: number;
  continent: string;
  population?: number;
  defaultRate: number;
  defaultBuyRate: number;
  defaultSellRate: number;
  defaultChange24h: number;
}

export interface CurrencyRateInfo {
  rate: number;
  buyRate: number;
  sellRate: number;
  change24h: number;
}

/**
 * Base rate reference vs Indonesian Rupiah (IDR).
 * 1 Foreign Unit = X IDR (except IDR where 1 IDR = 1 IDR).
 */
export const GLOBAL_BASE_RATES: Record<string, number> = {
  IDR: 1,
  USD: 17765,
  EUR: 18650,
  SGD: 13350,
  JPY: 118.5,
  AUD: 11450,
  GBP: 22450,
  MYR: 4015,
  CNY: 2450,
  SAR: 4735,
  THB: 520,
  CAD: 12950,
  CHF: 20150,
  HKD: 2280,
  KRW: 13.05,
  NZD: 10650,
  INR: 212.5,
  BRL: 3190,
  ZAR: 980,
  AED: 4835,
  PHP: 312,
  VND: 0.70,
  TWD: 553,
  PKR: 63.75,
  BDT: 148.5,
  LKR: 59.25,
  NPR: 132.8,
  MMK: 8.48,
  KHR: 4.38,
  LAK: 0.82,
  BND: 13350,
  MNT: 5.25,
  KAZ: 37.2,
  KZT: 37.2,
  UZS: 1.40,
  KGS: 205.5,
  TJS: 1640,
  TMT: 5085,
  GEL: 6530,
  AMD: 46.1,
  AZN: 10465,
  MVR: 1155,
  BTN: 212.5,
  AFN: 257,
  MOP: 2220,
  KPW: 19.8,
  PGK: 4500,
  FJD: 7900,
  SBD: 2110,
  VUV: 149,
  WST: 6475,
  TOP: 7530,
  XPF: 157.4,
  QAR: 4880,
  KWD: 57940,
  BHD: 47120,
  OMR: 46135,
  JOD: 25060,
  LBP: 0.197,
  IQD: 13.55,
  ILS: 4830,
  TRY: 522,
  IRR: 0.421,
  YER: 71.0,
  SYP: 1.37,
  NOK: 1678,
  SEK: 1700,
  DKK: 2514,
  PLN: 4465,
  CZK: 762.5,
  HUF: 47.3,
  RON: 3770,
  BGN: 9590,
  RSD: 159.6,
  ALL: 187,
  BAM: 9590,
  MKD: 305,
  ISK: 129,
  UAH: 429.5,
  BYN: 5450,
  RUB: 198,
  MDL: 997.5,
  MXN: 896,
  ARS: 18.6,
  CLP: 19.1,
  COP: 4.40,
  PEN: 4720,
  VES: 483.5,
  UYU: 439,
  PYG: 2.35,
  BOB: 2570,
  CRC: 34.2,
  PAB: 17765,
  GTQ: 2300,
  HNL: 713,
  NIO: 484,
  DOP: 299.5,
  JMD: 113.7,
  TTD: 2630,
  CUP: 740.5,
  BSD: 17765,
  BBD: 8882.5,
  BZD: 8882.5,
  GYD: 85.0,
  SRD: 507.5,
  HTG: 135.0,
  XCD: 6579.5,
  AWG: 9869.5,
  ANG: 9869.5,
  EGP: 358.5,
  ZAR_NA: 980,
  NAD: 980,
  BWP: 1315,
  ZMW: 660,
  AOA: 19.5,
  MZN: 278,
  TZS: 6.85,
  KES: 137.5,
  UGX: 4.85,
  RWF: 12.8,
  BIF: 6.10,
  ETB: 142.5,
  DJF: 99.8,
  SOS: 31.2,
  SDG: 29.6,
  SSP: 13.6,
  MAD: 1775,
  DZD: 132.5,
  TND: 5690,
  LYD: 3670,
  NGN: 11.8,
  GHS: 1180,
  XOF: 28.4,
  XAF: 28.4,
  CVE: 169,
  GMD: 254,
  GNF: 2.06,
  SLL: 785,
  LRD: 91.5,
  STN: 760,
  CDF: 6.25,
  KMF: 37.9,
  SCR: 1270,
  MUR: 382.5,
  MGA: 3.88,
  SZL: 980,
  LSL: 980,
  ZWL: 0.65,
  MWK: 10.2,
};

/**
 * 24h baseline changes for common currencies.
 */
export const GLOBAL_24H_CHANGES: Record<string, number> = {
  USD: 0.15,
  EUR: -0.22,
  SGD: 0.08,
  JPY: -0.45,
  AUD: 0.32,
  GBP: -0.18,
  MYR: 0.12,
  CNY: 0.05,
  SAR: 0.14,
  THB: -0.09,
  CAD: 0.21,
  CHF: -0.11,
  HKD: 0.15,
  KRW: -0.35,
  IDR: 0.0,
};

/**
 * Generates default rate details for a currency code.
 */
export function getDefaultRate(currencyCode: string): CurrencyRateInfo {
  const code = currencyCode.toUpperCase();
  if (code === 'IDR') {
    return {
      rate: 1,
      buyRate: 1,
      sellRate: 1,
      change24h: 0,
    };
  }

  const rate = GLOBAL_BASE_RATES[code] ?? 100;
  const change24h = GLOBAL_24H_CHANGES[code] ?? ((((code.charCodeAt(0) * 17) % 50) - 25) / 100);
  const spreadPercent = 0.005; // 0.5% standard spread

  const buyRate = Math.round(rate * (1 - spreadPercent) * 100) / 100;
  const sellRate = Math.round(rate * (1 + spreadPercent) * 100) / 100;

  return {
    rate,
    buyRate,
    sellRate,
    change24h,
  };
}

/**
 * Extended country spatial metadata with embedded default exchange rates.
 */
export const EXTENDED_COUNTRIES_DATA: readonly CountrySpatialMetadata[] = (
  rawCountrySpatialData as Array<Omit<CountrySpatialMetadata, 'defaultRate' | 'defaultBuyRate' | 'defaultSellRate' | 'defaultChange24h'>>
).map((c) => {
  const rateInfo = getDefaultRate(c.currencyCode);
  return {
    ...c,
    defaultRate: rateInfo.rate,
    defaultBuyRate: rateInfo.buyRate,
    defaultSellRate: rateInfo.sellRate,
    defaultChange24h: rateInfo.change24h,
  };
});

/**
 * Lookup country by ISO-3 alpha code (case-insensitive).
 */
export function getCountryByIso3(iso3: string): CountrySpatialMetadata | undefined {
  if (!iso3) return undefined;
  const normalized = iso3.toUpperCase();
  return EXTENDED_COUNTRIES_DATA.find((c) => c.iso3.toUpperCase() === normalized);
}

/**
 * Lookup country by Currency Code (case-insensitive).
 */
export function getCountryByCurrency(currencyCode: string): CountrySpatialMetadata | undefined {
  if (!currencyCode) return undefined;
  const normalized = currencyCode.toUpperCase();
  return EXTENDED_COUNTRIES_DATA.find((c) => c.currencyCode.toUpperCase() === normalized);
}

/**
 * Lookup coordinates {lat, lng} by ISO-3 code.
 */
export function getCountryCoordinates(iso3: string): { lat: number; lng: number } | null {
  const country = getCountryByIso3(iso3);
  if (!country) return null;
  return { lat: country.lat, lng: country.lng };
}

/**
 * Lookup spatial metadata by ISO 3166-1 alpha-3 code (returns null if not found).
 */
export function getCountryMetadata(iso3: string): CountrySpatialMetadata | null {
  return getCountryByIso3(iso3) ?? null;
}

/**
 * ISO-3 to ISO-2 lookup table for CDN flag images or 2-letter codes.
 */
export const ISO3_TO_ISO2_MAP: Readonly<Record<string, string>> = {
  IDN: 'id', USA: 'us', JPN: 'jp', CHN: 'cn', GBR: 'gb', DEU: 'de', FRA: 'fr', SGP: 'sg',
  AUS: 'au', SAU: 'sa', MYS: 'my', THA: 'th', IND: 'in', BRA: 'br', ZAF: 'za', KOR: 'kr',
  CAN: 'ca', RUS: 'ru', ITA: 'it', ESP: 'es', TUR: 'tr', EGY: 'eg', ARE: 'ae', PHL: 'ph',
  VNM: 'vn', KAZ: 'kz', NLD: 'nl', CHE: 'ch', SWE: 'se', NOR: 'no', DNK: 'dk', POL: 'pl',
  MEX: 'mx', ARG: 'ar', CHL: 'cl', COL: 'co', PER: 'pe', NZL: 'nz', QAT: 'qa', KWT: 'kw',
  OMN: 'om', BHR: 'bh', JOR: 'jo', LBN: 'lb', IRQ: 'iq', ISR: 'il', IRN: 'ir', PAK: 'pk',
  BGD: 'bd', LKA: 'lk', NPL: 'np', MMR: 'mm', KHM: 'kh', LAO: 'la', BRN: 'bn', NGA: 'ng',
  KEN: 'ke', GHA: 'gh', MAR: 'ma', DZA: 'dz', TUN: 'tn', ETH: 'et', TZA: 'tz', UGA: 'ug',
  UKR: 'ua', ROU: 'ro', CZE: 'cz', GRC: 'gr', PRT: 'pt', BEL: 'be', AUT: 'at', IRL: 'ie',
  FIN: 'fi', HUN: 'hu', HRV: 'hr', BGR: 'bg', SRB: 'rs', SVK: 'sk', SVN: 'si', EST: 'ee',
  LVA: 'lv', LTU: 'lt', CYP: 'cy', ISL: 'is', LUX: 'lu', MLT: 'mt', GEO: 'ge', ARM: 'am',
  AZE: 'az', UZB: 'uz', TKM: 'tm', TJK: 'tj', KGZ: 'kg', MNG: 'mn', TWN: 'tw', HKG: 'hk',
  MAC: 'mo', FJI: 'fj', PNG: 'pg', SLB: 'sb', VUT: 'vu', WSM: 'ws', TON: 'to', SOM: 'so',
};

/**
 * Returns ISO-2 code lowercase for a given ISO-3 code.
 */
export function getCountryIso2(iso3: string): string | null {
  if (!iso3) return null;
  return ISO3_TO_ISO2_MAP[iso3.trim().toUpperCase()] ?? null;
}

