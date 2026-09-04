/**
 * Comprehensive Dataset JSON Decoupling Test Suite (ADR 0071 / TDD)
 */

import { describe, it, expect } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Dataset JSON Decoupling Verification Suite (ADR 0071 / TDD)', () => {
  const geoglobeDataDir = path.resolve(__dirname, '../src/lib/framework/geoglobe/data');
  const globeDataDir = path.resolve(__dirname, '../src/lib/features/map/globe/data');
  const mapFeaturesDir = path.resolve(__dirname, '../src/lib/features/map');

  describe('1. World Cities Time Dataset Decoupling', () => {
    it('verifies world_cities_time_dataset.json exists and is valid JSON', () => {
      const jsonPath = path.join(geoglobeDataDir, 'world_cities_time_dataset.json');
      expect(fs.existsSync(jsonPath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      expect(Array.isArray(content)).toBe(true);
      expect(content.length).toBeGreaterThanOrEqual(120);
    });

    it('loads typed WORLD_CITIES_TIME correctly from JSON wrapper', async () => {
      const { WORLD_CITIES_TIME } = await import(
        '../src/lib/framework/geoglobe/data/worldCitiesTimeData'
      );
      expect(WORLD_CITIES_TIME).toBeDefined();
      expect(WORLD_CITIES_TIME.length).toBeGreaterThanOrEqual(120);

      // Verify specific essential hubs
      const jkt = WORLD_CITIES_TIME.find((c) => c.id === 'id-jkt');
      expect(jkt).toBeDefined();
      expect(jkt?.cityName).toBe('Jakarta');
      expect(jkt?.utcOffset).toBe(7);

      const dps = WORLD_CITIES_TIME.find((c) => c.id === 'id-dps');
      expect(dps).toBeDefined();
      expect(dps?.cityName).toBe('Denpasar (Bali)');
      expect(dps?.utcOffset).toBe(8);

      const nyc = WORLD_CITIES_TIME.find((c) => c.cityName === 'New York');
      expect(nyc).toBeDefined();
      expect(nyc?.countryIso3).toBe('USA');
    });
  });

  describe('2. World Capitals Detail Dataset Decoupling', () => {
    it('verifies capital_details_dataset.json exists and is valid JSON', () => {
      const jsonPath = path.join(geoglobeDataDir, 'capital_details_dataset.json');
      expect(fs.existsSync(jsonPath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      expect(content.coordinates).toBeDefined();
      expect(content.anthems).toBeDefined();
      expect(Object.keys(content.coordinates).length).toBeGreaterThanOrEqual(190);
      expect(Object.keys(content.anthems).length).toBeGreaterThanOrEqual(190);
    });

    it('loads typed CAPITAL_COORDINATES_MAP and NATIONAL_ANTHEMS_MAP correctly', async () => {
      const { CAPITAL_COORDINATES_MAP, NATIONAL_ANTHEMS_MAP } = await import(
        '../src/lib/framework/geoglobe/data/worldCapitalsDetail'
      );
      expect(CAPITAL_COORDINATES_MAP['IDN']).toBeDefined();
      expect(CAPITAL_COORDINATES_MAP['IDN'].lat).toBeCloseTo(-6.2088, 3);
      expect(CAPITAL_COORDINATES_MAP['JPN'].lat).toBeCloseTo(35.6762, 3);

      expect(NATIONAL_ANTHEMS_MAP['IDN']).toBeDefined();
      expect(NATIONAL_ANTHEMS_MAP['IDN'].title).toBe('Indonesia Raya');
      expect(NATIONAL_ANTHEMS_MAP['FRA'].title).toBe('La Marseillaise');
    });
  });

  describe('3. Global Financial Hubs Dataset Decoupling', () => {
    it('verifies financial_hubs_dataset.json exists and is valid JSON', () => {
      const jsonPath = path.join(globeDataDir, 'financial_hubs_dataset.json');
      expect(fs.existsSync(jsonPath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      expect(Array.isArray(content)).toBe(true);
      expect(content.length).toBeGreaterThanOrEqual(18);
    });

    it('loads typed GLOBAL_FINANCIAL_HUBS correctly from JSON wrapper', async () => {
      const { GLOBAL_FINANCIAL_HUBS } = await import(
        '../src/lib/features/map/globe/data/financialHubsData'
      );
      expect(GLOBAL_FINANCIAL_HUBS).toBeDefined();
      expect(GLOBAL_FINANCIAL_HUBS.length).toBeGreaterThanOrEqual(18);

      const london = GLOBAL_FINANCIAL_HUBS.find((h) => h.city === 'London');
      expect(london).toBeDefined();
      expect(london?.dailyTurnoverBillionUsd).toBe(3755);
      expect(london?.rank).toBe(1);

      const jkt = GLOBAL_FINANCIAL_HUBS.find((h) => h.city === 'Jakarta');
      expect(jkt).toBeDefined();
      expect(jkt?.country).toBe('Indonesia');
    });
  });

  describe('4. Country Flag Colors Dataset Decoupling', () => {
    it('verifies country_flag_colors.json exists and is valid JSON', () => {
      const jsonPath = path.join(mapFeaturesDir, 'country_flag_colors.json');
      expect(fs.existsSync(jsonPath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      expect(Object.keys(content).length).toBeGreaterThanOrEqual(190);
    });

    it('loads typed COUNTRY_FLAG_COLOR_MAP correctly from JSON wrapper', async () => {
      const { COUNTRY_FLAG_COLOR_MAP } = await import(
        '../src/lib/features/map/country-flag-colors'
      );
      expect(COUNTRY_FLAG_COLOR_MAP['IDN']).toBe('#dc2626');
      expect(COUNTRY_FLAG_COLOR_MAP['JPN']).toBe('#dc2626');
      expect(COUNTRY_FLAG_COLOR_MAP['USA']).toBe('#1e3a8a');
    });
  });
});
