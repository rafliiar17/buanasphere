import { describe, it, expect, beforeEach } from 'bun:test';
import { 
  FLAG_PATTERNS, 
  getFlagPattern, 
  computeFeatureBounds,
  createProceduralFlagMaterial,
  disposeProceduralFlagCache,
} from '../src/lib/features/map/procedural-flags';

describe('Procedural Flag Vexillological Engine Unit Tests (TDD)', () => {
  beforeEach(() => {
    disposeProceduralFlagCache();
  });
  describe('Country Pattern Archetype Mapping', () => {
    it('maps France (FRA) to vertical-tricolor with Blue, White, Red', () => {
      const p = getFlagPattern('FRA');
      expect(p.type).toBe('vertical-tricolor');
      expect(p.colors).toEqual(['#1d4ed8', '#ffffff', '#dc2626']);
    });

    it('maps Chad (TCD) to vertical-tricolor with Blue, Yellow, Red', () => {
      const p = getFlagPattern('TCD');
      expect(p.type).toBe('vertical-tricolor');
      expect(p.colors).toEqual(['#1d4ed8', '#eab308', '#dc2626']);
    });

    it('maps Indonesia (IDN) to horizontal-bicolor with Red, White', () => {
      const p = getFlagPattern('IDN');
      expect(p.type).toBe('horizontal-bicolor');
      expect(p.colors).toEqual(['#dc2626', '#ffffff']);
    });

    it('maps Germany (DEU) to horizontal-tricolor with Black, Red, Gold', () => {
      const p = getFlagPattern('DEU');
      expect(p.type).toBe('horizontal-tricolor');
      expect(p.colors).toEqual(['#18181b', '#dc2626', '#d97706']);
    });

    it('maps Italy (ITA) to vertical-tricolor with Green, White, Red', () => {
      const p = getFlagPattern('ITA');
      expect(p.type).toBe('vertical-tricolor');
      expect(p.colors).toEqual(['#15803d', '#ffffff', '#dc2626']);
    });

    it('maps Japan (JPN) to circle-disc with White and Red Hinomaru', () => {
      const p = getFlagPattern('JPN');
      expect(p.type).toBe('circle-disc');
      expect(p.colors[0]).toBe('#ffffff');
      expect(p.colors[1]).toBe('#dc2626');
    });

    it('maps Sweden (SWE) to nordic-cross with Blue and Gold', () => {
      const p = getFlagPattern('SWE');
      expect(p.type).toBe('nordic-cross');
      expect(p.colors[0]).toBe('#0284c7');
      expect(p.colors[1]).toBe('#eab308');
    });

    it('maps Switzerland (CHE) to cross with Red and White', () => {
      const p = getFlagPattern('CHE');
      expect(p.type).toBe('cross');
      expect(p.colors[0]).toBe('#dc2626');
      expect(p.colors[1]).toBe('#ffffff');
    });

    it('maps USA to canton-stripes with Navy, Red, White', () => {
      const p = getFlagPattern('USA');
      expect(p.type).toBe('canton-stripes');
      expect(p.colors[0]).toBe('#1e3a8a');
    });

    it('maps Brazil (BRA) to diamond-emblem with Green, Gold, Blue', () => {
      const p = getFlagPattern('BRA');
      expect(p.type).toBe('diamond-emblem');
      expect(p.colors).toEqual(['#15803d', '#eab308', '#1e40af']);
    });
  });

  describe('Procedural WebGL ShaderMaterial Generation', () => {
    it('creates valid ShaderMaterial with calculated bounds for France', () => {
      disposeProceduralFlagCache();
      const mockFranceFeature = {
        properties: { ISO_A3: 'FRA', NAME: 'France' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[-5.0, 42.0], [8.5, 42.0], [8.5, 51.0], [-5.0, 51.0], [-5.0, 42.0]]]
        }
      };

      const mat = createProceduralFlagMaterial(mockFranceFeature, true);
      expect(mat).toBeDefined();
      expect(mat.type).toBe('ShaderMaterial');
      expect(mat.uniforms.patternType.value).toBe(1); // vertical-tricolor
      expect(mat.uniforms.minLon.value).toBe(-5.0);
      expect(mat.uniforms.maxLon.value).toBe(8.5);
    });

    it('computes bounding coordinates for complex geometry safely', () => {
      const mockIndonesiaFeature = {
        properties: { ISO_A3: 'IDN' },
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [[[95.0, -11.0], [141.0, -11.0], [141.0, 6.0], [95.0, 6.0]]],
          ]
        }
      };

      const bounds = computeFeatureBounds(mockIndonesiaFeature);
      expect(bounds.minLon).toBe(95.0);
      expect(bounds.maxLon).toBe(141.0);
      expect(bounds.minLat).toBe(-11.0);
      expect(bounds.maxLat).toBe(6.0);
    });
  });
});
