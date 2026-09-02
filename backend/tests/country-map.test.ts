import { describe, expect, it } from 'bun:test';
import {
  COUNTRY_CURRENCY_LIST,
  getCountryByIso3,
  getCountriesByCurrency,
  getIso3ByCurrency,
  getAllCountryMappings,
} from '../src/domain/country-map.ts';

describe('Backend Domain Country-Map Unit Tests', () => {
  const EXPECTED_ISO3_CODES = [
    'USA', 'DEU', 'FRA', 'ITA', 'ESP', 'NLD', 'BEL',
    'SGP', 'JPN', 'GBR', 'AUS', 'CHN', 'MYS', 'SAU',
    'THA', 'CAN', 'CHE', 'HKG', 'KOR', 'NZL', 'IND',
    'BRA', 'ZAF', 'ARE', 'PHL', 'VNM', 'IDN',
  ];

  it('contains all 27 ISO-3 country mappings', () => {
    const list = getAllCountryMappings();
    expect(list.length).toBe(27);

    for (const iso3 of EXPECTED_ISO3_CODES) {
      const entry = getCountryByIso3(iso3);
      expect(entry).toBeDefined();
      expect(entry?.iso3).toBe(iso3);
    }
  });

  it('maps EUR to all European Eurozone member countries', () => {
    const euroCountries = getCountriesByCurrency('EUR');
    expect(euroCountries.length).toBeGreaterThanOrEqual(6);

    const iso3List = euroCountries.map((c) => c.iso3);
    expect(iso3List).toContain('DEU');
    expect(iso3List).toContain('FRA');
    expect(iso3List).toContain('ITA');
    expect(iso3List).toContain('ESP');
    expect(iso3List).toContain('NLD');
    expect(iso3List).toContain('BEL');
  });

  it('getIso3ByCurrency returns expected array of ISO-3 codes', () => {
    const usd = getIso3ByCurrency('USD');
    expect(usd).toEqual(['USA']);

    const jpy = getIso3ByCurrency('JPY');
    expect(jpy).toEqual(['JPN']);
  });
});
