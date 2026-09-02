import { describe, expect, it } from 'bun:test';
import {
  COUNTRY_CURRENCY_LIST,
  getCountryByIso3,
  getCountriesByCurrency,
  getIso3ByCurrency,
  getAllCountryMappings,
  buildChoroplethData,
} from '../src/lib/features/map/country-mapping';
import type { RateItem } from '../src/lib/api/types';

describe('Country and Currency Mapping Unit Tests', () => {
  const EXPECTED_ISO3_CODES = [
    'USA', 'DEU', 'FRA', 'ITA', 'ESP', 'NLD', 'BEL',
    'SGP', 'JPN', 'GBR', 'AUS', 'CHN', 'MYS', 'SAU',
    'THA', 'CAN', 'CHE', 'HKG', 'KOR', 'NZL', 'IND',
    'BRA', 'ZAF', 'ARE', 'PHL', 'VNM', 'IDN',
  ];

  const EXPECTED_CURRENCIES = [
    'USD', 'EUR', 'SGD', 'JPY', 'GBP', 'AUD', 'CNY',
    'MYR', 'SAR', 'THB', 'CAD', 'CHF', 'HKD', 'KRW',
    'NZD', 'INR', 'BRL', 'ZAR', 'AED', 'PHP', 'VND',
    'IDR',
  ];

  describe('ISO-3 Country Dataset Integrity', () => {
    it('contains all 27 required ISO-3 countries', () => {
      const allEntries = getAllCountryMappings();
      expect(allEntries.length).toBe(27);

      for (const iso3 of EXPECTED_ISO3_CODES) {
        const found = allEntries.find((e) => e.iso3 === iso3);
        expect(found).toBeDefined();
      }
    });

    it('contains all 22 required currency codes', () => {
      const allEntries = getAllCountryMappings();
      const uniqueCurrencies = new Set(allEntries.map((e) => e.currencyCode));

      for (const ccy of EXPECTED_CURRENCIES) {
        expect(uniqueCurrencies.has(ccy)).toBe(true);
      }
    });

    it('ensures every country entry has valid metadata fields', () => {
      for (const entry of COUNTRY_CURRENCY_LIST) {
        expect(entry.iso3).toMatch(/^[A-Z]{3}$/);
        expect(entry.countryName).toBeString();
        expect(entry.countryName.length).toBeGreaterThan(0);
        expect(entry.currencyCode).toMatch(/^[A-Z]{3}$/);
        expect(entry.currencyName).toBeString();
        expect(entry.currencyName.length).toBeGreaterThan(0);
        expect(entry.flagEmoji).toBeString();
        expect(entry.flagEmoji.length).toBeGreaterThan(0);
        expect(['Americas', 'Europe', 'Asia', 'Oceania', 'Africa', 'Middle East']).toContain(
          entry.region
        );
      }
    });
  });

  describe('Lookup Helper Functions', () => {
    it('getCountryByIso3 returns correct country entry', () => {
      const usa = getCountryByIso3('USA');
      expect(usa).toBeDefined();
      expect(usa?.countryName).toBe('Amerika Serikat');
      expect(usa?.currencyCode).toBe('USD');
      expect(usa?.flagEmoji).toBe('🇺🇸');
      expect(usa?.region).toBe('Americas');

      const idn = getCountryByIso3('idn'); // Case insensitive check
      expect(idn).toBeDefined();
      expect(idn?.countryName).toBe('Indonesia');
      expect(idn?.currencyCode).toBe('IDR');
      expect(idn?.flagEmoji).toBe('🇮🇩');

      const invalid = getCountryByIso3('XYZ');
      expect(invalid).toBeUndefined();
    });

    it('getCountriesByCurrency returns single country for standard currencies', () => {
      const jpyCountries = getCountriesByCurrency('JPY');
      expect(jpyCountries.length).toBe(1);
      expect(jpyCountries[0].iso3).toBe('JPN');
      expect(jpyCountries[0].countryName).toBe('Jepang');

      const sgpCountries = getCountriesByCurrency('SGD');
      expect(sgpCountries.length).toBe(1);
      expect(sgpCountries[0].iso3).toBe('SGP');
    });

    it('getCountriesByCurrency returns multiple countries for Euro (EUR)', () => {
      const euroCountries = getCountriesByCurrency('EUR');
      expect(euroCountries.length).toBeGreaterThanOrEqual(6);
      const isoList = euroCountries.map((c) => c.iso3);
      expect(isoList).toContain('DEU');
      expect(isoList).toContain('FRA');
      expect(isoList).toContain('ITA');
      expect(isoList).toContain('ESP');
      expect(isoList).toContain('NLD');
      expect(isoList).toContain('BEL');
    });

    it('getIso3ByCurrency returns array of ISO-3 codes', () => {
      const eurIso3 = getIso3ByCurrency('EUR');
      expect(eurIso3).toContain('DEU');
      expect(eurIso3).toContain('FRA');

      const usdIso3 = getIso3ByCurrency('USD');
      expect(usdIso3).toEqual(['USA']);

      const nonExistent = getIso3ByCurrency('NON');
      expect(nonExistent).toEqual([]);
    });
  });

  describe('buildChoroplethData Helper Function', () => {
    const mockRates: RateItem[] = [
      {
        id: 'bca-usd',
        providerId: 'bca',
        providerName: 'BCA',
        baseCurrency: 'IDR',
        targetCurrency: 'USD',
        buyRate: 16220,
        sellRate: 16280,
        middleRate: 16250,
        spread: 60,
        spreadPercent: 0.37,
        change24h: 0.25,
        updatedAt: '2026-09-02T00:00:00Z',
      },
      {
        id: 'bca-eur',
        providerId: 'bca',
        providerName: 'BCA',
        baseCurrency: 'IDR',
        targetCurrency: 'EUR',
        buyRate: 17050,
        sellRate: 17180,
        middleRate: 17115,
        spread: 130,
        spreadPercent: 0.76,
        change24h: -0.22,
        updatedAt: '2026-09-02T00:00:00Z',
      },
      {
        id: 'bca-jpy',
        providerId: 'bca',
        providerName: 'BCA',
        baseCurrency: 'IDR',
        targetCurrency: 'JPY',
        buyRate: 107.5,
        sellRate: 109.2,
        middleRate: 108.35,
        spread: 1.7,
        spreadPercent: 1.57,
        change24h: -0.45,
        updatedAt: '2026-09-02T00:00:00Z',
      },
      {
        id: 'bca-vnd',
        providerId: 'bca',
        providerName: 'BCA',
        baseCurrency: 'IDR',
        targetCurrency: 'VND',
        buyRate: 0.62,
        sellRate: 0.66,
        middleRate: 0.64,
        spread: 0.04,
        spreadPercent: 6.25,
        change24h: 0.02,
        updatedAt: '2026-09-02T00:00:00Z',
      },
    ];

    it('builds choropleth dataset for metric="rate"', () => {
      const data = buildChoroplethData(mockRates, 'rate');

      expect(data.locations.length).toBe(COUNTRY_CURRENCY_LIST.length);
      expect(data.z.length).toBe(COUNTRY_CURRENCY_LIST.length);
      expect(data.text.length).toBe(COUNTRY_CURRENCY_LIST.length);
      expect(data.customdata.length).toBe(COUNTRY_CURRENCY_LIST.length);

      // Verify USA entry
      const usaIdx = data.locations.indexOf('USA');
      expect(usaIdx).toBeGreaterThanOrEqual(0);
      expect(data.z[usaIdx]).toBe(16250);
      expect(data.customdata[usaIdx]).toBe('USD');
      expect(data.text[usaIdx]).toContain('🇺🇸 Amerika Serikat (USD)');
      expect(data.text[usaIdx]).toContain('Kurs: Rp 16.250,00');
      expect(data.text[usaIdx]).toContain('Perubahan: +0.25%');

      // Verify EUR countries (DEU, FRA, ITA) share the same rate
      const deuIdx = data.locations.indexOf('DEU');
      const fraIdx = data.locations.indexOf('FRA');
      expect(data.z[deuIdx]).toBe(17115);
      expect(data.z[fraIdx]).toBe(17115);
      expect(data.text[deuIdx]).toContain('🇩🇪 Jerman (EUR)');
      expect(data.text[deuIdx]).toContain('Kurs: Rp 17.115,00');
      expect(data.text[deuIdx]).toContain('Perubahan: -0.22%');

      // Verify Domestic IDR (Indonesia)
      const idnIdx = data.locations.indexOf('IDN');
      expect(idnIdx).toBeGreaterThanOrEqual(0);
      expect(data.z[idnIdx]).toBe(1);
      expect(data.customdata[idnIdx]).toBe('IDR');
      expect(data.text[idnIdx]).toContain('🇮🇩 Indonesia (IDR)');
      expect(data.text[idnIdx]).toContain('Kurs: Rp 1,00');
      expect(data.text[idnIdx]).toContain('Perubahan: 0.00%');
    });

    it('builds choropleth dataset for metric="change"', () => {
      const data = buildChoroplethData(mockRates, 'change');

      const usaIdx = data.locations.indexOf('USA');
      expect(data.z[usaIdx]).toBe(0.25);

      const deuIdx = data.locations.indexOf('DEU');
      expect(data.z[deuIdx]).toBe(-0.22);

      const jpyIdx = data.locations.indexOf('JPN');
      expect(data.z[jpyIdx]).toBe(-0.45);

      const idnIdx = data.locations.indexOf('IDN');
      expect(data.z[idnIdx]).toBe(0);
    });

    it('handles micro currency (< 1 IDR) like VND properly with Indonesian fraction', () => {
      const data = buildChoroplethData(mockRates, 'rate');
      const vnmIdx = data.locations.indexOf('VNM');

      expect(vnmIdx).toBeGreaterThanOrEqual(0);
      expect(data.z[vnmIdx]).toBe(0.64);
      expect(data.text[vnmIdx]).toContain('🇻🇳 Vietnam (VND)');
      expect(data.text[vnmIdx]).toContain('Kurs: Rp 0,64');
    });

    it('gracefully handles missing rates without throwing', () => {
      const partialRates: RateItem[] = [];
      const data = buildChoroplethData(partialRates, 'rate');

      expect(data.locations.length).toBe(COUNTRY_CURRENCY_LIST.length);
      expect(data.z.length).toBe(COUNTRY_CURRENCY_LIST.length);

      const usaIdx = data.locations.indexOf('USA');
      expect(data.z[usaIdx]).toBe(0);
      expect(data.text[usaIdx]).toContain('Kurs: N/A');
    });

    it('handles null/undefined rate lists safely', () => {
      const data = buildChoroplethData(null as unknown as RateItem[], 'rate');
      expect(data.locations.length).toBe(COUNTRY_CURRENCY_LIST.length);
      expect(data.z.length).toBe(COUNTRY_CURRENCY_LIST.length);
    });
  });
});
