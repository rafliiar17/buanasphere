import { describe, it, expect } from 'bun:test';
import {
  getCountryCoordinates,
  getCountryMetadata,
  getCountryByCurrency,
  getCountryIso2,
  EXTENDED_COUNTRIES_DATA,
} from '../src/lib/data/countrySpatialData';
import {
  getGlobeTheme,
  DEFAULT_DARK_THEME,
  DEFAULT_LIGHT_THEME,
  applyGlobeTheme,
} from '../src/lib/globe/theme';
import {
  calculateGreatCircleDistanceDeg,
  getCountryFocusAltitude,
  getTravelTrajectory,
  DEFAULT_VIEW_POV,
} from '../src/lib/globe/camera';
import {
  getFeatureIso3,
  calculateChoroplethColor,
  createPolygonTooltipHtml,
  configurePolygonLayer,
} from '../src/lib/globe/layers/polygonLayer';
import {
  calculateArcAltitude,
  createArcTooltipHtml,
  createRemittanceArc,
  createFlightArc,
  configureArcLayer,
} from '../src/lib/globe/layers/arcLayer';
import {
  generateMeridianPaths,
  generateEquatorAndTropicsPaths,
  createTimezonePath,
  configurePathLayer,
} from '../src/lib/globe/layers/pathLayer';
import {
  createFadingRingColor,
  createPulsingRing,
  createSeismicRing,
  configureRingLayer,
} from '../src/lib/globe/layers/ringLayer';
import {
  filterLabelsByLOD,
  createCountryPinLabel,
  configureLabelLayer,
  GLOBAL_HUB_ISO3,
} from '../src/lib/globe/layers/labelLayer';
import type { GlobeInstance } from '../src/lib/globe/types';

/**
 * Creates a mock GlobeInstance to verify chainable configuration calls.
 */
function createMockGlobe(): GlobeInstance & { _calls: Record<string, any> } {
  const store: Record<string, any> = {};
  const mock: any = { _calls: store };

  const methods = [
    'pointOfView', 'width', 'height', 'backgroundColor', 'showAtmosphere',
    'atmosphereColor', 'atmosphereAltitude', 'globeImageUrl', 'bumpImageUrl',
    'polygonsData', 'polygonAltitude', 'polygonCapColor', 'polygonSideColor',
    'polygonStrokeColor', 'polygonLabel', 'onPolygonClick', 'onPolygonHover',
    'arcsData', 'arcStartLat', 'arcStartLng', 'arcEndLat', 'arcEndLng',
    'arcColor', 'arcAltitude', 'arcStroke', 'arcDashLength', 'arcDashGap',
    'arcDashInitialGap', 'arcDashAnimateTime', 'arcLabel', 'onArcClick', 'onArcHover',
    'pathsData', 'pathPoints', 'pathPointLat', 'pathPointLng', 'pathPointAlt',
    'pathColor', 'pathStroke', 'pathDashLength', 'pathDashGap', 'pathDashAnimateTime',
    'pathLabel', 'onPathClick', 'onPathHover',
    'ringsData', 'ringLat', 'ringLng', 'ringAltitude', 'ringColor',
    'ringMaxRadius', 'ringPropagationSpeed', 'ringRepeatPeriod',
    'labelsData', 'labelLat', 'labelLng', 'labelText', 'labelSize',
    'labelDotRadius', 'labelDotOrientation', 'labelColor', 'labelAltitude',
    'labelResolution', 'onLabelClick', 'onLabelHover', 'controls', 'renderer', 'scene'
  ];

  for (const m of methods) {
    mock[m] = (arg?: any) => {
      if (arg !== undefined) {
        store[m] = arg;
        return mock;
      }
      return store[m];
    };
  }

  return mock;
}

describe('Globe.gl Modular Architecture (frontend-2)', () => {
  describe('1. Geospatial Spatial Data Helpers (countrySpatialData.ts)', () => {
    it('loads extended countries dataset with coordinates and metadata', () => {
      expect(EXTENDED_COUNTRIES_DATA.length).toBeGreaterThan(150);
      const idn = getCountryMetadata('IDN');
      expect(idn).not.toBeNull();
      expect(idn?.countryName).toBe('Indonesia');
      expect(idn?.currencyCode).toBe('IDR');
      expect(idn?.flagEmoji).toBe('🇮🇩');
      expect(idn?.capital).toBe('Jakarta');
    });

    it('looks up coordinates correctly for countries', () => {
      const coords = getCountryCoordinates('USA');
      expect(coords).not.toBeNull();
      expect(coords?.lat).toBeCloseTo(37.09, 1);
      expect(coords?.lng).toBeCloseTo(-95.71, 1);

      const invalid = getCountryCoordinates('NONEXISTENT');
      expect(invalid).toBeNull();
    });

    it('looks up country by currency code', () => {
      const jpyCountry = getCountryByCurrency('JPY');
      expect(jpyCountry?.iso3).toBe('JPN');
      expect(jpyCountry?.countryName).toBe('Jepang');
    });

    it('maps ISO-3 to ISO-2 codes', () => {
      expect(getCountryIso2('IDN')).toBe('id');
      expect(getCountryIso2('SGP')).toBe('sg');
      expect(getCountryIso2('USA')).toBe('us');
      expect(getCountryIso2('UNKNOWN')).toBeNull();
    });
  });

  describe('2. Atmosphere & Theme Engine (theme.ts)', () => {
    it('returns calibrated dark theme tokens', () => {
      const darkTheme = getGlobeTheme('dark');
      expect(darkTheme.mode).toBe('dark');
      expect(darkTheme.backgroundColor).toBe('#030712');
      expect(darkTheme.atmosphereColor).toBe('#38bdf8');
      expect(darkTheme.atmosphereAltitude).toBe(0.22);
    });

    it('returns calibrated light theme tokens', () => {
      const lightTheme = getGlobeTheme('light');
      expect(lightTheme.mode).toBe('light');
      expect(lightTheme.backgroundColor).toBe('#f8fafc');
      expect(lightTheme.atmosphereColor).toBe('#0284c7');
      expect(lightTheme.atmosphereAltitude).toBe(0.16);
    });

    it('applies theme parameters to Globe instance', () => {
      const mockGlobe = createMockGlobe();
      applyGlobeTheme(mockGlobe, DEFAULT_DARK_THEME);
      expect(mockGlobe._calls.backgroundColor).toBe('#030712');
      expect(mockGlobe._calls.atmosphereColor).toBe('#38bdf8');
      expect(mockGlobe._calls.atmosphereAltitude).toBe(0.22);
    });
  });

  describe('3. Camera Travel & POV Controls (camera.ts)', () => {
    it('calculates great-circle distance accurately', () => {
      // Jakarta to Kuala Lumpur (~10.6°)
      const dJktKul = calculateGreatCircleDistanceDeg(-6.2, 106.8, 3.14, 101.69);
      expect(dJktKul).toBeGreaterThan(9);
      expect(dJktKul).toBeLessThan(12);

      // Jakarta to Washington DC (> 140°)
      const dJktWdc = calculateGreatCircleDistanceDeg(-6.2, 106.8, 38.9, -77.0);
      expect(dJktWdc).toBeGreaterThan(140);
      expect(dJktWdc).toBeLessThan(180);

      // Same coordinate returns 0
      expect(calculateGreatCircleDistanceDeg(10, 20, 10, 20)).toBe(0);
    });

    it('provides adaptive focus altitudes matching country size scale', () => {
      expect(getCountryFocusAltitude('RUS')).toBe(1.15);
      expect(getCountryFocusAltitude('USA')).toBe(1.15);
      expect(getCountryFocusAltitude('IDN')).toBe(0.85);
      expect(getCountryFocusAltitude('MYS')).toBe(0.55);
      expect(getCountryFocusAltitude('SGP')).toBe(0.30);
      expect(getCountryFocusAltitude('UNKNOWN')).toBe(0.60);
    });

    it('computes 2-stage swoop for distant destinations and 1-stage for nearby', () => {
      // Distant trajectory (Jakarta -> Washington DC)
      const distant = getTravelTrajectory(
        { lat: -6.2, lng: 106.8, altitude: 2.2 },
        { lat: 38.9, lng: -77.0, altitude: 1.15 }
      );
      expect(distant.isTwoStage).toBe(true);
      expect(distant.stage1.altitude).toBeGreaterThanOrEqual(2.2);
      expect(distant.stage2.altitude).toBe(1.15);
      expect(distant.stage1.durationMs).toBe(450);
      expect(distant.stage2.durationMs).toBe(750);

      // Nearby trajectory (Singapore -> Kuala Lumpur ~2.8°)
      const nearby = getTravelTrajectory(
        { lat: 1.35, lng: 103.82, altitude: 0.8 },
        { lat: 3.14, lng: 101.69, altitude: 0.55 }
      );
      expect(nearby.isTwoStage).toBe(false);
      expect(nearby.stage1.altitude).toBe(0.55);
    });
  });

  describe('4. Polygon Layer & Choropleth (polygonLayer.ts)', () => {
    it('extracts ISO-3 code from GeoJSON properties', () => {
      expect(getFeatureIso3({ properties: { ISO_A3: 'IDN' } })).toBe('IDN');
      expect(getFeatureIso3({ properties: { ADM0_A3: 'SGP' } })).toBe('SGP');
      expect(getFeatureIso3({ properties: { ISO_A3: '-99', ADM0_A3: 'FRA' } })).toBe('FRA');
      expect(getFeatureIso3({ properties: {} })).toBe('');
    });

    it('calculates choropleth color scale', () => {
      const palette: [string, string] = ['#low', '#high'];
      expect(calculateChoroplethColor(10, 0, 100, palette)).toBe('#low');
      expect(calculateChoroplethColor(80, 0, 100, palette)).toBe('#high');
    });

    it('generates rich polygon tooltip HTML with spot rate and badges', () => {
      const feat = { properties: { ISO_A3: 'IDN', NAME: 'Indonesia' } };
      const rateData = {
        rate: 15850,
        change24h: 0.42,
        currencyCode: 'IDR',
        formattedRate: 'Rp 15.850,00',
        formattedChange: '+0.42%',
      };
      const html = createPolygonTooltipHtml(feat, rateData, DEFAULT_DARK_THEME);
      expect(html).toContain('Indonesia');
      expect(html).toContain('🇮🇩');
      expect(html).toContain('Rp 15.850,00');
      expect(html).toContain('+0.42%');
    });

    it('configures polygon layer with dynamic altitude and colors on Globe', () => {
      const mockGlobe = createMockGlobe();
      const mockFeatures = [
        { properties: { ISO_A3: 'IDN' } },
        { properties: { ISO_A3: 'SGP' } },
      ];

      configurePolygonLayer(mockGlobe, {
        features: mockFeatures,
        selectedIso3: 'IDN',
        hoveredIso3: 'SGP',
        theme: DEFAULT_DARK_THEME,
      });

      expect(mockGlobe._calls.polygonsData).toBe(mockFeatures);
      // Selected country altitude must be elevated (0.045)
      const altFn = mockGlobe._calls.polygonAltitude;
      expect(altFn(mockFeatures[0])).toBe(0.045);
      // Hovered country altitude (0.025)
      expect(altFn(mockFeatures[1])).toBe(0.025);

      // Selected country cap color must match selected color
      const capColorFn = mockGlobe._calls.polygonCapColor;
      expect(capColorFn(mockFeatures[0])).toBe(DEFAULT_DARK_THEME.polygonSelectedColor);
      expect(capColorFn(mockFeatures[1])).toBe(DEFAULT_DARK_THEME.polygonHoverColor);
    });
  });

  describe('5. Arc Layer & Corridors (arcLayer.ts)', () => {
    it('calculates adaptive arc altitude based on distance', () => {
      const shortAlt = calculateArcAltitude(1.35, 103.82, 3.14, 101.69); // SGP -> KUL
      const longAlt = calculateArcAltitude(-6.2, 106.8, 38.9, -77.0);   // IDN -> USA
      expect(shortAlt).toBeLessThan(longAlt);
      expect(longAlt).toBeGreaterThan(0.2);
    });

    it('creates remittance flow arc between country ISO3 codes', () => {
      const arc = createRemittanceArc('IDN', 'SGP', {
        amount: 2500000,
        currency: 'SGD',
        label: 'Remitansi Tenaga Kerja',
      });
      expect(arc).not.toBeNull();
      expect(arc?.fromIso3).toBe('IDN');
      expect(arc?.toIso3).toBe('SGP');
      expect(arc?.amount).toBe(2500000);
      expect(arc?.dashLength).toBe(0.4);
      expect(arc?.dashGap).toBe(0.2);
    });

    it('creates flight corridor arc between arbitrary coordinates', () => {
      const arc = createFlightArc({ lat: 10, lng: 20 }, { lat: 30, lng: 40 });
      expect(arc.startLat).toBe(10);
      expect(arc.startLng).toBe(20);
      expect(arc.endLat).toBe(30);
      expect(arc.endLng).toBe(40);
      expect(arc.label).toContain('Penerbangan');
    });

    it('configures arc layer on Globe instance', () => {
      const mockGlobe = createMockGlobe();
      const mockArc = createRemittanceArc('IDN', 'MYS');
      if (!mockArc) throw new Error('Failed to create arc');

      configureArcLayer(mockGlobe, {
        arcs: [mockArc],
        theme: DEFAULT_DARK_THEME,
      });

      expect(mockGlobe._calls.arcsData).toEqual([mockArc]);
      expect(mockGlobe._calls.arcStartLat(mockArc)).toBe(mockArc.startLat);
      expect(mockGlobe._calls.arcStroke(mockArc)).toBe(mockArc.stroke);
    });
  });

  describe('6. Path Layer & Meridians (pathLayer.ts)', () => {
    it('generates meridian paths with highlighted Prime Meridian', () => {
      const meridians = generateMeridianPaths(15, DEFAULT_DARK_THEME);
      expect(meridians.length).toBe(24);
      const prime = meridians.find((m) => m.id === 'meridian-0');
      expect(prime).toBeDefined();
      expect(prime?.stroke).toBe(1.5);
      expect(prime?.label).toContain('Prime Meridian');
    });

    it('generates Equator and Tropics paths', () => {
      const parallels = generateEquatorAndTropicsPaths(DEFAULT_DARK_THEME);
      expect(parallels.length).toBe(3);
      const equator = parallels.find((p) => p.isEquator);
      expect(equator).toBeDefined();
      expect(equator?.coords[0][0]).toBe(0); // Lat 0
    });

    it('creates custom timezone path', () => {
      const tzPath = createTimezonePath(
        { id: 'wib', utcOffset: 7, gmtLabel: 'UTC+7', keyRegions: ['Jakarta', 'Bangkok'] },
        [[-10, 105], [10, 105]],
        DEFAULT_DARK_THEME
      );
      expect(tzPath.id).toBe('tz-wib');
      expect(tzPath.label).toContain('UTC+7');
    });

    it('configures path layer on Globe instance', () => {
      const mockGlobe = createMockGlobe();
      const paths = generateEquatorAndTropicsPaths(DEFAULT_DARK_THEME);
      configurePathLayer(mockGlobe, { paths, theme: DEFAULT_DARK_THEME });

      expect(mockGlobe._calls.pathsData).toEqual(paths);
      expect(mockGlobe._calls.pathStroke(paths[0])).toBe(paths[0].stroke);
    });
  });

  describe('7. Ring Layer & Seismic Pulses (ringLayer.ts)', () => {
    it('calculates fading ring color according to expansion progress', () => {
      const colorStart = createFadingRingColor('#f43f5e', 0.0);
      const colorEnd = createFadingRingColor('#f43f5e', 1.0);
      expect(colorStart).toContain('1.000');
      expect(colorEnd).toContain('0.000');
    });

    it('creates seismic rings scaled by earthquake magnitude', () => {
      const moderate = createSeismicRing(-6.5, 105.2, 5.2, 'Selat Sunda');
      const severe = createSeismicRing(-8.3, 115.1, 7.4, 'Bali');

      expect(severe.maxRadius).toBeGreaterThan(moderate.maxRadius!);
      expect(severe.color).toBe('#ef4444'); // Red for M >= 7.0
      expect(moderate.color).toBe('#f59e0b'); // Amber for M < 6.0
    });

    it('configures ring layer on Globe instance', () => {
      const mockGlobe = createMockGlobe();
      const ring = createPulsingRing(0, 110);
      configureRingLayer(mockGlobe, { rings: [ring], theme: DEFAULT_DARK_THEME });

      expect(mockGlobe._calls.ringsData).toEqual([ring]);
      expect(mockGlobe._calls.ringLat(ring)).toBe(0);
      expect(mockGlobe._calls.ringLng(ring)).toBe(110);
    });
  });

  describe('8. Label Layer & LOD Filtering (labelLayer.ts)', () => {
    const mockLabels = [
      { id: '1', iso3: 'IDN', lat: -0.7, lng: 113.9, text: '🇮🇩 Indonesia', lodLevel: 0 },
      { id: '2', iso3: 'SGP', lat: 1.3, lng: 103.8, text: '🇸🇬 Singapore', lodLevel: 0 },
      { id: '3', iso3: 'BRN', lat: 4.5, lng: 114.7, text: '🇧🇳 Brunei', lodLevel: 1 },
      { id: '4', iso3: 'AND', lat: 42.5, lng: 1.5, text: '🇦🇩 Andorra', lodLevel: 2 },
    ];

    it('filters labels by Level-of-Detail (LOD) based on camera altitude', () => {
      // High overview (> 1.8): only LOD 0
      const highAltLabels = filterLabelsByLOD(mockLabels, 2.2);
      expect(highAltLabels.map((l) => l.iso3)).toEqual(['IDN', 'SGP']);

      // Medium altitude (0.8 - 1.8): LOD 0 and LOD 1
      const medAltLabels = filterLabelsByLOD(mockLabels, 1.2);
      expect(medAltLabels.map((l) => l.iso3)).toEqual(['IDN', 'SGP', 'BRN']);

      // Zoomed in close (<= 0.8): all labels
      const closeLabels = filterLabelsByLOD(mockLabels, 0.4);
      expect(closeLabels.length).toBe(4);
    });

    it('always preserves selected country regardless of high camera altitude', () => {
      // Andorra is LOD 2, but when selected at high altitude, it must be visible!
      const filtered = filterLabelsByLOD(mockLabels, 2.2, 'AND');
      const iso3s = filtered.map((l) => l.iso3);
      expect(iso3s).toContain('AND');
    });

    it('styles selected country pins with elevated altitude and larger size', () => {
      const idnMeta = getCountryMetadata('IDN')!;
      const pinSelected = createCountryPinLabel(idnMeta, { isSelected: true, spotRate: 'Rp 15.850' });
      const pinNormal = createCountryPinLabel(idnMeta, { isSelected: false });

      expect(pinSelected.altitude).toBe(0.038);
      expect(pinNormal.altitude).toBe(0.015);
      expect(pinSelected.size).toBe(0.85);
      expect(pinSelected.text).toContain('Rp 15.850');
    });

    it('configures label layer on Globe instance with resolution 3', () => {
      const mockGlobe = createMockGlobe();
      configureLabelLayer(mockGlobe, {
        labels: mockLabels,
        cameraAltitude: 2.2,
        resolution: 3,
        theme: DEFAULT_DARK_THEME,
      });

      expect(mockGlobe._calls.labelResolution).toBe(3);
      expect(mockGlobe._calls.labelsData.length).toBe(2); // Only LOD 0 at 2.2 altitude
    });
  });
});
