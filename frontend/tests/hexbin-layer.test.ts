import { describe, it, expect } from 'bun:test';
import {
  GLOBAL_FINANCIAL_HUBS,
  getFinancialHubByIso3,
  type FinancialHubData,
} from '../src/lib/features/map/globe/data/financialHubsData';
import {
  calculateHexAltitude,
  getHexTopColor,
  getHexSideColor,
  createHexBinTooltip,
  configureHexBinLayer,
  type HexBinPointData,
} from '../src/lib/features/map/globe/layers/hexBinLayer';

describe('3D Hexagonal Binning Financial Volume Suite (ADR 0063 / TDD)', () => {
  describe('1. Global Financial Hubs Dataset (financialHubsData.ts)', () => {
    it('contains at least 15 global financial centers from BIS survey', () => {
      expect(GLOBAL_FINANCIAL_HUBS.length).toBeGreaterThanOrEqual(15);
    });

    it('contains top financial hubs: London, New York, Singapore, Tokyo, and Jakarta', () => {
      const hubsByIso = new Set(GLOBAL_FINANCIAL_HUBS.map((h) => h.iso3));
      expect(hubsByIso.has('GBR')).toBe(true); // London
      expect(hubsByIso.has('USA')).toBe(true); // New York
      expect(hubsByIso.has('SGP')).toBe(true); // Singapore
      expect(hubsByIso.has('JPN')).toBe(true); // Tokyo
      expect(hubsByIso.has('IDN')).toBe(true); // Jakarta
    });

    it('validates geographic coordinates and turnover values', () => {
      for (const hub of GLOBAL_FINANCIAL_HUBS) {
        expect(hub.lat).toBeGreaterThanOrEqual(-90);
        expect(hub.lat).toBeLessThanOrEqual(90);
        expect(hub.lng).toBeGreaterThanOrEqual(-180);
        expect(hub.lng).toBeLessThanOrEqual(180);
        expect(hub.dailyTurnoverBillionUsd).toBeGreaterThan(0);
        expect(hub.marketSharePercent).toBeGreaterThanOrEqual(0);
      }
    });

    it('retrieves financial hub by country ISO3', () => {
      const idn = getFinancialHubByIso3('IDN');
      expect(idn).toBeDefined();
      expect(idn?.city).toBe('Jakarta');
      expect(idn?.currencyCode).toBe('IDR');

      const gbr = getFinancialHubByIso3('GBR');
      expect(gbr).toBeDefined();
      expect(gbr?.city).toBe('London');
      expect(gbr?.dailyTurnoverBillionUsd).toBeGreaterThanOrEqual(3000);
    });
  });

  describe('2. Hexagonal Binning Layer Logic (hexBinLayer.ts)', () => {
    it('calculates logarithmic scaled altitude between 0.02 and 0.45', () => {
      const londonAlt = calculateHexAltitude(3755);
      const jktAlt = calculateHexAltitude(45);
      const smallAlt = calculateHexAltitude(5);

      expect(londonAlt).toBeGreaterThan(jktAlt);
      expect(jktAlt).toBeGreaterThan(smallAlt);
      expect(londonAlt).toBeLessThanOrEqual(0.45);
      expect(smallAlt).toBeGreaterThanOrEqual(0.02);
    });

    it('provides top and side colors with cyan/emerald radiant palette', () => {
      const topColorHigh = getHexTopColor(3755, 'dark');
      const topColorNormal = getHexTopColor(45, 'dark');
      const sideColor = getHexSideColor(3755, 'dark');

      expect(typeof topColorHigh).toBe('string');
      expect(typeof topColorNormal).toBe('string');
      expect(typeof sideColor).toBe('string');
      expect(topColorHigh.length).toBeGreaterThan(0);
    });

    it('generates rich glassmorphism HTML tooltip for financial hub', () => {
      const gbr = getFinancialHubByIso3('GBR')!;
      const html = createHexBinTooltip(gbr, 20300, 'dark');

      expect(html).toContain('London');
      expect(html).toContain('3.755');
      expect(html).toContain('38.1%');
      expect(html).toContain('Rp 20.300');
    });

    it('configures hexBin layer methods on a mock Globe instance', () => {
      const calls: Record<string, any> = {};
      const mockGlobe: any = {
        hexBinPointsData: (d: any) => { calls.hexBinPointsData = d; return mockGlobe; },
        hexBinPointLat: (fn: any) => { calls.hexBinPointLat = fn; return mockGlobe; },
        hexBinPointLng: (fn: any) => { calls.hexBinPointLng = fn; return mockGlobe; },
        hexBinPointWeight: (fn: any) => { calls.hexBinPointWeight = fn; return mockGlobe; },
        hexBinResolution: (r: any) => { calls.hexBinResolution = r; return mockGlobe; },
        hexMargin: (m: any) => { calls.hexMargin = m; return mockGlobe; },
        hexTopCurvatureResolution: (r: any) => { calls.hexTopCurvatureResolution = r; return mockGlobe; },
        hexAltitude: (fn: any) => { calls.hexAltitude = fn; return mockGlobe; },
        hexTopColor: (fn: any) => { calls.hexTopColor = fn; return mockGlobe; },
        hexSideColor: (fn: any) => { calls.hexSideColor = fn; return mockGlobe; },
        hexLabel: (fn: any) => { calls.hexLabel = fn; return mockGlobe; },
        onHexClick: (fn: any) => { calls.onHexClick = fn; return mockGlobe; },
        onHexHover: (fn: any) => { calls.onHexHover = fn; return mockGlobe; },
      };

      const points: HexBinPointData[] = GLOBAL_FINANCIAL_HUBS.map((h) => ({
        lat: h.lat,
        lng: h.lng,
        weight: h.dailyTurnoverBillionUsd,
        hub: h,
      }));

      configureHexBinLayer(mockGlobe, {
        points,
        theme: 'dark',
        onHexClick: () => {},
      });

      expect(calls.hexBinPointsData).toEqual(points);
      expect(typeof calls.hexBinPointLat).toBe('function');
      expect(typeof calls.hexBinPointLng).toBe('function');
      expect(typeof calls.hexBinPointWeight).toBe('function');
      expect(calls.hexBinResolution).toBe(3);
      expect(calls.hexMargin).toBe(0.18);
      expect(typeof calls.hexAltitude).toBe('function');
      expect(typeof calls.hexTopColor).toBe('function');
      expect(typeof calls.hexSideColor).toBe('function');
    });
  });
});
