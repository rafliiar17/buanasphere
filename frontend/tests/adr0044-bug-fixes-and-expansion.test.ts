import { describe, it, expect } from 'bun:test';
import { geoRegistry } from '../src/lib/framework/geoglobe/appRegistry';
import { fxRatesApp } from '../src/lib/framework/geoglobe/plugins/fxRatesApp';
import { worldTimeApp } from '../src/lib/framework/geoglobe/plugins/worldTimeApp';
import { flowCorridorsApp } from '../src/lib/framework/geoglobe/plugins/flowCorridorsApp';
import { passportWorldApp } from '../src/lib/framework/geoglobe/plugins/passportWorldApp';
import { floraFaunaApp } from '../src/lib/framework/geoglobe/plugins/floraFaunaApp';
import { worldCapitalsApp } from '../src/lib/framework/geoglobe/plugins/worldCapitalsApp';
import { EXTENDED_COUNTRIES_DATA } from '../src/lib/framework/geoglobe/countrySpatialData';
import { isCountryMatchingAppFilter } from '../src/lib/framework/geoglobe/filterEngine';
import { resolvePathToAppId, resolveAppIdToPath } from '../src/lib/framework/geoglobe/router';

describe('ADR 0044: Bug Remediation & Multi-Feature Expansion Test Suite', () => {
  const idnCountry = EXTENDED_COUNTRIES_DATA.find((c) => c.iso3 === 'IDN')!;

  describe('1. Bug Fix: Plug-and-Play BottomDockComponent on Plugins', () => {
    it('worldTimeApp declares BottomDockComponent', () => {
      expect((worldTimeApp as any).BottomDockComponent).toBeDefined();
    });

    it('flowCorridorsApp declares BottomDockComponent', () => {
      expect((flowCorridorsApp as any).BottomDockComponent).toBeDefined();
    });

    it('passportWorldApp declares BottomDockComponent', () => {
      expect((passportWorldApp as any).BottomDockComponent).toBeDefined();
    });

    it('fxRatesApp declares BottomDockComponent', () => {
      expect((fxRatesApp as any).BottomDockComponent).toBeDefined();
    });
  });

  describe('2. Candidate 6: Filter Delegation via filterPredicate', () => {
    it('passportWorldApp defines filterPredicate and correctly filters visa statuses', () => {
      expect(typeof passportWorldApp.filterPredicate).toBe('function');
      if (passportWorldApp.filterPredicate) {
        // Test visa-free for SGP
        const isSgpFree = passportWorldApp.filterPredicate('SGP', 'free', undefined, EXTENDED_COUNTRIES_DATA.find(c => c.iso3 === 'SGP'));
        expect(isSgpFree).toBe(true);

        // Test visa required for USA
        const isUsaFree = passportWorldApp.filterPredicate('USA', 'free', undefined, EXTENDED_COUNTRIES_DATA.find(c => c.iso3 === 'USA'));
        expect(isUsaFree).toBe(false);
      }
    });

    it('filterEngine delegates to activeApp.filterPredicate when available', () => {
      // With passport-power active
      const matched = isCountryMatchingAppFilter('SGP', 'passport-power', {
        passportFilter: 'free',
        region: 'all',
      });
      expect(matched).toBe(true);
    });
  });

  describe('3. Candidate 1: Earthquake & Natural Disaster Tracker Micro-App (/quake)', () => {
    it('resolves /quake, /earthquake, and /gempa to earthquake-tracker app', () => {
      const appId = resolvePathToAppId('/quake');
      expect(appId).toBe('earthquake-tracker');
      expect(resolvePathToAppId('/earthquake')).toBe('earthquake-tracker');
      expect(resolvePathToAppId('/gempa')).toBe('earthquake-tracker');
      expect(resolveAppIdToPath('earthquake-tracker')).toBe('/quake');
    });

    it('earthquakeApp is registered and implements getRingData for pulsing epicenter rings', async () => {
      const quakeApp = geoRegistry.getApp('earthquake-tracker');
      expect(quakeApp).toBeDefined();
      expect(quakeApp?.name).toContain('Earthquake');
      expect(typeof quakeApp?.getRingData).toBe('function');

      const data = await quakeApp!.dataLoader(EXTENDED_COUNTRIES_DATA as any);
      expect(data).toBeDefined();
      expect(Object.keys(data).length).toBeGreaterThan(0);

      const rings = quakeApp!.getRingData!(idnCountry, data);
      expect(Array.isArray(rings)).toBe(true);
      expect(rings.length).toBeGreaterThan(0);
      expect(rings[0].lat).toBeDefined();
      expect(rings[0].lng).toBeDefined();
      expect(rings[0].maxRadius).toBeGreaterThan(0);
    });

    it('earthquakeApp provides polymorphic visual hooks (colors, tooltips, pins, inspector)', async () => {
      const quakeApp = geoRegistry.getApp('earthquake-tracker')!;
      expect(typeof quakeApp.getPolygonColor).toBe('function');
      expect(typeof quakeApp.getTooltipHtml).toBe('function');
      expect(typeof quakeApp.getPinLabel).toBe('function');
      expect(typeof quakeApp.renderInspector).toBe('function');

      const data = await quakeApp.dataLoader(EXTENDED_COUNTRIES_DATA as any);
      const color = quakeApp.getPolygonColor!(idnCountry, data['IDN'], 'seismic_risk', 'dark');
      expect(color).toBeTruthy();

      const tooltip = quakeApp.getTooltipHtml!(idnCountry, data['IDN'], 'seismic_risk', 'dark');
      expect(tooltip).toContain('Indonesia');

      const pin = quakeApp.getPinLabel!(idnCountry, data['IDN'], 'seismic_risk');
      expect(pin.text).toBeTruthy();

      const widget = quakeApp.renderInspector!(idnCountry, data['IDN'], data);
      expect(widget.title).toBeTruthy();
    });
  });
});
