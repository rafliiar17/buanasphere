import { describe, it, expect } from 'bun:test';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { 
  getCountryFlagTexture,
  createProceduralFlagMaterial,
  computeFeatureBounds,
  ISO_MAPPING 
} from '../src/lib/features/map/procedural-flags';
import { COUNTRY_CURRENCY_MAP } from '../src/lib/features/map/map-constants';

describe('Authentic Vector/Raster Flag Texture Engine Tests (SDLC)', () => {
  const flagsDir = join(import.meta.dir, '../public/flags');
  const geojsonPath = join(import.meta.dir, '../public/data/world-countries.geojson');
  const geojson = JSON.parse(readFileSync(geojsonPath, 'utf-8'));

  describe('Local Flag Image Assets Verification', () => {
    it('verifies all major sovereign flag images exist locally in public/flags/', () => {
      const sampleCodes = ['id', 'fr', 'dz', 'it', 'pt', 'es', 'de', 'ch', 'bn', 'us', 'br', 'jp', 'sa', 'eg', 'gb'];
      for (const iso2 of sampleCodes) {
        const filePath = join(flagsDir, `${iso2}.png`);
        expect(existsSync(filePath)).toBe(true);
      }
    });

    it('ensures high coverage of ISO_MAPPING across all countries in COUNTRY_CURRENCY_MAP', () => {
      let mappedCount = 0;
      for (const country of COUNTRY_CURRENCY_MAP) {
        const iso2 = ISO_MAPPING[country.iso3];
        if (iso2) {
          mappedCount++;
          const pngPath = join(flagsDir, `${iso2}.png`);
          expect(existsSync(pngPath)).toBe(true);
        }
      }
      expect(mappedCount).toBeGreaterThanOrEqual(160);
    });
  });

  describe('ShaderMaterial Texture Generation', () => {
    it('creates a textured ShaderMaterial for France (FRA / fr)', () => {
      const france = geojson.features.find((f: any) => f.properties.ADM0_A3 === 'FRA' || f.properties.ISO_A3 === 'FRA');
      const mat = createProceduralFlagMaterial(france, true);

      expect(mat).toBeDefined();
      expect(mat.type).toBe('ShaderMaterial');
      expect(mat.uniforms.flagTexture).toBeDefined();
      expect(mat.uniforms.minLon.value).toBeLessThan(0);
      expect(mat.uniforms.maxLon.value).toBeGreaterThan(5);
    });

    it('creates a textured ShaderMaterial for Algeria (DZA / dz)', () => {
      const algeria = geojson.features.find((f: any) => f.properties.ADM0_A3 === 'DZA' || f.properties.ISO_A3 === 'DZA');
      const mat = createProceduralFlagMaterial(algeria, true);

      expect(mat).toBeDefined();
      expect(mat.type).toBe('ShaderMaterial');
      expect(mat.uniforms.flagTexture).toBeDefined();
    });

    it('creates a textured ShaderMaterial for Portugal (PRT / pt)', () => {
      const portugal = geojson.features.find((f: any) => f.properties.ADM0_A3 === 'PRT' || f.properties.ISO_A3 === 'PRT');
      const mat = createProceduralFlagMaterial(portugal, true);

      expect(mat).toBeDefined();
      expect(mat.type).toBe('ShaderMaterial');
      expect(mat.uniforms.flagTexture).toBeDefined();
    });

    it('creates a textured ShaderMaterial for Brunei Darussalam (BRN / bn)', () => {
      const brunei = geojson.features.find((f: any) => f.properties.ADM0_A3 === 'BRN' || f.properties.ISO_A3 === 'BRN');
      const mat = createProceduralFlagMaterial(brunei, true);

      expect(mat).toBeDefined();
      expect(mat.type).toBe('ShaderMaterial');
      expect(mat.uniforms.flagTexture).toBeDefined();
    });
  });
});
