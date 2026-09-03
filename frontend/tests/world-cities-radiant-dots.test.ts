import { describe, it, expect } from 'bun:test';
import { worldCapitalsApp } from '../src/lib/framework/geoglobe/plugins/worldCapitalsApp';
import { worldTimeApp } from '../src/lib/framework/geoglobe/plugins/worldTimeApp';
import { configureLabelLayer, type LabelItem } from '../src/lib/features/map/globe/layers/labelLayer';

describe('World Cities Radiant Dots & Population-Scaled Visualization Suite (ADR 0069 / TDD)', () => {
  describe('1. labelLayer.ts custom dotRadius support', () => {
    it('accepts dotRadius in configureLabelLayer on mock Globe instance', () => {
      let passedDotRadiusFn: any = null;
      const mockGlobe = {
        labelsData: () => mockGlobe,
        labelLat: () => mockGlobe,
        labelLng: () => mockGlobe,
        labelText: () => mockGlobe,
        labelSize: () => mockGlobe,
        labelDotRadius: (fn: any) => {
          passedDotRadiusFn = fn;
          return mockGlobe;
        },
        labelColor: () => mockGlobe,
        labelAltitude: () => mockGlobe,
        labelResolution: () => mockGlobe,
        onLabelClick: () => mockGlobe,
        onLabelHover: () => mockGlobe,
      };

      const items: LabelItem[] = [
        { lat: 35.68, lng: 139.76, text: 'Tokyo • Jepang', dotRadius: 0.45 },
        { lat: 46.94, lng: 7.44, text: 'Bern • Swiss', dotRadius: 0.12 },
      ];

      configureLabelLayer(mockGlobe, items, null);
      expect(passedDotRadiusFn).toBeDefined();
      expect(passedDotRadiusFn(items[0])).toBe(0.45);
      expect(passedDotRadiusFn(items[1])).toBe(0.12);
    });
  });

  describe('2. worldCapitalsApp.ts 195+ Capitals Radiant Dots (globe.gl pattern)', () => {
    it('defines getCustomLabels on worldCapitalsApp', () => {
      expect(worldCapitalsApp.getCustomLabels).toBeDefined();
    });

    it('returns custom capital labels with population-proportional dotRadius and golden amber color', () => {
      const labels = worldCapitalsApp.getCustomLabels!({}, 'era', 'dark', 'IDN', undefined, 1.2);
      expect(labels.length).toBeGreaterThan(150);

      // Find Tokyo (large population) and Canberra/Bern (smaller population)
      const tokyo = labels.find((l) => l.text.includes('Tokyo'));
      const bern = labels.find((l) => l.text.includes('Bern'));

      expect(tokyo).toBeDefined();
      expect(tokyo!.lat).toBeCloseTo(35.68, 0.5);
      expect(tokyo!.lng).toBeCloseTo(139.76, 0.5);
      expect(tokyo!.dotRadius).toBeGreaterThan(0.20);
      expect(tokyo!.color).toMatch(/rgba\(245,\s*158,\s*11|#f59e0b/);

      if (bern) {
        expect(tokyo!.dotRadius!).toBeGreaterThan(bern.dotRadius!);
      }
    });

    it('includes dotRadius in getPinLabel for worldCapitalsApp', () => {
      const mockCountry: any = {
        iso3: 'IDN',
        countryName: 'Indonesia',
        capital: 'Jakarta',
      };
      const mockData: any = {
        capital: 'Jakarta',
        capitalCoordinates: { lat: -6.2, lng: 106.8 },
        capitalPopulation: 10562088,
      };

      const pinLabel = worldCapitalsApp.getPinLabel!(mockCountry, mockData, 'era');
      expect(pinLabel).toHaveProperty('dotRadius');
      expect((pinLabel as any).dotRadius).toBeGreaterThan(0.15);
    });
  });

  describe('3. worldTimeApp.ts Dynamic Solar Day/Night City Dots', () => {
    it('calculates population-scaled dotRadius in worldTimeApp.getCustomLabels', () => {
      const labels = worldTimeApp.getCustomLabels!({}, 'local_time', 'dark', 'IDN', undefined, 1.0);
      expect(labels.length).toBeGreaterThan(50);

      const tokyo = labels.find((l) => l.text === 'Tokyo');
      const reykjavik = labels.find((l) => l.text === 'Reykjavik');

      expect(tokyo).toBeDefined();
      expect(tokyo!.dotRadius).toBeDefined();
      expect(tokyo!.dotRadius).toBeGreaterThan(0.15);

      if (reykjavik) {
        expect(tokyo!.dotRadius!).toBeGreaterThan(reykjavik.dotRadius!);
      }
    });
  });
});
