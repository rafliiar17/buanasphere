import { describe, it, expect } from 'bun:test';
import { TIMEZONE_BOUNDARIES } from '../src/lib/framework/geoglobe/data/timezoneBoundariesData';
import { worldTimeApp } from '../src/lib/framework/geoglobe/plugins/worldTimeApp';
import type { GeoPath } from '../src/lib/framework/geoglobe/types';

describe('Geopolitical Timezone Boundaries & Curved Vector Paths Suite (ADR 0057 / TDD)', () => {
  describe('1. Dataset Integrity & Geometry Standards (TIMEZONE_BOUNDARIES)', () => {
    it('contains at least 300 boundary segments in TIMEZONE_BOUNDARIES dataset', () => {
      expect(Array.isArray(TIMEZONE_BOUNDARIES)).toBe(true);
      expect(TIMEZONE_BOUNDARIES.length).toBeGreaterThanOrEqual(300);
    });

    it('covers full spectrum of standard global UTC offsets (-12 to +14)', () => {
      const offsets = new Set<number>(TIMEZONE_BOUNDARIES.map(seg => seg.utcOffset));
      for (let offset = -12; offset <= 12; offset++) {
        expect(offsets.has(offset)).toBe(true);
      }
      expect(offsets.has(13) || offsets.has(14)).toBe(true);
    });

    it('ensures boundary paths are strictly NON-LINEAR with varying longitudes', () => {
      const multiPointSegments = TIMEZONE_BOUNDARIES.filter(seg => seg.coords && seg.coords.length >= 3);
      expect(multiPointSegments.length).toBeGreaterThanOrEqual(1);

      const curvedSegments = multiPointSegments.filter(seg => {
        const lngs = seg.coords.map(coord => coord[1]);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        return Math.abs(maxLng - minLng) > 0.1;
      });
      expect(curvedSegments.length).toBeGreaterThanOrEqual(100);
    });
  });

  describe('2. Indonesian Geopolitical Boundaries (WIB, WITA, WIT)', () => {
    it('contains UTC+7 (WIB) and UTC+8 (WITA) boundaries curving through the Indonesian archipelago', () => {
      const indoSegments = TIMEZONE_BOUNDARIES.filter(seg => {
        const matchesZone = seg.utcOffset === 7 || 
                            seg.utcOffset === 8 || 
                            seg.isIndonesianBoundary === true ||
                            seg.name?.toLowerCase().includes('wib') ||
                            seg.name?.toLowerCase().includes('wita') ||
                            seg.id?.toLowerCase().includes('idn') ||
                            seg.id?.toLowerCase().includes('wib');

        const inIndoArchipelago = seg.coords && seg.coords.some(([lat, lng]) => 
          lat >= -11 && lat <= 7 && lng >= 110 && lng <= 125
        );
        return matchesZone && inIndoArchipelago;
      });
      expect(indoSegments.length).toBeGreaterThanOrEqual(1);

      const hasCurvedIndoPath = indoSegments.some(seg => {
        const lngs = seg.coords.map(c => c[1]);
        return Math.max(...lngs) - Math.min(...lngs) > 0.2;
      });
      expect(hasCurvedIndoPath).toBe(true);
    });

    it('confirms presence of boundary segments traversing Kalimantan (Borneo division)', () => {
      const kalimantanSegments = TIMEZONE_BOUNDARIES.filter(seg => 
        seg.coords && seg.coords.some(([lat, lng]) => 
          lat >= -4.0 && lat <= 4.5 && lng >= 113.0 && lng <= 118.0
        )
      );
      expect(kalimantanSegments.length).toBeGreaterThanOrEqual(1);
    });

    it('confirms presence of boundary segments near Bali / Lombok Strait (Java-Bali-Lombok boundary)', () => {
      const baliLombokSegments = TIMEZONE_BOUNDARIES.filter(seg => 
        seg.coords && seg.coords.some(([lat, lng]) => 
          lat >= -9.5 && lat <= -7.5 && lng >= 114.5 && lng <= 116.5
        )
      );
      expect(baliLombokSegments.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. International Date Line (IDL) Geometrical Zig-Zags', () => {
    it('contains characteristic zig-zags in the Bering Strait near 169°W (60°N - 70°N)', () => {
      const beringSegments = TIMEZONE_BOUNDARIES.filter(seg => 
        seg.coords && seg.coords.some(([lat, lng]) => 
          lat >= 60.0 && lat <= 72.0 && lng <= -167.0 && lng >= -173.0
        )
      );
      expect(beringSegments.length).toBeGreaterThanOrEqual(1);
    });

    it('contains eastern Pacific bulge near 150°W for Kiribati Line Islands (UTC+14)', () => {
      const kiribatiSegments = TIMEZONE_BOUNDARIES.filter(seg => 
        seg.coords && seg.coords.some(([lat, lng]) => 
          lat >= -12.0 && lat <= 12.0 && lng <= -149.0 && lng >= -156.0
        )
      );
      expect(kiribatiSegments.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('4. Plugin Hook Integration (worldTimeApp.getPaths)', () => {
    it('returns realistic curved paths with length >= 50 from worldTimeApp.getPaths', () => {
      expect(typeof worldTimeApp.getPaths).toBe('function');
      const paths: GeoPath[] = worldTimeApp.getPaths!({}, 'diurnal_cycle', 'dark');
      expect(paths.length).toBeGreaterThanOrEqual(50);

      const curvedPaths = paths.filter(p => {
        if (!p.coords || p.coords.length < 3) return false;
        const lngs = p.coords.map(c => c[1]);
        return Math.max(...lngs) - Math.min(...lngs) > 0.1;
      });
      expect(curvedPaths.length).toBeGreaterThanOrEqual(20);
    });

    it('identifies key zones (WIB, WITA, WIT, IDL) with custom styling and labels', () => {
      const paths: GeoPath[] = worldTimeApp.getPaths!({}, 'diurnal_cycle', 'dark');

      const wibPath = paths.find(p => p.utcOffset === 7 || p.id?.includes('wib') || p.label?.includes('WIB'));
      expect(wibPath).toBeDefined();
      expect(wibPath?.label).toMatch(/WIB|Jakarta|UTC\+7/i);
      expect(wibPath?.color).toContain('#10b981');

      const witaPath = paths.find(p => p.utcOffset === 8 || p.id?.includes('wita') || p.label?.includes('WITA'));
      expect(witaPath).toBeDefined();
      expect(witaPath?.label).toMatch(/WITA|UTC\+8/i);

      const witPath = paths.find(p => p.utcOffset === 9 || p.id?.includes('wit') || p.label?.includes('WIT'));
      expect(witPath).toBeDefined();
      expect(witPath?.label).toMatch(/WIT|UTC\+9/i);

      const idlPath = paths.find(p => 
        p.id?.toLowerCase().includes('idl') || 
        p.label?.toLowerCase().includes('date line') ||
        p.label?.toLowerCase().includes('international date') ||
        Math.abs(p.utcOffset ?? 0) === 12
      );
      expect(idlPath).toBeDefined();
      expect(idlPath?.dashLength).toBeDefined();
      expect(idlPath?.dashLength).toBeGreaterThan(0);
    });

    it('populates rich interactive metadata (utcOffset, localTime, diffWib, tooltipHtml) on all paths', () => {
      const paths: GeoPath[] = worldTimeApp.getPaths!({}, 'diurnal_cycle', 'dark');
      expect(paths.length).toBeGreaterThanOrEqual(50);

      for (const p of paths) {
        expect(p.utcOffset).toBeDefined();
        expect(typeof p.utcOffset).toBe('number');
        expect(p.utcOffset!).toBeGreaterThanOrEqual(-12);
        expect(p.utcOffset!).toBeLessThanOrEqual(14);

        expect(p.localTime).toBeDefined();
        expect(p.localTime).toMatch(/\d{2}:\d{2}/);

        expect(p.diffWib).toBeDefined();
        expect(typeof p.diffWib).toBe('string');
        expect(p.diffWib!.length).toBeGreaterThan(0);

        expect(p.tooltipHtml).toBeDefined();
        expect(p.tooltipHtml).toContain('div');
        expect(p.tooltipHtml).toContain('Jam:');
      }
    });
  });
});
