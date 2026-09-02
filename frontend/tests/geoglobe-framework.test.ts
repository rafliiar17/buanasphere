import { describe, it, expect } from 'bun:test';
import {
  calculateDistanceKm,
  calculateLocalTime,
  isDaylight,
  formatUtcOffset,
  generateGreatCircleArc,
} from '../src/lib/framework/geoglobe/geoMath';
import { GeoAppRegistry } from '../src/lib/framework/geoglobe/appRegistry';
import { fxRatesApp } from '../src/lib/framework/geoglobe/plugins/fxRatesApp';
import { worldTimeApp } from '../src/lib/framework/geoglobe/plugins/worldTimeApp';
import { flowCorridorsApp } from '../src/lib/framework/geoglobe/plugins/flowCorridorsApp';
import { passportWorldApp } from '../src/lib/framework/geoglobe/plugins/passportWorldApp';
import { EXTENDED_COUNTRIES_DATA } from '../src/lib/framework/geoglobe/countrySpatialData';

describe('GeoGlobe Pluggable Micro-App Framework Unit Tests (ADR 0023 / TDD)', () => {
  describe('1. Spatial Math & Geolocation Engine (geoMath.ts)', () => {
    it('calculates great-circle distance in kilometers between Jakarta and Tokyo accurately', () => {
      const dist = calculateDistanceKm(-6.2088, 106.8456, 35.6762, 139.6503);
      expect(dist).toBeGreaterThan(5700);
      expect(dist).toBeLessThan(5900);
    });

    it('calculates local time given UTC offset accurately', () => {
      const fixedUtcDate = new Date('2026-09-02T12:00:00.000Z');
      const jakartaTime = calculateLocalTime(fixedUtcDate, 7);
      expect(jakartaTime.hours).toBe(19);
      expect(jakartaTime.minutes).toBe(0);
      expect(jakartaTime.formatted).toBe('19:00');

      const nyTime = calculateLocalTime(fixedUtcDate, -4);
      expect(nyTime.hours).toBe(8);
      expect(nyTime.formatted).toBe('08:00');
    });

    it('determines daylight status correctly based on local hour', () => {
      expect(isDaylight(12)).toBe(true);
      expect(isDaylight(22)).toBe(false);
      expect(isDaylight(3)).toBe(false);
      expect(isDaylight(8)).toBe(true);
    });

    it('formats UTC offset string properly (+07:00, -04:00, UTC)', () => {
      expect(formatUtcOffset(7)).toBe('UTC+07:00');
      expect(formatUtcOffset(-4)).toBe('UTC-04:00');
      expect(formatUtcOffset(0)).toBe('UTC+00:00');
      expect(formatUtcOffset(5.5)).toBe('UTC+05:30');
    });

    it('generates great-circle arc trajectory with altitude and color styling', () => {
      const arc = generateGreatCircleArc(
        { lat: 24.7136, lng: 46.6753, label: 'Riyadh' },
        { lat: -6.2088, lng: 106.8456, label: 'Jakarta' },
        { color: '#10b981', altitude: 0.35, stroke: 1.5 }
      );

      expect(arc.startLat).toBe(24.7136);
      expect(arc.startLng).toBe(46.6753);
      expect(arc.endLat).toBe(-6.2088);
      expect(arc.endLng).toBe(106.8456);
      expect(arc.color).toBe('#10b981');
      expect(arc.altitude).toBe(0.35);
    });
  });

  describe('2. Spatial Country Dataset (195+ Sovereign States & Territories)', () => {
    it('contains comprehensive spatial records with valid coordinates, capital, and timezone', () => {
      expect(EXTENDED_COUNTRIES_DATA.length).toBeGreaterThanOrEqual(100);

      const idn = EXTENDED_COUNTRIES_DATA.find((c) => c.iso3 === 'IDN');
      expect(idn).toBeDefined();
      expect(idn?.capital).toBe('Jakarta');
      expect(idn?.lat).toBeCloseTo(-0.79, 1);
      expect(idn?.lng).toBeCloseTo(113.92, 1);
      expect(idn?.utcOffset).toBe(7);

      const usa = EXTENDED_COUNTRIES_DATA.find((c) => c.iso3 === 'USA');
      expect(usa).toBeDefined();
      expect(usa?.capital).toBe('Washington, D.C.');
      expect(usa?.lat).toBeGreaterThan(30);

      const jpn = EXTENDED_COUNTRIES_DATA.find((c) => c.iso3 === 'JPN');
      expect(jpn).toBeDefined();
      expect(jpn?.capital).toBe('Tokyo');
      expect(jpn?.utcOffset).toBe(9);
    });
  });

  describe('3. Dynamic App Registry & Plugin Lifecycle (appRegistry.ts)', () => {
    it('registers and retrieves built-in micro-apps smoothly', () => {
      const registry = new GeoAppRegistry();
      registry.register(fxRatesApp);
      registry.register(worldTimeApp);
      registry.register(flowCorridorsApp);
      registry.register(passportWorldApp);

      const allApps = registry.getAllApps();
      expect(allApps.length).toBe(4);

      expect(registry.getApp('fx-rates')).toBeDefined();
      expect(registry.getApp('world-time')).toBeDefined();
      expect(registry.getApp('remittance-flow')).toBeDefined();
      expect(registry.getApp('passport-power')).toBeDefined();
    });

    it('manages active app switching reactively', () => {
      const registry = new GeoAppRegistry();
      registry.register(fxRatesApp);
      registry.register(worldTimeApp);

      registry.setActiveApp('world-time');
      expect(registry.getActiveApp()?.id).toBe('world-time');

      registry.setActiveApp('fx-rates');
      expect(registry.getActiveApp()?.id).toBe('fx-rates');
    });

    it('loads application data via dataLoader hook for all registered countries', async () => {
      const timeData = await worldTimeApp.dataLoader(EXTENDED_COUNTRIES_DATA as any);
      expect(Object.keys(timeData).length).toBeGreaterThanOrEqual(100);
      expect(timeData['IDN']).toBeDefined();
      expect(timeData['IDN'].formattedTime).toMatch(/^\d{2}:\d{2}$/);
      expect(timeData['IDN'].utcOffset).toBe(7);

      const passportData = await passportWorldApp.dataLoader(EXTENDED_COUNTRIES_DATA as any);
      expect(passportData['SGP']).toBeDefined();
      expect(passportData['SGP'].visaFreeCount).toBeGreaterThan(180);
    });

    it('generates dynamic 3D arcs for remittance flow corridors to Indonesia', async () => {
      const corridorsData = await flowCorridorsApp.dataLoader(EXTENDED_COUNTRIES_DATA as any);
      const indonesia = EXTENDED_COUNTRIES_DATA.find((c) => c.iso3 === 'IDN')!;

      const arcs = flowCorridorsApp.getArcData ? flowCorridorsApp.getArcData(indonesia as any, corridorsData) : [];
      expect(arcs.length).toBeGreaterThan(0);
      expect(arcs[0].endLat).toBe(indonesia.lat);
      expect(arcs[0].endLng).toBe(indonesia.lng);
    });
  });
});
