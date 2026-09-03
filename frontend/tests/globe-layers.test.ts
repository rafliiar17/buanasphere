import { describe, it, expect } from 'bun:test';
import {
  getFeatureIso3,
  getFeatureIso2,
  getCountryColor,
  getPolygonAltitude,
  getTooltipHtml,
} from '../src/lib/features/map/globe/layers/polygonLayer';
import { calculateArcAltitude, getGlobeArcs } from '../src/lib/features/map/globe/layers/arcLayer';
import { getGlobePaths } from '../src/lib/features/map/globe/layers/pathLayer';
import { getGlobeRings } from '../src/lib/features/map/globe/layers/ringLayer';
import { getGlobeLabels, filterLabelsByLOD } from '../src/lib/features/map/globe/layers/labelLayer';
import {
  calculateGreatCircleDistanceDeg,
  getCountryFocusAltitude,
  getTravelTrajectory,
} from '../src/lib/features/map/globe/camera';
import type { MapCountryData } from '../src/lib/features/map/map-constants';

describe('FE1 Globe Modular Architecture & Dynamic Filtering', () => {
  const mockCountryData: MapCountryData[] = [
    {
      iso3: 'IDN',
      countryName: 'Indonesia',
      currencyCode: 'IDR',
      currencyName: 'Indonesian Rupiah',
      flag: '🇮🇩',
      regionId: 'asean',
      regionLabel: 'ASEAN',
      buyRate: 1,
      sellRate: 1,
      middleRate: 1,
      spread: 0,
      spreadPercent: 0,
      change24h: 0.15,
    },
    {
      iso3: 'USA',
      countryName: 'United States',
      currencyCode: 'USD',
      currencyName: 'US Dollar',
      flag: '🇺🇸',
      regionId: 'americas',
      regionLabel: 'Amerika',
      buyRate: 15800,
      sellRate: 15950,
      middleRate: 15875,
      spread: 150,
      spreadPercent: 0.94,
      change24h: -0.22,
    },
  ];

  describe('1. Polygon Layer & Dynamic Filtering (polygonLayer.ts)', () => {
    it('correctly normalizes ISO-3 and ISO-2 from GeoJSON properties', () => {
      const feat1 = { properties: { ISO_A3: 'IDN', ISO_A2: 'ID' } };
      const feat2 = { properties: { ISO_A3: '-99', ADM0_A3: 'USA' } };
      expect(getFeatureIso3(feat1)).toBe('IDN');
      expect(getFeatureIso2(feat1)).toBe('id');
      expect(getFeatureIso3(feat2)).toBe('USA');
      expect(getFeatureIso2(feat2)).toBe('us');
    });

    it('applies glowing highlight for selected and hovered countries', () => {
      const isDark = true;
      const selectedColor = getCountryColor('IDN', {
        mapData: mockCountryData,
        selectedIso3: 'IDN',
        hoveredIso3: null,
        currentTheme: 'dark',
        activeMetric: 'rate',
        isMatched: true,
        isFilterActive: false,
      });
      const hoverColor = getCountryColor('USA', {
        mapData: mockCountryData,
        selectedIso3: null,
        hoveredIso3: 'USA',
        currentTheme: 'dark',
        activeMetric: 'rate',
        isMatched: true,
        isFilterActive: false,
      });

      expect(selectedColor).toBe('#38bdf8'); // Sky blue highlight
      expect(hoverColor).toBe('#34d399');    // Emerald hover
    });

    it('dims countries that do not match active filter', () => {
      const dimmedColorDark = getCountryColor('USA', {
        mapData: mockCountryData,
        selectedIso3: null,
        hoveredIso3: null,
        currentTheme: 'dark',
        activeMetric: 'rate',
        isMatched: false,
        isFilterActive: true,
      });
      const dimmedColorLight = getCountryColor('USA', {
        mapData: mockCountryData,
        selectedIso3: null,
        hoveredIso3: null,
        currentTheme: 'light',
        activeMetric: 'rate',
        isMatched: false,
        isFilterActive: true,
      });

      expect(dimmedColorDark).toContain('rgba(30, 41, 59, 0.20)');
      expect(dimmedColorLight).toContain('rgba(226, 232, 240, 0.35)');
    });

    it('delegates polygon color to activeApp.getPolygonColor if available', () => {
      const mockActiveApp = {
        getPolygonColor: (spatial: any, appData: any, metric: string, theme: string) => {
          return '#ff00ff';
        },
      };

      const color = getCountryColor('IDN', {
        mapData: mockCountryData,
        selectedIso3: null,
        hoveredIso3: null,
        currentTheme: 'dark',
        activeMetric: 'rate',
        isMatched: true,
        isFilterActive: false,
        activeApp: mockActiveApp as any,
      });

      expect(color).toBe('#ff00ff');
    });

    it('calculates dynamic polygon altitude with elevated selection', () => {
      const selectedAlt = getPolygonAltitude('IDN', {
        selectedIso3: 'IDN',
        hoveredIso3: null,
        isMatched: true,
        isFilterActive: false,
        isFlag: false,
      });
      const regularAlt = getPolygonAltitude('USA', {
        selectedIso3: 'IDN',
        hoveredIso3: null,
        isMatched: true,
        isFilterActive: false,
        isFlag: false,
      });
      const filteredOutAlt = getPolygonAltitude('USA', {
        selectedIso3: 'IDN',
        hoveredIso3: null,
        isMatched: false,
        isFilterActive: true,
        isFlag: false,
      });

      expect(selectedAlt).toBe(0.018);
      expect(regularAlt).toBe(0.008);
      expect(filteredOutAlt).toBe(0.001);
    });

    it('generates rich tooltip HTML with spot rate and 24h trend', () => {
      const html = getTooltipHtml('USA', {
        mapData: mockCountryData,
        currentTheme: 'dark',
        activeMetric: 'rate',
      });

      expect(html).toContain('Amerika Serikat');
      expect(html).toContain('USD');
      expect(html).toContain('Kurs Tengah');
    });
  });

  describe('2. Arc Layer & Corridors (arcLayer.ts)', () => {
    it('calculates adaptive arc altitude based on distance', () => {
      const shortDistAlt = calculateArcAltitude(0, 100, 1, 101);
      const longDistAlt = calculateArcAltitude(-6.2, 106.8, 40.7, -74.0); // IDN to USA
      expect(longDistAlt).toBeGreaterThan(shortDistAlt);
      expect(longDistAlt).toBeLessThanOrEqual(0.45);
    });

    it('filters arcs when flightCorridorFilter is active', () => {
      const mockArcs = [
        { startLat: -6.2, startLng: 106.8, endLat: 1.3, endLng: 103.8, color: '#10b981' }, // IDN to SGP
        { startLat: 35.6, startLng: 139.6, endLat: 37.5, endLng: 126.9, color: '#38bdf8' }, // JPN to KOR
      ];

      const filtered = getGlobeArcs({
        activeApp: {
          getArcs: () => mockArcs,
        } as any,
        flightCorridorFilter: 'IDN',
        isCountryMatched: (iso3: string) => iso3 === 'IDN',
      });

      expect(filtered.length).toBe(1);
    });
  });

  describe('3. Path Layer & Meridians (pathLayer.ts)', () => {
    it('returns empty array when showTimezoneLines is false', () => {
      const paths = getGlobePaths({
        showTimezoneLines: false,
        activeMetric: 'rate',
        currentTheme: 'dark',
      });
      expect(paths).toEqual([]);
    });

    it('calls activeApp.getPaths when showTimezoneLines is true', () => {
      const mockPaths = [{ coords: [[0, 0], [10, 10]], color: '#fff' }];
      const paths = getGlobePaths({
        showTimezoneLines: true,
        activeApp: {
          getPaths: () => mockPaths,
        } as any,
        activeMetric: 'rate',
        currentTheme: 'dark',
      });
      expect(paths).toEqual(mockPaths as any);
    });
  });

  describe('4. Ring Layer & Seismology (ringLayer.ts)', () => {
    it('delegates to activeApp.getRingData with selected country', () => {
      const mockRings = [{ lat: -6.2, lng: 106.8, color: '#f43f5e', maxRadius: 5 }];
      const rings = getGlobeRings({
        activeApp: {
          getRingData: (country: any) => (country.iso3 === 'IDN' ? mockRings : []),
        } as any,
        selectedIso3: 'IDN',
      });
      expect(rings).toEqual(mockRings as any);
    });
  });

  describe('5. Label Layer & LOD Filtering (labelLayer.ts)', () => {
    it('filters labels according to camera altitude and always includes selected country', () => {
      const labels = [
        { iso3: 'USA', text: 'USA', lat: 38, lng: -97, size: 1, color: '#fff', lodLevel: 0 },
        { iso3: 'BRN', text: 'Brunei', lat: 4.5, lng: 114.7, size: 0.8, color: '#fff', lodLevel: 1 },
      ];

      // At high altitude (overview), only LOD 0 or selected
      const filteredHigh = filterLabelsByLOD(labels, 2.5, 'BRN');
      expect(filteredHigh.some((l) => l.iso3 === 'USA')).toBe(true);
      expect(filteredHigh.some((l) => l.iso3 === 'BRN')).toBe(true); // BRN is LOD 1 but selected!

      const filteredHighNoSel = filterLabelsByLOD(labels, 2.5, null);
      expect(filteredHighNoSel.some((l) => l.iso3 === 'USA')).toBe(true);
      expect(filteredHighNoSel.some((l) => l.iso3 === 'BRN')).toBe(false); // BRN filtered out
    });
  });

  describe('6. Camera Navigation & Swoop Math (camera.ts)', () => {
    it('calculates great circle distance in degrees correctly', () => {
      const distSame = calculateGreatCircleDistanceDeg(0, 0, 0, 0);
      const distAntipodal = calculateGreatCircleDistanceDeg(0, 0, 0, 180);
      expect(distSame).toBe(0);
      expect(Math.round(distAntipodal)).toBe(180);
    });

    it('generates two-stage swoop trajectory for long-distance camera travel', () => {
      const fromPov = { lat: -6.2, lng: 106.8, altitude: 2.2 }; // Jakarta
      const toCoords = { lat: 40.7, lng: -74.0 };               // New York (long distance)
      const trajectory = getTravelTrajectory(fromPov, toCoords, { targetAltitude: 0.85 });

      expect(trajectory.isTwoStage).toBe(true);
      expect(trajectory.stage1.altitude).toBeGreaterThan(fromPov.altitude); // Lift-off altitude
      expect(trajectory.stage2.altitude).toBe(0.85); // Swoop-in target altitude
    });
  });
});
