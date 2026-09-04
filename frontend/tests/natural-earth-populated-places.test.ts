/**
 * Natural Earth 110m Populated Places GeoJSON Integration Test Suite (ADR 0072 / TDD)
 */

import { describe, it, expect } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Natural Earth 110m Populated Places GeoJSON Suite (ADR 0072 / TDD)', () => {
  const geoglobeDataDir = path.resolve(__dirname, '../src/lib/framework/geoglobe/data');
  const geojsonPath = path.join(geoglobeDataDir, 'ne_110m_populated_places_simple.geojson');

  describe('1. GeoJSON Dataset File Integrity', () => {
    it('verifies ne_110m_populated_places_simple.geojson exists and is valid GeoJSON', () => {
      expect(fs.existsSync(geojsonPath)).toBe(true);

      const raw = fs.readFileSync(geojsonPath, 'utf-8');
      const data = JSON.parse(raw);

      expect(data.type).toBe('FeatureCollection');
      expect(Array.isArray(data.features)).toBe(true);
      expect(data.features.length).toBe(243);

      // Verify geometry of first feature
      const f0 = data.features[0];
      expect(f0.type).toBe('Feature');
      expect(f0.geometry.type).toBe('Point');
      expect(Array.isArray(f0.geometry.coordinates)).toBe(true);
      expect(f0.geometry.coordinates.length).toBe(2);
    });
  });

  describe('2. Typed Loader Wrapper (populatedPlacesData.ts)', () => {
    it('loads and maps all 243 populated places accurately', async () => {
      const { getAllPopulatedPlaces } = await import(
        '../src/lib/framework/geoglobe/data/populatedPlacesData'
      );
      const places = getAllPopulatedPlaces();

      expect(places).toBeDefined();
      expect(places.length).toBe(243);

      // Test essential properties on Jakarta
      const jakarta = places.find((p) => p.name === 'Jakarta');
      expect(jakarta).toBeDefined();
      expect(jakarta?.countryIso3).toBe('IDN');
      expect(jakarta?.lat).toBeCloseTo(-6.18, 1);
      expect(jakarta?.lng).toBeCloseTo(106.83, 1);
      expect(jakarta?.isCapital).toBe(true);
      expect(jakarta?.popMax).toBeGreaterThan(5_000_000);

      // Test Tokyo
      const tokyo = places.find((p) => p.name === 'Tokyo');
      expect(tokyo).toBeDefined();
      expect(tokyo?.countryIso3).toBe('JPN');
      expect(tokyo?.isCapital).toBe(true);
      expect(tokyo?.isMegacity).toBe(true);
    });

    it('filters megacities correctly using getMegacities()', async () => {
      const { getMegacities } = await import(
        '../src/lib/framework/geoglobe/data/populatedPlacesData'
      );
      const megacities = getMegacities();

      expect(megacities.length).toBeGreaterThan(10);
      expect(megacities.every((m) => m.isMegacity || m.popMax >= 10_000_000)).toBe(true);

      const names = megacities.map((m) => m.name);
      expect(names).toContain('Tokyo');
      expect(names).toContain('Jakarta');
      expect(names).toContain('Shanghai');
      expect(names).toContain('Mumbai');
      expect(names).toContain('New York');
    });

    it('filters national capitals correctly using getCapitals()', async () => {
      const { getCapitals } = await import(
        '../src/lib/framework/geoglobe/data/populatedPlacesData'
      );
      const capitals = getCapitals();

      expect(capitals.length).toBeGreaterThan(100);
      expect(capitals.every((c) => c.isCapital)).toBe(true);

      const iso3s = capitals.map((c) => c.countryIso3);
      expect(iso3s).toContain('IDN');
      expect(iso3s).toContain('GBR');
      expect(iso3s).toContain('FRA');
      expect(iso3s).toContain('USA');
    });

    it('filters populated places by country ISO-3', async () => {
      const { getPopulatedPlacesByCountry } = await import(
        '../src/lib/framework/geoglobe/data/populatedPlacesData'
      );
      const idnPlaces = getPopulatedPlacesByCountry('IDN');

      expect(idnPlaces.length).toBeGreaterThanOrEqual(1);
      expect(idnPlaces.some((p) => p.name === 'Jakarta')).toBe(true);
    });

    it('supports camera-altitude LOD filtering with getPopulatedPlacesByLOD()', async () => {
      const { getPopulatedPlacesByLOD } = await import(
        '../src/lib/framework/geoglobe/data/populatedPlacesData'
      );

      const zoomedOut = getPopulatedPlacesByLOD(2.5); // Global orbit
      const zoomedIn = getPopulatedPlacesByLOD(0.6);  // Close regional zoom

      expect(zoomedOut.length).toBeLessThan(zoomedIn.length);
      expect(zoomedOut.length).toBeGreaterThanOrEqual(15);
      expect(zoomedIn.length).toBeGreaterThanOrEqual(100);
    });
  });

  describe('3. Microapp Integration (/population & Globe)', () => {
    it('integrates populated places megacity points into populationApp', async () => {
      const { populationApp } = await import(
        '../src/lib/framework/geoglobe/plugins/populationApp'
      );

      expect(populationApp.getCustomLabels).toBeDefined();

      if (populationApp.getCustomLabels) {
        const labels = populationApp.getCustomLabels({}, 'population_total', 'dark', undefined, undefined, 2.0);
        expect(Array.isArray(labels)).toBe(true);
        expect(labels.length).toBeGreaterThan(0);

        // Check that Tokyo or Jakarta is present as a megacity dot
        const hasMajorMegacity = labels.some(
          (l) => l.text?.includes('Tokyo') || l.text?.includes('Jakarta')
        );
        expect(hasMajorMegacity).toBe(true);
      }
    });
  });
});
