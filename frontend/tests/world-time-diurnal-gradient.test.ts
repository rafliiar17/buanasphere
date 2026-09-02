import { describe, it, expect } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { getDiurnalPhase, interpolateDiurnalColor } from '../src/lib/framework/geoglobe/geoMath';
import { isCountryMatchingTimeFilter } from '../src/lib/framework/geoglobe/filterEngine';

const GEOSTORE_PATH = path.resolve(__dirname, '../src/lib/framework/geoglobe/geoStore.svelte.ts');
const MAPSTATE_SVELTE_PATH = path.resolve(__dirname, '../src/lib/features/map/mapState.svelte.ts');
const WORLD_TIME_PLUGIN_PATH = path.resolve(__dirname, '../src/lib/framework/geoglobe/plugins/worldTimeApp.ts');

describe('World Time 8-Phase Diurnal Gradient & Indonesia Default Suite (ADR 0037 / TDD)', () => {

  describe('1. 8-Phase Diurnal Solar Model (getDiurnalPhase)', () => {
    it('classifies 02:00 as "deep_night" (Dini Hari)', () => {
      const phase = getDiurnalPhase(2, 0);
      expect(phase.phaseId).toBe('deep_night');
      expect(phase.label).toBe('Dini Hari');
      expect(phase.emoji).toBe('🌌');
      expect(phase.isDaylight).toBe(false);
    });

    it('classifies 05:30 as "dawn" (Fajar / Subuh)', () => {
      const phase = getDiurnalPhase(5, 30);
      expect(phase.phaseId).toBe('dawn');
      expect(phase.label).toBe('Fajar / Subuh');
      expect(phase.emoji).toBe('🌅');
      expect(phase.isGoldenHour).toBe(true);
    });

    it('classifies 08:30 as "morning" (Pagi Cerah)', () => {
      const phase = getDiurnalPhase(8, 30);
      expect(phase.phaseId).toBe('morning');
      expect(phase.label).toBe('Pagi');
      expect(phase.emoji).toBe('☀️');
      expect(phase.isDaylight).toBe(true);
    });

    it('classifies 12:30 as "noon" (Siang Terik)', () => {
      const phase = getDiurnalPhase(12, 30);
      expect(phase.phaseId).toBe('noon');
      expect(phase.label).toBe('Siang Terik');
      expect(phase.emoji).toBe('🌞');
      expect(phase.isDaylight).toBe(true);
    });

    it('classifies 16:00 as "afternoon" (Sore)', () => {
      const phase = getDiurnalPhase(16, 0);
      expect(phase.phaseId).toBe('afternoon');
      expect(phase.label).toBe('Sore');
      expect(phase.emoji).toBe('🌤️');
      expect(phase.isDaylight).toBe(true);
    });

    it('classifies 18:00 as "sunset" (Senja / Sunset)', () => {
      const phase = getDiurnalPhase(18, 0);
      expect(phase.phaseId).toBe('sunset');
      expect(phase.label).toBe('Senja / Sunset');
      expect(phase.emoji).toBe('🌇');
      expect(phase.isGoldenHour).toBe(true);
    });

    it('classifies 20:00 as "dusk" (Petang / Twilight)', () => {
      const phase = getDiurnalPhase(20, 0);
      expect(phase.phaseId).toBe('dusk');
      expect(phase.label).toBe('Petang / Twilight');
      expect(phase.emoji).toBe('🌆');
      expect(phase.isDaylight).toBe(false);
    });

    it('classifies 22:30 as "night" (Malam)', () => {
      const phase = getDiurnalPhase(22, 30);
      expect(phase.phaseId).toBe('night');
      expect(phase.label).toBe('Malam');
      expect(phase.emoji).toBe('🌙');
      expect(phase.isDaylight).toBe(false);
    });
  });

  describe('2. Smooth Diurnal Color Interpolation (interpolateDiurnalColor)', () => {
    it('returns a valid RGBA color string for all 24 fractional hours', () => {
      for (let h = 0; h < 24; h += 0.5) {
        const color = interpolateDiurnalColor(h, 'dark');
        expect(color).toMatch(/^rgba?\(\d+,\s*\d+,\s*\d+(?:,\s*[\d\.]+)?\)$/);
      }
    });

    it('generates distinct colors between dawn (05:30), noon (12:00), and midnight (01:00)', () => {
      const dawnColor = interpolateDiurnalColor(5.5, 'dark');
      const noonColor = interpolateDiurnalColor(12.0, 'dark');
      const midnightColor = interpolateDiurnalColor(1.0, 'dark');

      expect(dawnColor).not.toBe(noonColor);
      expect(noonColor).not.toBe(midnightColor);
      expect(dawnColor).not.toBe(midnightColor);
    });
  });

  describe('3. Default Country Calibration (Indonesia / IDN UTC+7)', () => {
    it('defaults selectedIso3 to "IDN" in geoStore.svelte.ts', () => {
      const geoStoreSrc = fs.readFileSync(GEOSTORE_PATH, 'utf-8');
      expect(geoStoreSrc).toContain("selectedIso3 = $state('IDN')");
      expect(geoStoreSrc).not.toContain("selectedIso3 = $state('USA');");
    });

    it('defaults selectedCountryIso3 to "IDN" in mapState.svelte.ts', () => {
      const mapStateSrc = fs.readFileSync(MAPSTATE_SVELTE_PATH, 'utf-8');
      expect(mapStateSrc).toContain("selectedCountryIso3: string = $state('IDN')");
      expect(mapStateSrc).not.toContain("selectedCountryIso3: string = $state('USA');");
    });
  });

  describe('4. Extended Diurnal Time Filters in filterEngine', () => {
    it('filters countries in "golden_hour" (fajar / senja)', () => {
      // Mock local hour 18:00 (Sunset) -> should match golden_hour
      expect(isCountryMatchingTimeFilter('IDN', 'golden_hour', 18)).toBe(true);
      // Mock local hour 05:30 (Dawn) -> should match golden_hour
      expect(isCountryMatchingTimeFilter('IDN', 'golden_hour', 5.5)).toBe(true);
      // Mock local hour 12:00 (Noon) -> should not match golden_hour
      expect(isCountryMatchingTimeFilter('IDN', 'golden_hour', 12)).toBe(false);
    });

    it('filters countries in "daylight" (06:00–18:00)', () => {
      expect(isCountryMatchingTimeFilter('IDN', 'daylight', 10)).toBe(true);
      expect(isCountryMatchingTimeFilter('IDN', 'daylight', 22)).toBe(false);
    });

    it('filters countries in "night" (18:00–06:00)', () => {
      expect(isCountryMatchingTimeFilter('IDN', 'night', 22)).toBe(true);
      expect(isCountryMatchingTimeFilter('IDN', 'night', 2)).toBe(true);
      expect(isCountryMatchingTimeFilter('IDN', 'night', 14)).toBe(false);
    });

    it('filters countries in "working" (09:00–17:00)', () => {
      expect(isCountryMatchingTimeFilter('IDN', 'working', 11)).toBe(true);
      expect(isCountryMatchingTimeFilter('IDN', 'working', 20)).toBe(false);
    });
  });

  describe('5. WorldTimeApp Plugin Polish', () => {
    it('uses interpolateDiurnalColor in getPolygonColor', () => {
      const pluginSrc = fs.readFileSync(WORLD_TIME_PLUGIN_PATH, 'utf-8');
      expect(pluginSrc).toContain('interpolateDiurnalColor');
    });

    it('includes diurnal phase information in getTooltipHtml', () => {
      const pluginSrc = fs.readFileSync(WORLD_TIME_PLUGIN_PATH, 'utf-8');
      expect(pluginSrc).toContain('getDiurnalPhase');
    });
  });
});
