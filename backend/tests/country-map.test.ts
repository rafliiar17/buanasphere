import { describe, expect, it } from 'bun:test';
import {
  COUNTRY_CURRENCY_LIST,
  getCountryByIso3,
  getCountriesByCurrency,
  getIso3ByCurrency,
  getAllCountryMappings,
} from '../src/domain/country-map.ts';

describe('Backend Domain Country-Map Unit Tests (195+ Countries)', () => {
  const SAMPLE_REQUIRED_ISO3 = [
    // Asia
    'IDN', 'SGP', 'MYS', 'THA', 'PHL', 'VNM', 'JPN', 'CHN', 'HKG', 'KOR',
    'TWN', 'IND', 'PAK', 'BGD', 'LKA', 'NPL', 'MMR', 'KHM', 'LAO', 'BRN',
    'TLS', 'MNG', 'KAZ', 'UZB', 'KGZ', 'TJK', 'TKM', 'GEO', 'ARM', 'AZE',
    // Middle East
    'SAU', 'ARE', 'QAT', 'KWT', 'BHR', 'OMN', 'JOR', 'LBN', 'IRQ', 'ISR',
    'TUR', 'IRN', 'YEM',
    // Europe
    'DEU', 'FRA', 'ITA', 'ESP', 'NLD', 'BEL', 'AUT', 'PRT', 'GRC', 'FIN',
    'IRL', 'SVK', 'SVN', 'EST', 'LVA', 'LTU', 'CYP', 'MLT', 'LUX', 'HRV',
    'GBR', 'CHE', 'NOR', 'SWE', 'DNK', 'POL', 'CZE', 'HUN', 'ROU', 'BGR',
    'SRB', 'ALB', 'BIH', 'MKD', 'ISL', 'UKR', 'BLR', 'RUS', 'MDA', 'MNE',
    // Americas
    'USA', 'CAN', 'MEX', 'BRA', 'ARG', 'CHL', 'COL', 'PER', 'VEN', 'ECU',
    'URY', 'PRY', 'BOL', 'CRI', 'PAN', 'GTM', 'HND', 'NIC', 'SLV', 'DOM',
    'JAM', 'TTO', 'CUB', 'BHS', 'BRB', 'BLZ', 'GUY', 'SUR',
    // Oceania
    'AUS', 'NZL', 'PNG', 'FJI', 'SLB', 'VUT', 'WSM', 'TON',
    // Africa
    'ZAF', 'EGY', 'NGA', 'KEN', 'GHA', 'MAR', 'DZA', 'TUN', 'ETH', 'TZA',
    'UGA', 'RWA', 'MUS', 'SYC', 'AGO', 'MOZ', 'ZMB', 'ZWE', 'SEN', 'CIV',
    'MLI', 'BFA', 'NER', 'TGO', 'BEN', 'GNB', 'CMR', 'GAB', 'COG', 'TCD',
    'CAF', 'GNQ', 'COD', 'MDG', 'BWP', 'NAM', 'SWZ', 'LSO', 'SDN', 'SSD',
    'LBY', 'MRT', 'GMB', 'SLE', 'LBR', 'GIN',
  ];

  it('maps 195+ global countries and territories with full coverage', () => {
    const list = getAllCountryMappings();
    expect(list.length).toBeGreaterThanOrEqual(195);
    expect(list.length).toBe(201);

    for (const iso3 of SAMPLE_REQUIRED_ISO3) {
      const entry = getCountryByIso3(iso3);
      expect(entry).toBeDefined();
      expect(entry?.iso3).toBe(iso3);
      expect(entry?.countryName).toBeString();
      expect(entry?.currencyCode).toMatch(/^[A-Z]{3}$/);
      expect(entry?.flagEmoji).toBeString();
      expect(entry?.region).toBeDefined();
    }
  });

  it('covers all 6 geographic world regions comprehensively', () => {
    const list = getAllCountryMappings();
    const regionCounts = list.reduce<Record<string, number>>((acc, item) => {
      acc[item.region] = (acc[item.region] || 0) + 1;
      return acc;
    }, {});

    expect(regionCounts['Asia']).toBeGreaterThanOrEqual(30);
    expect(regionCounts['Middle East']).toBeGreaterThanOrEqual(12);
    expect(regionCounts['Europe']).toBeGreaterThanOrEqual(40);
    expect(regionCounts['Americas']).toBeGreaterThanOrEqual(30);
    expect(regionCounts['Oceania']).toBeGreaterThanOrEqual(8);
    expect(regionCounts['Africa']).toBeGreaterThanOrEqual(45);
  });

  it('maps EUR to all European Eurozone member countries (> 20 countries)', () => {
    const euroCountries = getCountriesByCurrency('EUR');
    expect(euroCountries.length).toBeGreaterThanOrEqual(20);

    const iso3List = euroCountries.map((c) => c.iso3);
    expect(iso3List).toContain('DEU');
    expect(iso3List).toContain('FRA');
    expect(iso3List).toContain('ITA');
    expect(iso3List).toContain('ESP');
    expect(iso3List).toContain('NLD');
    expect(iso3List).toContain('BEL');
    expect(iso3List).toContain('AUT');
    expect(iso3List).toContain('PRT');
    expect(iso3List).toContain('FIN');
    expect(iso3List).toContain('GRC');
  });

  it('handles country aliases and currency fallback codes (e.g. UGX -> UGA, IRR -> IRN)', () => {
    const ugandaByAlias = getCountryByIso3('UGX');
    expect(ugandaByAlias).toBeDefined();
    expect(ugandaByAlias?.iso3).toBe('UGA');
    expect(ugandaByAlias?.countryName).toBe('Uganda');

    const iranByAlias = getCountryByIso3('IRR');
    expect(iranByAlias).toBeDefined();
    expect(iranByAlias?.iso3).toBe('IRN');
    expect(iranByAlias?.countryName).toBe('Iran');

    const directUganda = getCountryByIso3('UGA');
    expect(directUganda?.iso3).toBe('UGA');

    const directIran = getCountryByIso3('IRN');
    expect(directIran?.iso3).toBe('IRN');
  });

  it('getIso3ByCurrency returns expected array of ISO-3 codes', () => {
    const usd = getIso3ByCurrency('USD');
    expect(usd).toContain('USA');
    expect(usd).toContain('ECU');
    expect(usd).toContain('SLV');

    const jpy = getIso3ByCurrency('JPY');
    expect(jpy).toEqual(['JPN']);

    const idr = getIso3ByCurrency('IDR');
    expect(idr).toEqual(['IDN']);
  });

  it('ensures all 201 entries have unique ISO-3 codes and valid attributes', () => {
    const list = COUNTRY_CURRENCY_LIST;
    const isoSet = new Set<string>();

    for (const item of list) {
      expect(isoSet.has(item.iso3)).toBe(false);
      isoSet.add(item.iso3);

      expect(item.iso3).toMatch(/^[A-Z]{3}$/);
      expect(item.currencyCode).toMatch(/^[A-Z]{3}$/);
      expect(item.countryName.length).toBeGreaterThan(0);
      expect(item.currencyName.length).toBeGreaterThan(0);
      expect(item.flagEmoji.length).toBeGreaterThan(0);
    }
  });
});
