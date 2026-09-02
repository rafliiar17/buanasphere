/**
 * Domain entity and mapping definitions for ISO-3 Countries and Global Currencies.
 * Aligned with CONTEXT.md and AGENTS.md.
 */

export interface CountryCurrencyEntry {
  iso3: string;
  countryName: string;
  currencyCode: string;
  currencyName: string;
  flagEmoji: string;
  region: 'Americas' | 'Europe' | 'Asia' | 'Oceania' | 'Africa' | 'Middle East';
}

export interface ChoroplethData {
  locations: string[];
  z: number[];
  text: string[];
  customdata: string[];
}

export const COUNTRY_CURRENCY_LIST: readonly CountryCurrencyEntry[] = [
  // Americas
  {
    iso3: 'USA',
    countryName: 'Amerika Serikat',
    currencyCode: 'USD',
    currencyName: 'US Dollar',
    flagEmoji: '🇺🇸',
    region: 'Americas',
  },
  {
    iso3: 'CAN',
    countryName: 'Kanada',
    currencyCode: 'CAD',
    currencyName: 'Canadian Dollar',
    flagEmoji: '🇨🇦',
    region: 'Americas',
  },
  {
    iso3: 'BRA',
    countryName: 'Brasil',
    currencyCode: 'BRL',
    currencyName: 'Brazilian Real',
    flagEmoji: '🇧🇷',
    region: 'Americas',
  },

  // Europe (Eurozone + UK + Switzerland)
  {
    iso3: 'DEU',
    countryName: 'Jerman',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    flagEmoji: '🇩🇪',
    region: 'Europe',
  },
  {
    iso3: 'FRA',
    countryName: 'Prancis',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    flagEmoji: '🇫🇷',
    region: 'Europe',
  },
  {
    iso3: 'ITA',
    countryName: 'Italia',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    flagEmoji: '🇮🇹',
    region: 'Europe',
  },
  {
    iso3: 'ESP',
    countryName: 'Spanyol',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    flagEmoji: '🇪🇸',
    region: 'Europe',
  },
  {
    iso3: 'NLD',
    countryName: 'Belanda',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    flagEmoji: '🇳🇱',
    region: 'Europe',
  },
  {
    iso3: 'BEL',
    countryName: 'Belgia',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    flagEmoji: '🇧🇪',
    region: 'Europe',
  },
  {
    iso3: 'GBR',
    countryName: 'Inggris',
    currencyCode: 'GBP',
    currencyName: 'British Pound',
    flagEmoji: '🇬🇧',
    region: 'Europe',
  },
  {
    iso3: 'CHE',
    countryName: 'Swiss',
    currencyCode: 'CHF',
    currencyName: 'Swiss Franc',
    flagEmoji: '🇨🇭',
    region: 'Europe',
  },

  // Asia
  {
    iso3: 'IDN',
    countryName: 'Indonesia',
    currencyCode: 'IDR',
    currencyName: 'Indonesian Rupiah',
    flagEmoji: '🇮🇩',
    region: 'Asia',
  },
  {
    iso3: 'SGP',
    countryName: 'Singapura',
    currencyCode: 'SGD',
    currencyName: 'Singapore Dollar',
    flagEmoji: '🇸🇬',
    region: 'Asia',
  },
  {
    iso3: 'JPN',
    countryName: 'Jepang',
    currencyCode: 'JPY',
    currencyName: 'Japanese Yen',
    flagEmoji: '🇯🇵',
    region: 'Asia',
  },
  {
    iso3: 'CHN',
    countryName: 'Tiongkok',
    currencyCode: 'CNY',
    currencyName: 'Chinese Yuan',
    flagEmoji: '🇨🇳',
    region: 'Asia',
  },
  {
    iso3: 'MYS',
    countryName: 'Malaysia',
    currencyCode: 'MYR',
    currencyName: 'Malaysian Ringgit',
    flagEmoji: '🇲🇾',
    region: 'Asia',
  },
  {
    iso3: 'THA',
    countryName: 'Thailand',
    currencyCode: 'THB',
    currencyName: 'Thai Baht',
    flagEmoji: '🇹🇭',
    region: 'Asia',
  },
  {
    iso3: 'HKG',
    countryName: 'Hong Kong',
    currencyCode: 'HKD',
    currencyName: 'Hong Kong Dollar',
    flagEmoji: '🇭🇰',
    region: 'Asia',
  },
  {
    iso3: 'KOR',
    countryName: 'Korea Selatan',
    currencyCode: 'KRW',
    currencyName: 'South Korean Won',
    flagEmoji: '🇰🇷',
    region: 'Asia',
  },
  {
    iso3: 'IND',
    countryName: 'India',
    currencyCode: 'INR',
    currencyName: 'Indian Rupee',
    flagEmoji: '🇮🇳',
    region: 'Asia',
  },
  {
    iso3: 'PHL',
    countryName: 'Filipina',
    currencyCode: 'PHP',
    currencyName: 'Philippine Peso',
    flagEmoji: '🇵🇭',
    region: 'Asia',
  },
  {
    iso3: 'VNM',
    countryName: 'Vietnam',
    currencyCode: 'VND',
    currencyName: 'Vietnamese Dong',
    flagEmoji: '🇻🇳',
    region: 'Asia',
  },

  // Oceania
  {
    iso3: 'AUS',
    countryName: 'Australia',
    currencyCode: 'AUD',
    currencyName: 'Australian Dollar',
    flagEmoji: '🇦🇺',
    region: 'Oceania',
  },
  {
    iso3: 'NZL',
    countryName: 'Selandia Baru',
    currencyCode: 'NZD',
    currencyName: 'New Zealand Dollar',
    flagEmoji: '🇳🇿',
    region: 'Oceania',
  },

  // Middle East
  {
    iso3: 'SAU',
    countryName: 'Arab Saudi',
    currencyCode: 'SAR',
    currencyName: 'Saudi Riyal',
    flagEmoji: '🇸🇦',
    region: 'Middle East',
  },
  {
    iso3: 'ARE',
    countryName: 'Uni Emirat Arab',
    currencyCode: 'AED',
    currencyName: 'UAE Dirham',
    flagEmoji: '🇦🇪',
    region: 'Middle East',
  },

  // Africa
  {
    iso3: 'ZAF',
    countryName: 'Afrika Selatan',
    currencyCode: 'ZAR',
    currencyName: 'South African Rand',
    flagEmoji: '🇿🇦',
    region: 'Africa',
  },
];

export const ISO3_LOOKUP: ReadonlyMap<string, CountryCurrencyEntry> = new Map(
  COUNTRY_CURRENCY_LIST.map((c) => [c.iso3.toUpperCase(), c])
);

export const CURRENCY_TO_COUNTRIES_MAP: ReadonlyMap<string, CountryCurrencyEntry[]> = (() => {
  const map = new Map<string, CountryCurrencyEntry[]>();
  for (const entry of COUNTRY_CURRENCY_LIST) {
    const code = entry.currencyCode.toUpperCase();
    const existing = map.get(code) ?? [];
    existing.push(entry);
    map.set(code, existing);
  }
  return map;
})();

export function getCountryByIso3(iso3: string): CountryCurrencyEntry | undefined {
  if (!iso3) return undefined;
  return ISO3_LOOKUP.get(iso3.toUpperCase());
}

export function getCountriesByCurrency(currencyCode: string): CountryCurrencyEntry[] {
  if (!currencyCode) return [];
  return CURRENCY_TO_COUNTRIES_MAP.get(currencyCode.toUpperCase()) ?? [];
}

export function getIso3ByCurrency(currencyCode: string): string[] {
  const countries = getCountriesByCurrency(currencyCode);
  return countries.map((c) => c.iso3);
}

export function getAllCountryMappings(): CountryCurrencyEntry[] {
  return [...COUNTRY_CURRENCY_LIST];
}
