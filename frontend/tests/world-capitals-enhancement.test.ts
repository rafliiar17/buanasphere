import { describe, it, expect } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { worldCapitalsApp } from '../src/lib/framework/geoglobe/plugins/worldCapitalsApp';
import { getCapitalDataForCountry, WORLD_CAPITALS_DATASET } from '../src/lib/framework/geoglobe/data/worldCapitalsData';
import { EXTENDED_COUNTRIES_DATA } from '../src/lib/framework/geoglobe/countrySpatialData';

describe('World Capitals Enhancement Suite (ADR 0046 / TDD)', () => {
  describe('1. Precise Capital Coordinates (True Geographic City Lat/Lng)', () => {
    it('provides precise city coordinates for Indonesia (Jakarta) in Java, not Kalimantan', () => {
      const idn = getCapitalDataForCountry('IDN');
      expect(idn.capital).toBe('Jakarta');
      expect(idn.capitalCoordinates).toBeDefined();
      expect(idn.capitalCoordinates!.lat).toBeCloseTo(-6.2088, 1);
      expect(idn.capitalCoordinates!.lng).toBeCloseTo(106.8456, 1);
    });

    it('provides precise city coordinates for major world capitals (USA, JPN, GBR, AUS, BRA)', () => {
      const usa = getCapitalDataForCountry('USA');
      expect(usa.capital).toBe('Washington, D.C.');
      expect(usa.capitalCoordinates!.lat).toBeCloseTo(38.9072, 1);
      expect(usa.capitalCoordinates!.lng).toBeCloseTo(-77.0369, 1);

      const jpn = getCapitalDataForCountry('JPN');
      expect(jpn.capital).toBe('Tokyo');
      expect(jpn.capitalCoordinates!.lat).toBeCloseTo(35.6762, 1);
      expect(jpn.capitalCoordinates!.lng).toBeCloseTo(139.6503, 1);

      const gbr = getCapitalDataForCountry('GBR');
      expect(gbr.capital).toBe('London');
      expect(gbr.capitalCoordinates!.lat).toBeCloseTo(51.5074, 1);
      expect(gbr.capitalCoordinates!.lng).toBeCloseTo(-0.1278, 1);

      const aus = getCapitalDataForCountry('AUS');
      expect(aus.capital).toBe('Canberra');
      expect(aus.capitalCoordinates!.lat).toBeCloseTo(-35.2809, 1);
      expect(aus.capitalCoordinates!.lng).toBeCloseTo(149.1300, 1);

      const bra = getCapitalDataForCountry('BRA');
      expect(bra.capital).toBe('Brasília');
      expect(bra.capitalCoordinates!.lat).toBeCloseTo(-15.7975, 1);
      expect(bra.capitalCoordinates!.lng).toBeCloseTo(-47.8919, 1);
    });

    it('returns custom lat and lng from worldCapitalsApp.getPinLabel', () => {
      const idnSpatial = EXTENDED_COUNTRIES_DATA.find(c => c.iso3 === 'IDN')!;
      const idnData = getCapitalDataForCountry('IDN');
      const pin = worldCapitalsApp.getPinLabel!(idnSpatial, idnData, 'era');
      expect(pin.lat).toBeDefined();
      expect(pin.lng).toBeDefined();
      expect(pin.lat!).toBeCloseTo(-6.2088, 1);
      expect(pin.lng!).toBeCloseTo(106.8456, 1);
    });

    it('verifies Globe3DView labelsData prioritizes pinLabel.lat and pinLabel.lng', () => {
      const globePath = path.resolve(__dirname, '../src/lib/features/map/components/Globe3DView.svelte');
      const content = fs.readFileSync(globePath, 'utf-8');
      expect(content).toContain('pinLabel?.lat');
      expect(content).toContain('pinLabel?.lng');
    });
  });

  describe('2. Flag Metric Colorization Support (flag)', () => {
    it('declares the "flag" metric in worldCapitalsApp.metrics', () => {
      const flagMetric = worldCapitalsApp.metrics.find(m => m.id === 'flag');
      expect(flagMetric).toBeDefined();
      expect(flagMetric?.label).toContain('Bendera');
    });

    it('colors polygons using official flag colors when activeMetric is "flag"', () => {
      const idnSpatial = EXTENDED_COUNTRIES_DATA.find(c => c.iso3 === 'IDN')!;
      const idnData = getCapitalDataForCountry('IDN');
      const color = worldCapitalsApp.getPolygonColor!(idnSpatial, idnData, 'flag', 'dark');
      expect(color).toBe('#dc2626'); // Merah Putih primary red
    });
  });

  describe('3. National Anthem (Lagu Kebangsaan) Integration', () => {
    it('includes national anthem title, composer, and audio URL in WorldCapitalData', () => {
      const idn = getCapitalDataForCountry('IDN');
      expect(idn.nationalAnthem).toBeDefined();
      expect(idn.nationalAnthem!.title).toContain('Indonesia Raya');
      expect(idn.nationalAnthem!.composer).toContain('Supratman');

      const fra = getCapitalDataForCountry('FRA');
      expect(fra.nationalAnthem!.title).toContain('Marseillaise');

      const jpn = getCapitalDataForCountry('JPN');
      expect(jpn.nationalAnthem!.title).toContain('Kimigayo');
    });

    it('mentions the national anthem in getTooltipHtml', () => {
      const idnSpatial = EXTENDED_COUNTRIES_DATA.find(c => c.iso3 === 'IDN')!;
      const idnData = getCapitalDataForCountry('IDN');
      const tooltip = worldCapitalsApp.getTooltipHtml!(idnSpatial, idnData, 'era', 'dark');
      expect(tooltip).toContain('Indonesia Raya');
      expect(tooltip).toContain('Lagu Kebangsaan');
    });

    it('renders national anthem details in renderInspector', () => {
      const idnSpatial = EXTENDED_COUNTRIES_DATA.find(c => c.iso3 === 'IDN')!;
      const idnData = getCapitalDataForCountry('IDN');
      const inspector = worldCapitalsApp.renderInspector!(idnSpatial, idnData);
      expect(inspector.customData?.nationalAnthem).toBeDefined();
      expect(inspector.statsGrid?.some(s => s.label.includes('Lagu Kebangsaan'))).toBe(true);
    });
  });
});
