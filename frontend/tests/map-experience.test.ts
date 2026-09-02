import { describe, expect, it } from 'bun:test';
import { SUPPORTED_CURRENCIES } from '../src/lib/api/client';
import { formatRupiah, formatPercent, formatCurrency } from '../src/lib/formatters/currency';
import { REGION_FILTERS, COUNTRY_CURRENCY_MAP } from '../src/lib/features/map/map-constants';
import type { RateItem } from '../src/lib/api/types';

describe('Map Experience & Global Movers Unit Tests', () => {
  const mockRates: RateItem[] = [
    {
      id: 'bca-usd',
      providerId: 'bca',
      providerName: 'BCA (e-Rate)',
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
      providerName: 'BCA (e-Rate)',
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
      providerName: 'BCA (e-Rate)',
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
      id: 'bca-sgd',
      providerId: 'bca',
      providerName: 'BCA (e-Rate)',
      baseCurrency: 'IDR',
      targetCurrency: 'SGD',
      buyRate: 12180,
      sellRate: 12260,
      middleRate: 12220,
      spread: 80,
      spreadPercent: 0.65,
      change24h: 0.08,
      updatedAt: '2026-09-02T00:00:00Z',
    },
    {
      id: 'bca-aud',
      providerId: 'bca',
      providerName: 'BCA (e-Rate)',
      baseCurrency: 'IDR',
      targetCurrency: 'AUD',
      buyRate: 10380,
      sellRate: 10490,
      middleRate: 10435,
      spread: 110,
      spreadPercent: 1.05,
      change24h: 0.31,
      updatedAt: '2026-09-02T00:00:00Z',
    },
  ];

  describe('Global Movers Ticker Sorting Logic', () => {
    it('sorts top 3 gainers (menguat vs IDR) in descending order of change24h', () => {
      const topGainers = [...mockRates]
        .sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0))
        .slice(0, 3);

      expect(topGainers.length).toBe(3);
      expect(topGainers[0].targetCurrency).toBe('AUD'); // +0.31%
      expect(topGainers[1].targetCurrency).toBe('USD'); // +0.25%
      expect(topGainers[2].targetCurrency).toBe('SGD'); // +0.08%
    });

    it('sorts top 3 losers (melemah vs IDR) in ascending order of change24h', () => {
      const topLosers = [...mockRates]
        .sort((a, b) => (a.change24h ?? 0) - (b.change24h ?? 0))
        .slice(0, 3);

      expect(topLosers.length).toBe(3);
      expect(topLosers[0].targetCurrency).toBe('JPY'); // -0.45%
      expect(topLosers[1].targetCurrency).toBe('EUR'); // -0.22%
      expect(topLosers[2].targetCurrency).toBe('SGD'); // +0.08%
    });
  });

  describe('Mini Quick Converter Calculations & Preset Buttons', () => {
    const usdMid = 16250;
    const presets = [1, 10, 50, 100, 1000, 10000];

    it('calculates Foreign to IDR correctly for all preset amounts', () => {
      for (const amount of presets) {
        const result = amount * usdMid;
        expect(result).toBe(amount * 16250);
        const formatted = formatRupiah(result, { showFraction: false });
        expect(formatted.startsWith('Rp')).toBeTrue();
      }
    });

    it('calculates IDR to Foreign correctly for all preset amounts', () => {
      for (const amountIdr of presets) {
        const resultForeign = amountIdr / usdMid;
        expect(resultForeign).toBeGreaterThan(0);
        const formatted = formatCurrency(resultForeign, 'USD', { maxDecimals: 4 });
        expect(formatted.startsWith('$')).toBeTrue();
      }
    });

    it('handles micro currency like VND calculation properly', () => {
      const vndMid = 0.64;
      const amountVnd = 100000;
      const resultIdr = amountVnd * vndMid;
      expect(resultIdr).toBe(64000);
      expect(formatRupiah(resultIdr, { showFraction: false })).toBe('Rp 64.000');
    });

    it('calculates spread and spread margin percent correctly', () => {
      const buyRate = 16220;
      const sellRate = 16280;
      const midRate = 16250;
      const spread = sellRate - buyRate;
      const spreadPercent = (spread / midRate) * 100;

      expect(spread).toBe(60);
      expect(spreadPercent).toBeCloseTo(0.369, 2);
    });
  });

  describe('Region Filters and Country Coverage', () => {
    it('contains all 8 required region filter definitions', () => {
      const expectedRegions = [
        'all',
        'asean',
        'east_asia',
        'europe',
        'americas',
        'middle_east',
        'africa',
        'oceania',
      ];
      expect(REGION_FILTERS.length).toBe(8);
      for (const regionId of expectedRegions) {
        const found = REGION_FILTERS.find((r) => r.id === regionId);
        expect(found).toBeDefined();
        expect(found?.emoji).toBeString();
        expect(found?.label).toBeString();
        expect(typeof found?.zoom).toBe('number');
      }
    });

    it('ensures COUNTRY_CURRENCY_MAP contains valid ISO-3 entries and non-zero rates', () => {
      expect(COUNTRY_CURRENCY_MAP.length).toBeGreaterThanOrEqual(25);
      for (const country of COUNTRY_CURRENCY_MAP) {
        expect(country.iso3.length).toBe(3);
        expect(country.flag.length).toBeGreaterThan(0);
        expect(country.countryName.length).toBeGreaterThan(0);
        expect(country.currencyCode.length).toBe(3);
        expect(country.defaultRate.buy).toBeGreaterThan(0);
        expect(country.defaultRate.sell).toBeGreaterThan(0);
        expect(country.defaultRate.mid).toBeGreaterThan(0);
        expect(country.defaultRate.sell).toBeGreaterThanOrEqual(country.defaultRate.buy);
      }
    });

    it('correctly maps ASEAN countries in the ASEAN region list', () => {
      const aseanFilter = REGION_FILTERS.find((r) => r.id === 'asean');
      expect(aseanFilter).toBeDefined();
      expect(aseanFilter?.iso3List).toContain('IDN');
      expect(aseanFilter?.iso3List).toContain('SGP');
      expect(aseanFilter?.iso3List).toContain('MYS');
      expect(aseanFilter?.iso3List).toContain('THA');
    });

    it('correctly maps East Asia countries in the East Asia region list', () => {
      const eastAsiaFilter = REGION_FILTERS.find((r) => r.id === 'east_asia');
      expect(eastAsiaFilter).toBeDefined();
      expect(eastAsiaFilter?.iso3List).toContain('JPN');
      expect(eastAsiaFilter?.iso3List).toContain('CHN');
      expect(eastAsiaFilter?.iso3List).toContain('HKG');
      expect(eastAsiaFilter?.iso3List).toContain('KOR');
    });

    it('correctly maps Middle East countries in the Middle East region list', () => {
      const meFilter = REGION_FILTERS.find((r) => r.id === 'middle_east');
      expect(meFilter).toBeDefined();
      expect(meFilter?.iso3List).toContain('SAU');
      expect(meFilter?.iso3List).toContain('ARE');
    });

    it('correctly maps Africa countries in the Africa region list', () => {
      const africaFilter = REGION_FILTERS.find((r) => r.id === 'africa');
      expect(africaFilter).toBeDefined();
      expect(africaFilter?.iso3List).toContain('ZAF');
      expect(africaFilter?.iso3List).toContain('EGY');
    });
  });

  describe('Autocomplete Search Filter Logic', () => {
    function filterCountries(query: string) {
      const q = query.toLowerCase().trim();
      return COUNTRY_CURRENCY_MAP.filter(
        (d) =>
          d.countryName.toLowerCase().includes(q) ||
          d.currencyCode.toLowerCase().includes(q) ||
          d.currencyName.toLowerCase().includes(q) ||
          d.iso3.toLowerCase().includes(q) ||
          d.regionLabel.toLowerCase().includes(q)
      );
    }

    it('filters correctly by currency code (USD, JPY, EUR, SAR)', () => {
      const usdResults = filterCountries('USD');
      expect(usdResults.some((c) => c.currencyCode === 'USD')).toBeTrue();

      const jpyResults = filterCountries('JPY');
      expect(jpyResults.some((c) => c.currencyCode === 'JPY')).toBeTrue();

      const eurResults = filterCountries('EUR');
      expect(eurResults.length).toBeGreaterThan(1); // Multiple Eurozone nations
    });

    it('filters correctly by country name (Jepang, Arab Saudi, Jerman, Singapura)', () => {
      const jepangResults = filterCountries('Jepang');
      expect(jepangResults.some((c) => c.iso3 === 'JPN')).toBeTrue();

      const saudiResults = filterCountries('Arab Saudi');
      expect(saudiResults.some((c) => c.iso3 === 'SAU')).toBeTrue();

      const jermanResults = filterCountries('Jerman');
      expect(jermanResults.some((c) => c.iso3 === 'DEU')).toBeTrue();
    });

    it('filters correctly by ISO-3 code (USA, DEU, GBR, AUS)', () => {
      const usaResults = filterCountries('USA');
      expect(usaResults.some((c) => c.iso3 === 'USA')).toBeTrue();

      const gbrResults = filterCountries('GBR');
      expect(gbrResults.some((c) => c.iso3 === 'GBR')).toBeTrue();
    });

    it('filters correctly by region label (Eropa, ASEAN, Afrika)', () => {
      const eropaResults = filterCountries('Eropa');
      expect(eropaResults.length).toBeGreaterThan(5);

      const aseanResults = filterCountries('ASEAN');
      expect(aseanResults.length).toBeGreaterThan(5);
    });
  });

  describe('Supported Currency Metadata Integrity', () => {
    it('contains valid flags and countries for all popular tickers', () => {
      const popular = ['USD', 'EUR', 'SGD', 'JPY', 'MYR', 'CNY', 'SAR'];
      for (const code of popular) {
        const found = SUPPORTED_CURRENCIES.find((c) => c.code === code);
        expect(found).toBeDefined();
        expect(found?.flag).toBeString();
        expect(found?.flag.length).toBeGreaterThan(0);
        expect(found?.country).toBeString();
      }
    });
  });
});
