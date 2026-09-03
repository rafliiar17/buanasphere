import { describe, it, expect } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

describe('Dynamic High-Contrast Country Labels & Capitals Flag Mode (ADR 0050 / TDD)', () => {
  const globeViewPath = path.resolve(__dirname, '../src/lib/features/map/components/Globe3DView.svelte');
  const worldCapitalsPath = path.resolve(__dirname, '../src/lib/framework/geoglobe/plugins/worldCapitalsApp.ts');
  const universalControlsPath = path.resolve(__dirname, '../src/lib/framework/geoglobe/ui/UniversalAppControls.svelte');

  describe('1. Dynamic High-Contrast Labels & 3D Pin Altitude (Globe3DView.svelte)', () => {
    it('uses high-contrast pure white (#ffffff) for selected country labels to prevent low-contrast clashes', () => {
      const content = fs.readFileSync(globeViewPath, 'utf-8');
      // When selected, label color must be #ffffff or white-based, not #38bdf8
      expect(content).toContain("defaultColor = isSelected ? '#ffffff'");
    });

    it('elevates 3D label altitude for selected countries to float above raised 3D polygons (>= 0.030)', () => {
      const content = fs.readFileSync(globeViewPath, 'utf-8');
      expect(content).toMatch(/labelAltitude\(\(d:\s*any\)\s*=>\s*\(?d\.iso3\s*===\s*mapState\.selectedCountryIso3\s*\?\s*0\.03[0-9]/);
    });

    it('enlarges selected label size (>= 0.75) and dot radius (>= 0.20) for crystal-clear focus', () => {
      const content = fs.readFileSync(globeViewPath, 'utf-8');
      expect(content).toMatch(/isSelected\s*\?\s*0\.[7-9][0-9]?/);
      expect(content).toMatch(/labelDotRadius\(\(d:\s*any\)\s*=>\s*\(?d\.iso3\s*===\s*mapState\.selectedCountryIso3\s*\?\s*0\.2[0-9]/);
    });

    it('sets label resolution to 3 for ultra-sharp canvas text rendering on Retina/HiDPI displays', () => {
      const content = fs.readFileSync(globeViewPath, 'utf-8');
      expect(content).toContain('.labelResolution(3)');
    });

    it('formats clean typography on globeLabels text without flag emoji artifacts (ADR 0067)', () => {
      const content = fs.readFileSync(globeViewPath, 'utf-8');
      expect(content).not.toContain('spatial?.flagEmoji ?');
    });
  });

  describe('2. Clean Capital Pin Labels in worldCapitalsApp.ts (ADR 0067)', () => {
    it('worldCapitalsApp getPinLabel formats clean typography with capital city and country', async () => {
      const { worldCapitalsApp } = await import('../src/lib/framework/geoglobe/plugins/worldCapitalsApp');
      const mockCountry = {
        iso3: 'USA',
        countryName: 'Amerika Serikat',
        currencyCode: 'USD',
        currencyName: 'US Dollar',
        flagEmoji: '🇺🇸',
        region: 'Americas',
        capital: 'Washington, D.C.',
        lat: 38.9,
        lng: -77.0,
        utcOffset: -5,
        continent: 'North America',
      };
      const mockData = {
        iso3: 'USA',
        countryName: 'Amerika Serikat',
        capital: 'Washington, D.C.',
        historicalEra: '19th_century' as const,
        eraLabel: 'Abad ke-18',
        independenceDate: '1776-07-04',
        foundationYear: 1776,
        sovereigntyOrigin: 'Kerajaan Britania Raya',
        nationalDayTitle: 'Independence Day',
        capitalCoordinates: { lat: 38.9072, lng: -77.0369 },
      };

      const pinLabel = worldCapitalsApp.getPinLabel!(mockCountry, mockData as any, 'era');
      expect(pinLabel.text).not.toContain('🇺🇸');
      expect(pinLabel.text).toContain('Washington, D.C.');
      expect(pinLabel.text).toContain('Amerika Serikat');
      expect(pinLabel.shortText).toBe('Washington, D.C.');
    });
  });

  describe('3. Authentic Flag Mode in /capitals & Globe3DView Synchronization', () => {
    it('Globe3DView checks both mapState.activeMetric and geoStore.activeMetricId for flag mode', () => {
      const content = fs.readFileSync(globeViewPath, 'utf-8');
      expect(content).toMatch(/isFlag\s*=\s*\(?mapState\.activeMetric\s*===\s*['"]flag['"]\s*\|\|\s*geoStore\.activeMetricId\s*===\s*['"]flag['"]\)?/);
    });

    it('worldCapitalsApp registers flag metric in metrics list', async () => {
      const { worldCapitalsApp } = await import('../src/lib/framework/geoglobe/plugins/worldCapitalsApp');
      const flagMetric = worldCapitalsApp.metrics.find((m) => m.id === 'flag');
      expect(flagMetric).toBeDefined();
      expect(flagMetric?.label).toContain('Bendera');
    });

    it('worldCapitalsApp getPolygonColor preserves flag coloring when activeMetric is flag', async () => {
      const { worldCapitalsApp } = await import('../src/lib/framework/geoglobe/plugins/worldCapitalsApp');
      const mockCountry = {
        iso3: 'USA',
        countryName: 'Amerika Serikat',
        currencyCode: 'USD',
        currencyName: 'US Dollar',
        flagEmoji: '🇺🇸',
        region: 'Americas',
        capital: 'Washington, D.C.',
        lat: 38.9,
        lng: -77.0,
        utcOffset: -5,
        continent: 'North America',
      };
      const color = worldCapitalsApp.getPolygonColor!(mockCountry, {} as any, 'flag', 'dark', { isSelected: true });
      // In flag mode, selected country should not turn flat #38bdf8, but preserve authentic flag color
      expect(color).not.toBe('#38bdf8');
    });
  });

  describe('4. Controls Synchronization for Flag Metric (UniversalAppControls.svelte)', () => {
    it('UniversalAppControls updates both mapState and geoStore when metric changes', () => {
      const content = fs.readFileSync(universalControlsPath, 'utf-8');
      expect(content).toContain('mapState?.setMetric?.(metricId)');
      expect(content).toContain('geoStore.setMetric?.(metricId)');
    });
  });
});
