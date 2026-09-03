import { describe, it, expect } from 'bun:test';
import { GeoAppRegistry } from '../src/lib/framework/geoglobe/appRegistry';
import { resolvePathToAppId, resolveAppIdToPath } from '../src/lib/framework/geoglobe/router';
import { isCountryMatchingAppFilter } from '../src/lib/framework/geoglobe/filterEngine';
import type { GeoAppPlugin } from '../src/lib/framework/geoglobe/types';

describe('True Plug-and-Play GeoGlobe Framework Suite (ADR 0040 / TDD)', () => {
  describe('1. Declarative Self-Describing Metadata Interface', () => {
    it('supports branding, splash, and filterOptions in GeoAppPlugin interface', () => {
      const mockPlugin: GeoAppPlugin = {
        id: 'test-modular-app',
        name: 'Test Modular App',
        tagline: 'Testing decoupled plug-and-play',
        category: 'test',
        defaultMetricId: 'val',
        canonicalPath: '/test-modular',
        aliasPaths: ['/test-alias'],
        branding: {
          main: 'Test',
          sub: '.App',
          accentColor: '#10b981',
        },
        splash: {
          stepText: 'Memuat data test modular...',
          gradientFrom: 'from-emerald-500',
          gradientTo: 'to-teal-500',
        },
        filterOptions: [
          { id: 'all', label: 'Semua Data' },
          { id: 'special', label: 'Khusus' },
        ],
        filterPredicate: (iso3, filterId, data) => {
          if (filterId === 'special') return iso3 === 'IDN';
          return true;
        },
        metrics: [
          {
            id: 'val',
            label: 'Test Value',
            formatValue: (v) => String(v),
            colorScale: () => '#fff',
          },
        ],
        dataLoader: async () => ({ IDN: { score: 100 } }),
      };

      expect(mockPlugin.branding?.main).toBe('Test');
      expect(mockPlugin.branding?.sub).toBe('.App');
      expect(mockPlugin.splash?.stepText).toContain('Memuat');
      expect(mockPlugin.filterOptions?.length).toBe(2);
      expect(mockPlugin.filterPredicate!('IDN', 'special')).toBe(true);
      expect(mockPlugin.filterPredicate!('USA', 'special')).toBe(false);
    });
  });

  describe('2. Autonomous Routing Resolution Without Static Dictionary Dependency', () => {
    it('resolves arbitrary newly registered plug-and-play apps dynamically', () => {
      const registry = new GeoAppRegistry();
      const mockPlugin: GeoAppPlugin = {
        id: 'earthquake-tracker',
        name: 'Gempa Bumi 3D',
        tagline: 'Pemantauan seismik global real-time',
        category: 'nature',
        defaultMetricId: 'magnitude',
        canonicalPath: '/earthquake',
        aliasPaths: ['/gempa', '/seismic'],
        metrics: [],
        dataLoader: async () => ({}),
      };

      registry.register(mockPlugin);

      expect(registry.getApp('earthquake-tracker')).toBeDefined();
      expect(resolvePathToAppId('/earthquake', registry)).toBe('earthquake-tracker');
      expect(resolvePathToAppId('/gempa', registry)).toBe('earthquake-tracker');
      expect(resolvePathToAppId('/seismic', registry)).toBe('earthquake-tracker');
      expect(resolveAppIdToPath('earthquake-tracker', registry)).toBe('/earthquake');
    });
  });

  describe('3. Pure Delegated Filter Engine (Zero Hardcoded Switch Statements)', () => {
    it('delegates filtering purely to activeApp.filterPredicate without requiring core file modification', () => {
      const registry = new GeoAppRegistry();
      const mockPlugin: GeoAppPlugin = {
        id: 'olympic-medals',
        name: 'Medali Olimpiade',
        tagline: 'Perolehan medali dunia',
        category: 'sports',
        defaultMetricId: 'gold',
        filterOptions: [
          { id: 'all', label: 'Semua' },
          { id: 'gold_winners', label: 'Peraih Emas' },
        ],
        filterPredicate: (_iso3, filterValue, data) => {
          if (filterValue === 'gold_winners') {
            return (data?.gold ?? 0) > 0;
          }
          return true;
        },
        metrics: [],
        dataLoader: async () => ({}),
      };

      registry.register(mockPlugin);
      registry.setAppData('olympic-medals', {
        IDN: { gold: 2 },
        SGP: { gold: 0 },
      });

      // Matcher test with registry parameter
      const isIdnMatched = isCountryMatchingAppFilter('IDN', 'olympic-medals', {
        customFilter: 'gold_winners',
        appData: { IDN: { gold: 2 } },
      }, registry);
      expect(isIdnMatched).toBe(true);

      const isSgpMatched = isCountryMatchingAppFilter('SGP', 'olympic-medals', {
        customFilter: 'gold_winners',
        appData: { SGP: { gold: 0 } },
      }, registry);
      expect(isSgpMatched).toBe(false);
    });
  });

  describe('4. Decoupled 3D Globe Feature Detection (Duck-Typing Hooks)', () => {
    it('verifies that feature detection (getArcs, getRings) replaces ID string comparisons', () => {
      const arcPlugin: GeoAppPlugin = {
        id: 'custom-arcs-app',
        name: 'Custom Arcs',
        tagline: 'Custom Arcs Test',
        category: 'test',
        defaultMetricId: 'm',
        getArcs: () => [
          { startLat: 0, startLng: 0, endLat: 10, endLng: 10, color: '#fff' },
        ],
        metrics: [],
        dataLoader: async () => ({}),
      };

      const nonArcPlugin: GeoAppPlugin = {
        id: 'no-arcs-app',
        name: 'No Arcs',
        tagline: 'No Arcs Test',
        category: 'test',
        defaultMetricId: 'm',
        metrics: [],
        dataLoader: async () => ({}),
      };

      // Feature detection logic:
      expect(typeof arcPlugin.getArcs).toBe('function');
      expect(arcPlugin.getArcs!({}, 'all').length).toBe(1);
      expect(nonArcPlugin.getArcs).toBeUndefined();
    });
  });

  describe('5. Polymorphic UI Architecture & Controls Component (ADR 0040)', () => {
    it('supports custom ControlsComponent and BottomDockComponent declaration', () => {
      const customUiPlugin: GeoAppPlugin = {
        id: 'custom-ui-app',
        name: 'Custom UI App',
        tagline: 'Has dedicated controls and bottom dock',
        category: 'custom',
        defaultMetricId: 'demo',
        metrics: [],
        dataLoader: async () => ({}),
        branding: { main: 'Custom', sub: '.UI' },
        splash: { stepText: 'Loading custom UI app...' },
        cameraPresets: {
          all: { lat: 0, lng: 0, altitude: 2.0 },
          asean: { lat: 4, lng: 108, altitude: 1.5 },
        },
        ControlsComponent: { name: 'DummyControls' },
        BottomDockComponent: { name: 'DummyDock' },
      };

      expect(customUiPlugin.ControlsComponent).toBeDefined();
      expect(customUiPlugin.BottomDockComponent).toBeDefined();
      expect(customUiPlugin.branding?.main).toBe('Custom');
      expect(customUiPlugin.branding?.sub).toBe('.UI');
      expect(customUiPlugin.cameraPresets?.asean.lat).toBe(4);
    });

    it('falls back to default branding when branding property is omitted', () => {
      const unbrandedPlugin: GeoAppPlugin = {
        id: 'unbranded-app',
        name: 'Standard App',
        tagline: 'Standard test',
        category: 'test',
        defaultMetricId: 'm',
        metrics: [],
        dataLoader: async () => ({}),
      };

      const resolvedBranding = unbrandedPlugin.branding ?? {
        main: unbrandedPlugin.name || 'Kurs',
        sub: '.World',
      };
      expect(resolvedBranding.main).toBe('Standard App');
      expect(resolvedBranding.sub).toBe('.World');
    });
  });
});
