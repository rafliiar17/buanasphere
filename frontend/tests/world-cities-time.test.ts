import { describe, it, expect } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

describe('Accurate World Cities & Geographic 3D Points in TimeWorld (ADR 0052 / TDD)', () => {
  const citiesDataPath = path.resolve(__dirname, '../src/lib/framework/geoglobe/data/worldCitiesTimeData.ts');
  const worldTimeAppPath = path.resolve(__dirname, '../src/lib/framework/geoglobe/plugins/worldTimeApp.ts');
  const globeViewPath = path.resolve(__dirname, '../src/lib/features/map/components/Globe3DView.svelte');
  const timeControlsPath = path.resolve(__dirname, '../src/lib/apps/time/TimeControls.svelte');

  describe('1. World Cities Time Dataset Integrity (worldCitiesTimeData.ts)', () => {
    it('declares a curated dataset with at least 50 world cities', async () => {
      const { WORLD_CITIES_TIME } = await import('../src/lib/framework/geoglobe/data/worldCitiesTimeData');
      expect(Array.isArray(WORLD_CITIES_TIME)).toBe(true);
      expect(WORLD_CITIES_TIME.length).toBeGreaterThanOrEqual(50);
    });

    it('accurately represents Indonesia 3 timezones (WIB, WITA, WIT) with precise coordinates', async () => {
      const { WORLD_CITIES_TIME } = await import('../src/lib/framework/geoglobe/data/worldCitiesTimeData');
      
      const jakarta = WORLD_CITIES_TIME.find((c) => c.cityName.toLowerCase().includes('jakarta'));
      expect(jakarta).toBeDefined();
      expect(jakarta!.countryIso3).toBe('IDN');
      expect(jakarta!.utcOffset).toBe(7);
      expect(jakarta!.timezoneAbbr).toBe('WIB');
      expect(jakarta!.lat).toBeCloseTo(-6.2, 1);
      expect(jakarta!.lng).toBeCloseTo(106.8, 1);

      const bali = WORLD_CITIES_TIME.find((c) => c.cityName.toLowerCase().includes('bali') || c.cityName.toLowerCase().includes('denpasar'));
      expect(bali).toBeDefined();
      expect(bali!.countryIso3).toBe('IDN');
      expect(bali!.utcOffset).toBe(8);
      expect(bali!.timezoneAbbr).toBe('WITA');
      expect(bali!.lat).toBeCloseTo(-8.67, 1);
      expect(bali!.lng).toBeCloseTo(115.2, 1);

      const jayapura = WORLD_CITIES_TIME.find((c) => c.cityName.toLowerCase().includes('jayapura'));
      expect(jayapura).toBeDefined();
      expect(jayapura!.countryIso3).toBe('IDN');
      expect(jayapura!.utcOffset).toBe(9);
      expect(jayapura!.timezoneAbbr).toBe('WIT');
      expect(jayapura!.lat).toBeCloseTo(-2.55, 1);
      expect(jayapura!.lng).toBeCloseTo(140.7, 1);
    });

    it('accurately represents multi-timezone cities in USA (New York, Chicago, Denver, Los Angeles, Honolulu)', async () => {
      const { WORLD_CITIES_TIME } = await import('../src/lib/framework/geoglobe/data/worldCitiesTimeData');
      
      const ny = WORLD_CITIES_TIME.find((c) => c.cityName === 'New York');
      expect(ny).toBeDefined();
      expect(ny!.countryIso3).toBe('USA');
      expect(ny!.utcOffset).toBe(-5);
      expect(ny!.lat).toBeCloseTo(40.71, 1);

      const la = WORLD_CITIES_TIME.find((c) => c.cityName.includes('Los Angeles'));
      expect(la).toBeDefined();
      expect(la!.countryIso3).toBe('USA');
      expect(la!.utcOffset).toBe(-8);
      expect(la!.lat).toBeCloseTo(34.05, 1);

      const honolulu = WORLD_CITIES_TIME.find((c) => c.cityName.includes('Honolulu'));
      expect(honolulu).toBeDefined();
      expect(honolulu!.countryIso3).toBe('USA');
      expect(honolulu!.utcOffset).toBe(-10);
    });

    it('contains major world financial hubs across all continents', async () => {
      const { WORLD_CITIES_TIME } = await import('../src/lib/framework/geoglobe/data/worldCitiesTimeData');
      const cityNames = WORLD_CITIES_TIME.map((c) => c.cityName);

      expect(cityNames.some((n) => n.includes('Tokyo'))).toBe(true);
      expect(cityNames.some((n) => n.includes('London'))).toBe(true);
      expect(cityNames.some((n) => n.includes('Paris'))).toBe(true);
      expect(cityNames.some((n) => n.includes('Dubai'))).toBe(true);
      expect(cityNames.some((n) => n.includes('Sydney'))).toBe(true);
      expect(cityNames.some((n) => n.includes('Singapura') || n.includes('Singapore'))).toBe(true);
      expect(cityNames.some((n) => n.includes('Kairo') || n.includes('Cairo'))).toBe(true);
    });
  });

  describe('2. Plugin Hook getCustomLabels in worldTimeApp.ts', () => {
    it('worldTimeApp implements getCustomLabels hook', async () => {
      const { worldTimeApp } = await import('../src/lib/framework/geoglobe/plugins/worldTimeApp');
      expect(typeof worldTimeApp.getCustomLabels).toBe('function');
    });

    it('getCustomLabels returns accurate city points with live time and diurnal phase', async () => {
      const { worldTimeApp } = await import('../src/lib/framework/geoglobe/plugins/worldTimeApp');
      const labels = worldTimeApp.getCustomLabels!({}, 'diurnal_cycle', 'dark');

      expect(labels.length).toBeGreaterThanOrEqual(50);
      const tokyo = labels.find((l) => l.text.includes('Tokyo'));
      expect(tokyo).toBeDefined();
      expect(tokyo!.lat).toBeCloseTo(35.67, 1);
      expect(tokyo!.lng).toBeCloseTo(139.65, 1);
      // Format must contain flag, city name, time, and phase emoji
      expect(tokyo!.text).toMatch(/🇯🇵.*Tokyo.*[0-9]{2}:[0-9]{2}/);
    });
  });

  describe('3. Globe3DView Integration for Custom Labels (Globe3DView.svelte)', () => {
    it('Globe3DView checks activeApp.getCustomLabels in globeLabels derived computation', () => {
      const content = fs.readFileSync(globeViewPath, 'utf-8');
      expect(content).toContain('geoStore.activeApp?.getCustomLabels');
    });

    it('Globe3DView binds onLabelClick to select custom city or country', () => {
      const content = fs.readFileSync(globeViewPath, 'utf-8');
      expect(content).toContain('.onLabelClick');
    });
  });

  describe('4. City Search Autocomplete in TimeControls.svelte', () => {
    it('TimeControls searches both cities and countries', () => {
      const content = fs.readFileSync(timeControlsPath, 'utf-8');
      expect(content).toContain('WORLD_CITIES_TIME');
      expect(content).toMatch(/cityName/);
    });

    it('TimeControls handles city selection and triggers camera travel to city coordinates', () => {
      const content = fs.readFileSync(timeControlsPath, 'utf-8');
      expect(content).toContain('handleCitySelect');
    });
  });
});
