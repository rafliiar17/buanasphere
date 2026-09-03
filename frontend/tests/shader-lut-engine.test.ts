import { describe, it, expect } from 'bun:test';
import { 
  buildCountryIdMapping, 
  createPaletteLutBuffer, 
  updatePaletteLutSlot, 
  pickCountryFromUv, 
  type CountryIdMapping 
} from '../src/lib/features/map/shader-lut/countryLutEngine';
import { GLOBE_LUT_VERTEX_SHADER, GLOBE_LUT_FRAGMENT_SHADER } from '../src/lib/features/map/shader-lut/globeShaders';
import { EXTENDED_COUNTRIES_DATA } from '../src/lib/framework/geoglobe/countrySpatialData';

describe('GPU Shader-LUT Single-Sphere 3D Globe Engine Suite (ADR 0038 / TDD)', () => {

  describe('1. Country-to-Integer ID Mapping (buildCountryIdMapping)', () => {
    it('generates unique integer IDs (1..255) for all sovereign countries with 0 reserved for Ocean', () => {
      const mapping = buildCountryIdMapping(EXTENDED_COUNTRIES_DATA);
      
      expect(mapping.oceanId).toBe(0);
      expect(mapping.totalCountries).toBeGreaterThanOrEqual(100);
      expect(mapping.totalCountries).toBeLessThan(256); // Must fit in 8-bit color channel

      // Check key countries
      expect(mapping.iso3ToId['IDN']).toBeGreaterThan(0);
      expect(mapping.iso3ToId['USA']).toBeGreaterThan(0);
      expect(mapping.iso3ToId['JPN']).toBeGreaterThan(0);
      expect(mapping.iso3ToId['SGP']).toBeGreaterThan(0);

      // Verify reverse lookup consistency
      const idnId = mapping.iso3ToId['IDN'];
      expect(mapping.idToIso3[idnId]).toBe('IDN');

      const usaId = mapping.iso3ToId['USA'];
      expect(mapping.idToIso3[usaId]).toBe('USA');
    });

    it('handles unknown countries gracefully by returning ocean ID (0)', () => {
      const mapping = buildCountryIdMapping(EXTENDED_COUNTRIES_DATA);
      expect(mapping.iso3ToId['UNKNOWN_XYZ'] || 0).toBe(0);
      expect(mapping.idToIso3[999]).toBeUndefined();
    });
  });

  describe('2. 1D Palette LUT Buffer (createPaletteLutBuffer & updatePaletteLutSlot)', () => {
    it('creates a 256x4 (1024 bytes) Uint8Array palette texture buffer', () => {
      const lut = createPaletteLutBuffer('#0B0F19');
      expect(lut.length).toBe(256 * 4); // 1024 bytes

      // Ocean color in slot 0 (hex #0B0F19 -> r:11, g:15, b:25, a:255)
      expect(lut[0]).toBe(11);
      expect(lut[1]).toBe(15);
      expect(lut[2]).toBe(25);
      expect(lut[3]).toBe(255);
    });

    it('updates specific country palette slots cleanly without affecting other slots', () => {
      const lut = createPaletteLutBuffer('#0B0F19');
      const targetId = 42;

      // Update slot 42 with vibrant emerald RGBA [16, 185, 129, 230]
      updatePaletteLutSlot(lut, targetId, [16, 185, 129, 230]);

      const baseIdx = targetId * 4;
      expect(lut[baseIdx + 0]).toBe(16);
      expect(lut[baseIdx + 1]).toBe(185);
      expect(lut[baseIdx + 2]).toBe(129);
      expect(lut[baseIdx + 3]).toBe(230);

      // Ocean slot should remain untouched
      expect(lut[0]).toBe(11);
      expect(lut[1]).toBe(15);
    });
  });

  describe('3. UV-to-Country Instant Picking Math (pickCountryFromUv)', () => {
    it('accurately resolves UV coordinate to country ID and ISO-3 using in-memory ID buffer', () => {
      const width = 100;
      const height = 50;
      const buffer = new Uint8Array(width * height);

      // Place Indonesia (ID 17) at coordinate (x: 80, y: 25)
      const targetX = 80;
      const targetY = 25;
      buffer[targetY * width + targetX] = 17;

      const mapping: CountryIdMapping = {
        iso3ToId: { IDN: 17 },
        idToIso3: { 17: 'IDN' },
        oceanId: 0,
        totalCountries: 1,
      };

      // UV corresponding to targetX, targetY:
      // u = x / width, v = 1 - y / height
      const u = (targetX + 0.5) / width;
      const v = 1 - (targetY + 0.5) / height;

      const picked = pickCountryFromUv(u, v, buffer, width, height, mapping);
      expect(picked.countryId).toBe(17);
      expect(picked.iso3).toBe('IDN');
    });

    it('returns ocean ID (0) and null iso3 when UV points to ocean', () => {
      const width = 50;
      const height = 50;
      const buffer = new Uint8Array(width * height); // all 0 (ocean)

      const mapping: CountryIdMapping = {
        iso3ToId: { IDN: 1 },
        idToIso3: { 1: 'IDN' },
        oceanId: 0,
        totalCountries: 1,
      };

      const picked = pickCountryFromUv(0.1, 0.1, buffer, width, height, mapping);
      expect(picked.countryId).toBe(0);
      expect(picked.iso3).toBeNull();
    });
  });

  describe('4. Custom Three.js GLSL Shaders Structure (globeShaders)', () => {
    it('declares necessary uniforms and varying UVs in vertex shader', () => {
      expect(GLOBE_LUT_VERTEX_SHADER).toContain('varying vec2 vUv;');
      expect(GLOBE_LUT_VERTEX_SHADER).toContain('varying vec3 vNormal;');
      expect(GLOBE_LUT_VERTEX_SHADER).toContain('gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);');
    });

    it('declares country ID texture, palette LUT, and hover/selection uniforms in fragment shader', () => {
      expect(GLOBE_LUT_FRAGMENT_SHADER).toContain('uniform sampler2D uCountryIdMap;');
      expect(GLOBE_LUT_FRAGMENT_SHADER).toContain('uniform sampler2D uPaletteLut;');
      expect(GLOBE_LUT_FRAGMENT_SHADER).toContain('uniform float uHoveredId;');
      expect(GLOBE_LUT_FRAGMENT_SHADER).toContain('uniform float uSelectedId;');
      expect(GLOBE_LUT_FRAGMENT_SHADER).toContain('texture2D(uCountryIdMap, vUv)');
      expect(GLOBE_LUT_FRAGMENT_SHADER).toContain('texture2D(uPaletteLut,');
    });
  });
});
