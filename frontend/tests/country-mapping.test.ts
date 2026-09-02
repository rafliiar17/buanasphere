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

describe('Country and Currency Mapping Unit Tests (195+ Countries)', () => {
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

  describe('Global ISO-3 Country Dataset Integrity (195+ Countries)', () => {
    it('contains all 195+ countries and territories across 6 continents', () => {
      const allEntries = getAllCountryMappings();
      expect(allEntries.length).toBeGreaterThanOrEqual(195);
      expect(allEntries.length).toBe(201);

      for (const iso3 of SAMPLE_REQUIRED_ISO3) {
        const found = allEntries.find((e) => e.iso3 === iso3);
        expect(found).toBeDefined();
        expect(found?.iso3).toBe(iso3);
      }
    });

    it('contains distinct regions with expected distribution', () => {
      const allEntries = getAllCountryMappings();
      const regions = new Set(allEntries.map((e) => e.region));
      expect(regions.size).toBe(6);
      expect(regions.has('Asia')).toBe(true);
      expect(regions.has('Middle East')).toBe(true);
      expect(regions.has('Europe')).toBe(true);
      expect(regions.has('Americas')).toBe(true);
      expect(regions.has('Oceania')).toBe(true);
      expect(regions.has('Africa')).toBe(true);
    });

    it('ensures every country entry has valid metadata fields and emojis', () => {
      const uniqueIso3 = new Set<string>();
      for (const entry of COUNTRY_CURRENCY_LIST) {
        expect(uniqueIso3.has(entry.iso3)).toBe(false);
        uniqueIso3.add(entry.iso3);

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
    it('getCountryByIso3 returns correct country entry and handles case insensitivity', () => {
      const usa = getCountryByIso3('USA');
      expect(usa).toBeDefined();
      expect(usa?.countryName).toBe('Amerika Serikat');
      expect(usa?.currencyCode).toBe('USD');
      expect(usa?.flagEmoji).toBe('🇺🇸');
      expect(usa?.region).toBe('Americas');

      const idn = getCountryByIso3('idn');
      expect(idn).toBeDefined();
      expect(idn?.countryName).toBe('Indonesia');
      expect(idn?.currencyCode).toBe('IDR');
      expect(idn?.flagEmoji).toBe('🇮🇩');

      const invalid = getCountryByIso3('INVALID');
      expect(invalid).toBeUndefined();
    });

    it('handles aliases for common currency-country cross codes (e.g. UGX -> UGA, IRR -> IRN)', () => {
      const uganda = getCountryByIso3('UGX');
      expect(uganda).toBeDefined();
      expect(uganda?.iso3).toBe('UGA');
      expect(uganda?.currencyCode).toBe('UGX');

      const iran = getCountryByIso3('IRR');
      expect(iran).toBeDefined();
      expect(iran?.iso3).toBe('IRN');
      expect(iran?.currencyCode).toBe('IRR');
    });

    it('getCountriesByCurrency returns single country for sovereign unique currencies', () => {
      const jpyCountries = getCountriesByCurrency('JPY');
      expect(jpyCountries.length).toBe(1);
      expect(jpyCountries[0].iso3).toBe('JPN');
      expect(jpyCountries[0].countryName).toBe('Jepang');

      const sgpCountries = getCountriesByCurrency('SGD');
      expect(sgpCountries.length).toBe(1);
      expect(sgpCountries[0].iso3).toBe('SGP');
    });

    it('getCountriesByCurrency returns multiple countries for shared currencies (EUR, USD, XOF, XAF, XCD)', () => {
      const euroCountries = getCountriesByCurrency('EUR');
      expect(euroCountries.length).toBeGreaterThanOrEqual(20);
      const isoList = euroCountries.map((c) => c.iso3);
      expect(isoList).toContain('DEU');
      expect(isoList).toContain('FRA');
      expect(isoList).toContain('ITA');
      expect(isoList).toContain('ESP');
      expect(isoList).toContain('NLD');
      expect(isoList).toContain('BEL');

      const xofCountries = getCountriesByCurrency('XOF');
      expect(xofCountries.length).toBeGreaterThanOrEqual(7);

      const xafCountries = getCountriesByCurrency('XAF');
      expect(xafCountries.length).toBeGreaterThanOrEqual(6);
    });

    it('getIso3ByCurrency returns array of ISO-3 codes', () => {
      const eurIso3 = getIso3ByCurrency('EUR');
      expect(eurIso3).toContain('DEU');
      expect(eurIso3).toContain('FRA');

      const usdIso3 = getIso3ByCurrency('USD');
      expect(usdIso3).toContain('USA');

      const nonExistent = getIso3ByCurrency('NON');
      expect(nonExistent).toEqual([]);
    });
  });

  describe('buildChoroplethData Helper Function for 195+ Countries', () => {
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

    it('builds full choropleth dataset for all 201 countries with metric="rate"', () => {
      const data = buildChoroplethData(mockRates, 'rate');

      expect(data.locations.length).toBe(201);
      expect(data.z.length).toBe(201);
      expect(data.text.length).toBe(201);
      expect(data.customdata.length).toBe(201);

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

    it('builds full choropleth dataset for all 201 countries with metric="change"', () => {
      const data = buildChoroplethData(mockRates, 'change');

      expect(data.locations.length).toBe(201);
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

    it('gracefully handles unpopulated rates without throwing', () => {
      const partialRates: RateItem[] = [];
      const data = buildChoroplethData(partialRates, 'rate');

      expect(data.locations.length).toBe(201);
      expect(data.z.length).toBe(201);

      const usaIdx = data.locations.indexOf('USA');
      expect(data.z[usaIdx]).toBe(0);
      expect(data.text[usaIdx]).toContain('Kurs: N/A');
    });

    it('handles null/undefined rate lists safely', () => {
      const data = buildChoroplethData(null as unknown as RateItem[], 'rate');
      expect(data.locations.length).toBe(201);
      expect(data.z.length).toBe(201);
    });
  });
});
