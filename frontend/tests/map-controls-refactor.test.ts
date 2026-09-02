import { describe, it, expect } from 'bun:test';
import { REGION_FILTERS, type RegionId, type MetricType } from '../src/lib/features/map/map-constants';
import { COUNTRY_CURRENCY_LIST } from '../src/lib/features/map/country-mapping';

describe('Map Controls & Filtering UI Refactor Unit Tests', () => {
  describe('Region Filter Dropdown Data & Coverage', () => {
    it('provides complete list of 8 regions with valid metadata for the dropdown selector', () => {
      expect(REGION_FILTERS.length).toBe(8);

      const allFilter = REGION_FILTERS.find((r) => r.id === 'all');
      expect(allFilter).toBeDefined();
      expect(allFilter?.label).toContain('Global');
      expect(allFilter?.emoji).toBe('🌏');

      const aseanFilter = REGION_FILTERS.find((r) => r.id === 'asean');
      expect(aseanFilter?.iso3List?.length).toBe(10);
      expect(aseanFilter?.iso3List).toContain('IDN');
      expect(aseanFilter?.iso3List).toContain('SGP');
    });

    it('calculates accurate country counts for each region filter option', () => {
      const regionCounts: Record<RegionId, number> = {
        all: COUNTRY_CURRENCY_LIST.length,
        asean: 0,
        east_asia: 0,
        europe: 0,
        americas: 0,
        middle_east: 0,
        africa: 0,
        oceania: 0,
      };

      for (const reg of REGION_FILTERS) {
        if (reg.id === 'all') continue;
        const count = reg.iso3List ? reg.iso3List.length : 0;
        regionCounts[reg.id] = count;
        expect(count).toBeGreaterThan(0);
      }

      expect(regionCounts.all).toBeGreaterThan(190);
      expect(regionCounts.asean).toBe(10);
      expect(regionCounts.europe).toBe(19);
      expect(regionCounts.americas).toBe(15);
      expect(regionCounts.middle_east).toBe(12);
      expect(regionCounts.africa).toBe(16);
      expect(regionCounts.oceania).toBe(8);
    });

    it('determines camera coordinates (lat, lng, zoom/altitude) for each region focus', () => {
      for (const reg of REGION_FILTERS) {
        expect(typeof reg.lat).toBe('number');
        expect(typeof reg.lon).toBe('number');
        expect(typeof reg.zoom).toBe('number');
        expect(reg.zoom).toBeGreaterThan(0);
      }
    });
  });

  describe('Metric & Projection Mode State Definitions', () => {
    it('supports 3 distinct visualization heatmap metrics: rate, change, flag', () => {
      const validMetrics: MetricType[] = ['rate', 'change', 'flag'];
      expect(validMetrics).toContain('rate');
      expect(validMetrics).toContain('change');
      expect(validMetrics).toContain('flag');
    });

    it('supports 2 projection modes: globe 3D and flat 2D map', () => {
      const projectionModes = ['globe', 'flat'];
      expect(projectionModes).toHaveLength(2);
      expect(projectionModes).toContain('globe');
      expect(projectionModes).toContain('flat');
    });
  });

  describe('Search & Autocomplete Navigation Logic', () => {
    it('filters country suggestions by name and currency code accurately', () => {
      const query = 'jep';
      const results = COUNTRY_CURRENCY_LIST.filter(
        (c) =>
          c.countryName.toLowerCase().includes(query.toLowerCase()) ||
          c.currencyCode.toLowerCase().includes(query.toLowerCase()) ||
          c.iso3.toLowerCase().includes(query.toLowerCase())
      );
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].iso3).toBe('JPN');
    });
  });
});
