/**
 * Population Microapp & World Bank Service Test Suite (ADR 0066 / TDD)
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import {
  getPopulationDataForCountry,
  POPULATION_DATASET,
  type CountryPopulationData,
} from '$lib/framework/geoglobe/data/populationData';
import {
  parseWorldBankIndicator,
  fetchWorldBankPopulation,
  clearPopulationCache,
} from '$lib/features/map/services/livePopulationService';
import { populationApp } from '$lib/framework/geoglobe/plugins/populationApp';

describe('Population World Microapp Suite (ADR 0066 / TDD)', () => {
  beforeEach(() => {
    clearPopulationCache();
  });

  describe('1. Bundled Population Dataset (populationData.ts)', () => {
    it('contains comprehensive global population data for 190+ countries', () => {
      expect(Object.keys(POPULATION_DATASET).length).toBeGreaterThan(180);
    });

    it('returns accurate demographic profile for Indonesia (IDN)', () => {
      const idn = getPopulationDataForCountry('IDN');
      expect(idn).toBeDefined();
      expect(idn.countryIso3).toBe('IDN');
      expect(idn.totalPopulation).toBeGreaterThan(270_000_000);
      expect(idn.densityKm2).toBeGreaterThan(100);
      expect(idn.globalRank).toBe(4);
      expect(idn.urbanPercent).toBeGreaterThan(50);
    });

    it('returns accurate demographic profile for high density city-state (SGP)', () => {
      const sgp = getPopulationDataForCountry('SGP');
      expect(sgp).toBeDefined();
      expect(sgp.densityKm2).toBeGreaterThan(7000);
      expect(sgp.urbanPercent).toBe(100);
    });

    it('provides reliable fallback for unknown ISO-3 codes', () => {
      const unknown = getPopulationDataForCountry('XYZ');
      expect(unknown).toBeDefined();
      expect(unknown.countryIso3).toBe('XYZ');
      expect(unknown.totalPopulation).toBeGreaterThan(0);
      expect(unknown.globalRank).toBeGreaterThan(150);
    });
  });

  describe('2. World Bank API Parser (parseWorldBankIndicator)', () => {
    it('parses valid World Bank indicator payload correctly', () => {
      const mockWbResponse = [
        { page: 1, pages: 1, total: 2 },
        [
          {
            indicator: { id: 'SP.POP.TOTL', value: 'Population, total' },
            country: { id: 'ID', value: 'Indonesia' },
            countryiso3code: 'IDN',
            date: '2024',
            value: 285721236,
          },
          {
            indicator: { id: 'SP.POP.TOTL', value: 'Population, total' },
            country: { id: 'SG', value: 'Singapore' },
            countryiso3code: 'SGP',
            date: '2024',
            value: 5917648,
          },
        ],
      ];

      const parsed = parseWorldBankIndicator(mockWbResponse);
      expect(parsed['IDN']).toBe(285721236);
      expect(parsed['SGP']).toBe(5917648);
    });

    it('handles malformed or empty World Bank payloads gracefully', () => {
      expect(parseWorldBankIndicator(null)).toEqual({});
      expect(parseWorldBankIndicator([])).toEqual({});
      expect(parseWorldBankIndicator([{ message: 'Error' }])).toEqual({});
    });
  });

  describe('3. Live Population Service & Offline Fallback', () => {
    it('falls back to bundled dataset if network fails without throwing', async () => {
      const result = await fetchWorldBankPopulation({
        customFetch: (async () => {
          throw new Error('Network error / offline');
        }) as any,
      });

      expect(result).toBeDefined();
      expect(result.isLive).toBe(false);
      expect(result.source).toBe('fallback_bundled');
      expect(result.data['IDN']).toBeDefined();
      expect(result.data['IDN'].totalPopulation).toBeGreaterThan(270_000_000);
    });

    it('populates live population when API returns valid data', async () => {
      const mockFetch: any = async () => {
        return {
          ok: true,
          json: async () => [
            { page: 1 },
            [
              {
                indicator: { id: 'SP.POP.TOTL' },
                countryiso3code: 'IDN',
                value: 286000000,
              },
            ],
          ],
        };
      };

      const result = await fetchWorldBankPopulation({
        customFetch: mockFetch,
        forceRefresh: true,
      });

      expect(result.isLive).toBe(true);
      expect(result.source).toBe('worldbank_live');
      expect(result.data['IDN'].totalPopulation).toBe(286000000);
    });
  });

  describe('4. Population GeoAppPlugin Configuration', () => {
    it('has correct plugin metadata and canonical routing', () => {
      expect(populationApp.id).toBe('population-world');
      expect(populationApp.canonicalPath).toBe('/population');
      expect(populationApp.aliasPaths).toContain('/demographics');
      expect(populationApp.category).toBe('demographics');
      expect(populationApp.defaultMetricId).toBe('population_total');
    });

    it('supports 4 essential demographic metrics', () => {
      const metricIds = populationApp.metrics.map((m) => m.id);
      expect(metricIds).toContain('population_total');
      expect(metricIds).toContain('population_density');
      expect(metricIds).toContain('population_growth');
      expect(metricIds).toContain('urbanization');
    });

    it('filters countries correctly by filterPredicate', () => {
      const mockCountry: any = { iso3: 'IDN', countryName: 'Indonesia' };
      const idnData: CountryPopulationData = {
        countryIso3: 'IDN',
        countryName: 'Indonesia',
        totalPopulation: 280_000_000,
        densityKm2: 148,
        growthRateAnnual: 0.8,
        urbanPercent: 58,
        globalRank: 4,
      };

      // All filter
      expect(populationApp.filterPredicate?.('IDN', 'all', idnData, mockCountry)).toBe(true);

      // Megacountries (>100M)
      expect(populationApp.filterPredicate?.('IDN', 'megacountries', idnData, mockCountry)).toBe(true);

      // Dense filter (>300/km2)
      expect(populationApp.filterPredicate?.('IDN', 'dense', idnData, mockCountry)).toBe(false);

      const sgpData: CountryPopulationData = {
        countryIso3: 'SGP',
        countryName: 'Singapore',
        totalPopulation: 5_900_000,
        densityKm2: 8300,
        growthRateAnnual: 1.1,
        urbanPercent: 100,
        globalRank: 114,
      };
      expect(populationApp.filterPredicate?.('SGP', 'dense', sgpData, mockCountry)).toBe(true);
      expect(populationApp.filterPredicate?.('SGP', 'megacountries', sgpData, mockCountry)).toBe(false);
    });

    it('generates rich inspector widget with ranking and demographics', () => {
      const mockCountry: any = {
        iso3: 'IDN',
        countryName: 'Indonesia',
        flagEmoji: '🇮🇩',
      };
      const idnData: CountryPopulationData = {
        countryIso3: 'IDN',
        countryName: 'Indonesia',
        totalPopulation: 285_721_236,
        densityKm2: 148.5,
        growthRateAnnual: 0.82,
        urbanPercent: 58.6,
        globalRank: 4,
      };

      const widget = populationApp.renderInspector?.(mockCountry, idnData);
      expect(widget).toBeDefined();
      expect(widget?.title).toContain('Indonesia');
      expect(widget?.badge?.text).toContain('#4');
      expect(widget?.statsGrid?.length).toBeGreaterThanOrEqual(4);
    });
  });
});
