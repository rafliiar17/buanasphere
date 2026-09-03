import { describe, it, expect } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { 
  WORLD_CITIES_TIME, 
  findCitiesByCountry, 
  searchWorldCities,
  findCitiesByTimezoneAbbr,
  type WorldCityTimeInfo 
} from '../src/lib/framework/geoglobe/data/worldCitiesTimeData';
import { 
  calculateLocalTime, 
  calculateSimulatedDateFromMinutes,
  getDiurnalPhase 
} from '../src/lib/framework/geoglobe/geoMath';

const timeControlsPath = path.resolve(__dirname, '../src/lib/apps/time/TimeControls.svelte');
const worldTimeAppPath = path.resolve(__dirname, '../src/lib/framework/geoglobe/plugins/worldTimeApp.ts');

describe('Interactive 24-Hour Time Scrubber & Indonesia Multi-Timezones (ADR 0054 / TDD)', () => {

  describe('1. Dataset Expansion (120+ World Cities & Complete Indonesia Coverage)', () => {
    it('declares at least 110 world cities in WORLD_CITIES_TIME', () => {
      expect(WORLD_CITIES_TIME.length).toBeGreaterThanOrEqual(110);
    });

    it('contains comprehensive coverage of all 3 Indonesian timezones (WIB, WITA, WIT)', () => {
      const idnCities = findCitiesByCountry('IDN');
      expect(idnCities.length).toBeGreaterThanOrEqual(18);

      // WIB (UTC+7): Java, Sumatra, West Kalimantan
      const wibCities = idnCities.filter((c) => c.timezoneAbbr === 'WIB');
      expect(wibCities.length).toBeGreaterThanOrEqual(7);
      const wibNames = wibCities.map((c) => c.cityName);
      expect(wibNames).toContain('Jakarta');
      expect(wibNames).toContain('Bandung');
      expect(wibNames).toContain('Surabaya');
      expect(wibNames).toContain('Medan');

      // WITA (UTC+8): Bali, Nusa Tenggara, Kalimantan Selatan/Timur, Sulawesi
      const witaCities = idnCities.filter((c) => c.timezoneAbbr === 'WITA');
      expect(witaCities.length).toBeGreaterThanOrEqual(6);
      const witaNames = witaCities.map((c) => c.cityName);
      expect(witaNames.some((n) => n.includes('Bali') || n.includes('Denpasar'))).toBe(true);
      expect(witaNames).toContain('Makassar');
      expect(witaNames.some((n) => n.includes('Balikpapan') || n.includes('IKN') || n.includes('Nusantara'))).toBe(true);
      expect(witaNames).toContain('Manado');

      // WIT (UTC+9): Maluku & Papua
      const witCities = idnCities.filter((c) => c.timezoneAbbr === 'WIT');
      expect(witCities.length).toBeGreaterThanOrEqual(4);
      const witNames = witCities.map((c) => c.cityName);
      expect(witNames).toContain('Jayapura');
      expect(witNames).toContain('Ambon');
      expect(witNames).toContain('Sorong');
    });

    it('contains helper findCitiesByTimezoneAbbr for quick zone filtering', () => {
      expect(typeof findCitiesByTimezoneAbbr).toBe('function');
      const wibCities = findCitiesByTimezoneAbbr('WIB');
      expect(wibCities.length).toBeGreaterThanOrEqual(7);
      expect(wibCities.every((c) => c.utcOffset === 7)).toBe(true);
    });

    it('covers major international metropolises across all 6 inhabited continents', () => {
      const cityNames = WORLD_CITIES_TIME.map((c) => c.cityName);
      // Asia
      expect(cityNames).toContain('Tokyo');
      expect(cityNames).toContain('Seoul');
      expect(cityNames).toContain('Beijing');
      expect(cityNames).toContain('Singapura');
      // Middle East
      expect(cityNames).toContain('Dubai');
      expect(cityNames).toContain('Riyadh');
      // Europe
      expect(cityNames).toContain('London');
      expect(cityNames).toContain('Paris');
      expect(cityNames).toContain('Berlin');
      // Americas
      expect(cityNames).toContain('New York');
      expect(cityNames).toContain('San Francisco');
      expect(cityNames).toContain('Sao Paulo');
      // Oceania
      expect(cityNames).toContain('Sydney');
      // Africa
      expect(cityNames).toContain('Kairo');
    });
  });

  describe('2. Indonesian 3-Timezone Synchronization (WIB, WITA, WIT)', () => {
    it('accurately calculates local times across WIB, WITA, WIT simultaneously', () => {
      // Mock reference time: 07:00 UTC (which is 14:00 WIB, 15:00 WITA, 16:00 WIT)
      const mockUtc = new Date('2026-09-03T07:00:00Z');

      const wib = calculateLocalTime(mockUtc, 7);
      const wita = calculateLocalTime(mockUtc, 8);
      const wit = calculateLocalTime(mockUtc, 9);

      expect(wib.hours).toBe(14);
      expect(wib.minutes).toBe(0);
      expect(wib.formatted).toBe('14:00');

      expect(wita.hours).toBe(15);
      expect(wita.minutes).toBe(0);
      expect(wita.formatted).toBe('15:00');

      expect(wit.hours).toBe(16);
      expect(wit.minutes).toBe(0);
      expect(wit.formatted).toBe('16:00');
    });
  });

  describe('3. Time-Travel Scrubber Math (calculateSimulatedDateFromMinutes)', () => {
    it('calculates simulated Date anchored to WIB (UTC+7)', () => {
      // 14:30 WIB = 14 * 60 + 30 = 870 minutes
      const simDate = calculateSimulatedDateFromMinutes(870, 'WIB');

      // Local time in WIB (offset 7) should be 14:30
      const wibLocal = calculateLocalTime(simDate, 7);
      expect(wibLocal.hours).toBe(14);
      expect(wibLocal.minutes).toBe(30);

      // Local time in WITA (offset 8) should be 15:30
      const witaLocal = calculateLocalTime(simDate, 8);
      expect(witaLocal.hours).toBe(15);
      expect(witaLocal.minutes).toBe(30);

      // Local time in London (offset 0) should be 07:30
      const lonLocal = calculateLocalTime(simDate, 0);
      expect(lonLocal.hours).toBe(7);
      expect(lonLocal.minutes).toBe(30);

      // Local time in Tokyo (offset 9) should be 16:30
      const tyoLocal = calculateLocalTime(simDate, 9);
      expect(tyoLocal.hours).toBe(16);
      expect(tyoLocal.minutes).toBe(30);
    });

    it('calculates simulated Date anchored to WITA (UTC+8) and WIT (UTC+9)', () => {
      // 10:00 WITA = 600 minutes
      const witaSim = calculateSimulatedDateFromMinutes(600, 'WITA');
      expect(calculateLocalTime(witaSim, 8).formatted).toBe('10:00');
      expect(calculateLocalTime(witaSim, 7).formatted).toBe('09:00'); // WIB is 1 hour behind

      // 18:00 WIT = 1080 minutes
      const witSim = calculateSimulatedDateFromMinutes(1080, 'WIT');
      expect(calculateLocalTime(witSim, 9).formatted).toBe('18:00');
      expect(calculateLocalTime(witSim, 7).formatted).toBe('16:00'); // WIB is 2 hours behind
    });
  });

  describe('4. TimeControls.svelte UI Components (Ribbon & Scrubber)', () => {
    it('contains Indonesian 3-Timezone Ribbon in TimeControls.svelte', () => {
      const content = fs.readFileSync(timeControlsPath, 'utf-8');
      expect(content).toContain('WIB');
      expect(content).toContain('WITA');
      expect(content).toContain('WIT');
    });

    it('contains 24-Hour Time Scrubber slider in TimeControls.svelte', () => {
      const content = fs.readFileSync(timeControlsPath, 'utf-8');
      expect(content).toMatch(/type="range"/);
      expect(content).toMatch(/min="0"/);
      expect(content).toMatch(/max="1439"/);
    });

    it('contains Live reset button when time travel is active in TimeControls.svelte', () => {
      const content = fs.readFileSync(timeControlsPath, 'utf-8');
      expect(content).toMatch(/LIVE/i);
    });
  });
});
