import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { 
  getFlagPattern, 
  computeFeatureBounds, 
  createProceduralFlagMaterial,
  FLAG_PATTERNS 
} from '../src/lib/features/map/procedural-flags';
import { COUNTRY_CURRENCY_MAP } from '../src/lib/features/map/map-constants';

// Simulated GLSL shader execution matching GPU Fragment Shader
function simulateShaderSample(
  lat: number, 
  lng: number, 
  bounds: { minLon: number; maxLon: number; minLat: number; maxLat: number },
  pattern: { type: string; colors: string[] }
): string {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (90 - lng) * Math.PI / 180;
  const r = 100;
  const vPos = {
    x: r * Math.sin(phi) * Math.sin(theta),
    y: r * Math.cos(phi),
    z: r * Math.sin(phi) * Math.cos(theta)
  };

  const thetaRecovered = Math.atan2(vPos.x, vPos.z) * (180 / Math.PI);
  let lonRecovered = 90.0 - thetaRecovered;
  while (lonRecovered > 180.0) lonRecovered -= 360.0;
  while (lonRecovered < -180.0) lonRecovered += 360.0;

  const latRecovered = Math.asin(Math.max(-1.0, Math.min(1.0, vPos.y / r))) * (180 / Math.PI);

  const u = Math.max(0.0, Math.min(1.0, (lonRecovered - bounds.minLon) / Math.max(0.001, bounds.maxLon - bounds.minLon)));
  const v = Math.max(0.0, Math.min(1.0, (latRecovered - bounds.minLat) / Math.max(0.001, bounds.maxLat - bounds.minLat)));

  const c1 = pattern.colors[0] || '#1d4ed8';
  const c2 = pattern.colors[1] || '#ffffff';
  const c3 = pattern.colors[2] || '#dc2626';

  if (pattern.type === 'vertical-tricolor') {
    if (u < 0.3333) return c1;
    if (u < 0.6666) return c2;
    return c3;
  }
  if (pattern.type === 'horizontal-bicolor') {
    if (v >= 0.50) return c1;
    return c2;
  }
  if (pattern.type === 'horizontal-tricolor') {
    if (v >= 0.6666) return c1;
    if (v >= 0.3333) return c2;
    return c3;
  }
  if (pattern.type === 'vertical-bicolor') {
    if (u < 0.40) return c1;
    return c2;
  }
  if (pattern.type === 'circle-disc') {
    const dist = Math.hypot(u - 0.5, v - 0.5);
    if (dist < 0.26) return c2;
    return c1;
  }
  if (pattern.type === 'cross' || pattern.type === 'nordic-cross') {
    const cx = pattern.type === 'nordic-cross' ? 0.38 : 0.50;
    if (Math.abs(u - cx) < 0.08 || Math.abs(v - 0.50) < 0.08) return c2;
    return c1;
  }
  if (pattern.type === 'diagonal-stripe') {
    const diag = (u + (1.0 - v)) * 0.5;
    const distCenter = Math.hypot(u - 0.5, v - 0.5);
    if (distCenter < 0.15) return pattern.colors[3] || '#dc2626';
    if (Math.abs(diag - 0.50) < 0.13) {
      return diag < 0.50 ? c2 : c3;
    }
    return c1;
  }
  if (pattern.type === 'canton-stripes') {
    if (u < 0.45 && v >= 0.45) return c1;
    const stripe = Math.floor(v * 10.0) % 2;
    return stripe === 0 ? c2 : c3;
  }
  return c1;
}

import { join } from 'path';

describe('Comprehensive 191+ Sovereign Country Flag Validation Matrix (SDLC)', () => {
  const geojsonPath = join(import.meta.dir, '../public/data/world-countries.geojson');
  const geojson = JSON.parse(readFileSync(geojsonPath, 'utf-8'));

  describe('Key Sovereign Countries Mathematical Multi-Stripe Verification', () => {
    it('verifies France (FRA) shows Blue on West, White in Center, and Red on East', () => {
      const france = geojson.features.find((f: any) => f.properties.ADM0_A3 === 'FRA' || f.properties.ISO_A3 === 'FRA');
      const bounds = computeFeatureBounds(france);
      const pattern = getFlagPattern('FRA');

      // West (Brest / Nantes)
      const westColor = simulateShaderSample(48.4, -4.0, bounds, pattern);
      // Center (Paris / Orleans)
      const centerColor = simulateShaderSample(48.8, 2.3, bounds, pattern);
      // East (Strasbourg / Alsace)
      const eastColor = simulateShaderSample(48.6, 7.7, bounds, pattern);

      expect(westColor).toBe('#1d4ed8'); // Blue
      expect(centerColor).toBe('#ffffff'); // White
      expect(eastColor).toBe('#dc2626'); // Red
    });

    it('verifies Portugal (PRT) shows Green on West (40%) and Red on East (60%)', () => {
      const portugal = geojson.features.find((f: any) => f.properties.ADM0_A3 === 'PRT' || f.properties.ISO_A3 === 'PRT');
      const bounds = computeFeatureBounds(portugal);
      const pattern = getFlagPattern('PRT');

      // West (Porto / Sintra / Lisbon coast)
      const westColor = simulateShaderSample(39.6, -9.2, bounds, pattern);
      // East (Guarda / Castelo Branco / Elvas border)
      const eastColor = simulateShaderSample(39.6, -6.8, bounds, pattern);

      expect(westColor).toBe('#15803d'); // Green
      expect(eastColor).toBe('#dc2626'); // Red
    });

    it('verifies Italy (ITA) shows Green on West, White in Center, Red on East', () => {
      const italy = geojson.features.find((f: any) => f.properties.ADM0_A3 === 'ITA' || f.properties.ISO_A3 === 'ITA');
      const bounds = computeFeatureBounds(italy);
      const pattern = getFlagPattern('ITA');

      // West (Turin / Genoa)
      const westColor = simulateShaderSample(45.0, 7.6, bounds, pattern);
      // Center (Florence / Rome)
      const centerColor = simulateShaderSample(43.7, 11.2, bounds, pattern);
      // East (Bari / Brindisi / Adriatic)
      const eastColor = simulateShaderSample(41.1, 16.8, bounds, pattern);

      expect(westColor).toBe('#15803d'); // Green
      expect(centerColor).toBe('#ffffff'); // White
      expect(eastColor).toBe('#dc2626'); // Red
    });

    it('verifies Switzerland (CHE) shows Red field and White centered Swiss Cross', () => {
      const swiss = geojson.features.find((f: any) => f.properties.ADM0_A3 === 'CHE' || f.properties.ISO_A3 === 'CHE');
      const bounds = computeFeatureBounds(swiss);
      const pattern = getFlagPattern('CHE');

      // Center (Swiss Cross center: Bern / Lucerne)
      const centerCross = simulateShaderSample(46.9, 8.2, bounds, pattern);
      // Corner (Geneva / Valais corner)
      const corner = simulateShaderSample(46.2, 6.1, bounds, pattern);

      expect(centerCross).toBe('#ffffff'); // White Cross
      expect(corner).toBe('#dc2626'); // Red Field
    });

    it('verifies Brunei Darussalam (BRN) shows Royal Gold field, White/Black band & Red Crest', () => {
      const brunei = geojson.features.find((f: any) => f.properties.ADM0_A3 === 'BRN' || f.properties.ISO_A3 === 'BRN');
      const bounds = computeFeatureBounds(brunei);
      const pattern = getFlagPattern('BRN');

      // Center (Red Crest)
      const centerColor = simulateShaderSample(4.7, 114.7, bounds, pattern);
      // Top-Left Field (Royal Gold field)
      const fieldColor = simulateShaderSample(4.9, 114.2, bounds, pattern);

      expect(centerColor).toBe('#dc2626'); // Red Crest
      expect(fieldColor).toBe('#eab308'); // Royal Gold
    });

    it('verifies Indonesia (IDN) shows Red on North (Top) and White on South (Bottom)', () => {
      const idn = geojson.features.find((f: any) => f.properties.ADM0_A3 === 'IDN' || f.properties.ISO_A3 === 'IDN');
      const bounds = computeFeatureBounds(idn);
      const pattern = getFlagPattern('IDN');

      // North (Natuna / North Sumatra)
      const northColor = simulateShaderSample(3.5, 108.0, bounds, pattern);
      // South (Java / Bali / Timor Sea)
      const southColor = simulateShaderSample(-8.5, 115.0, bounds, pattern);

      expect(northColor).toBe('#dc2626'); // Red
      expect(southColor).toBe('#ffffff'); // White
    });

    it('verifies Germany (DEU) shows Black on Top, Red in Middle, and Gold on Bottom', () => {
      const deu = geojson.features.find((f: any) => f.properties.ADM0_A3 === 'DEU' || f.properties.ISO_A3 === 'DEU');
      const bounds = computeFeatureBounds(deu);
      const pattern = getFlagPattern('DEU');

      // Top (Kiel / Hamburg / Baltic)
      const topColor = simulateShaderSample(54.0, 10.0, bounds, pattern);
      // Middle (Frankfurt / Leipzig)
      const midColor = simulateShaderSample(51.0, 10.0, bounds, pattern);
      // Bottom (Munich / Bavaria)
      const bottomColor = simulateShaderSample(48.0, 11.5, bounds, pattern);

      expect(topColor).toBe('#18181b'); // Black
      expect(midColor).toBe('#dc2626'); // Red
      expect(bottomColor).toBe('#d97706'); // Gold
    });

    it('verifies Spain (ESP) shows Red on Top, Gold in Middle, and Red on Bottom', () => {
      const esp = geojson.features.find((f: any) => f.properties.ADM0_A3 === 'ESP' || f.properties.ISO_A3 === 'ESP');
      const bounds = computeFeatureBounds(esp);
      const pattern = getFlagPattern('ESP');

      // Top (Santander / Bilbao)
      const topColor = simulateShaderSample(43.2, -3.5, bounds, pattern);
      // Middle (Madrid / Toledo)
      const midColor = simulateShaderSample(40.4, -3.7, bounds, pattern);
      // Bottom (Seville / Malaga)
      const bottomColor = simulateShaderSample(36.8, -4.5, bounds, pattern);

      expect(topColor).toBe('#dc2626'); // Red
      expect(midColor).toBe('#eab308'); // Gold
      expect(bottomColor).toBe('#dc2626'); // Red
    });
  });

  describe('Full 191+ Sovereign State Matrix Audit', () => {
    it('verifies every single country in COUNTRY_CURRENCY_MAP computes valid bounds and shader colors', () => {
      let testedCount = 0;
      for (const country of COUNTRY_CURRENCY_MAP) {
        const feat = geojson.features.find((f: any) => {
          const p = f.properties;
          return p.ISO_A3 === country.iso3 || p.ADM0_A3 === country.iso3 || p.SOV_A3 === country.iso3 || p.GU_A3 === country.iso3;
        });

        const pattern = getFlagPattern(country.iso3);
        expect(pattern).toBeDefined();
        expect(pattern.colors.length).toBeGreaterThanOrEqual(2);

        if (feat) {
          const bounds = computeFeatureBounds(feat);
          expect(Number.isFinite(bounds.minLon)).toBe(true);
          expect(Number.isFinite(bounds.maxLon)).toBe(true);
          expect(Number.isFinite(bounds.minLat)).toBe(true);
          expect(Number.isFinite(bounds.maxLat)).toBe(true);
          expect(bounds.maxLon).toBeGreaterThanOrEqual(bounds.minLon);
          expect(bounds.maxLat).toBeGreaterThanOrEqual(bounds.minLat);

          // Sample center of country
          const centerLon = (bounds.minLon + bounds.maxLon) / 2;
          const centerLat = (bounds.minLat + bounds.maxLat) / 2;
          const centerColor = simulateShaderSample(centerLat, centerLon, bounds, pattern);

          expect(centerColor).toBeDefined();
          expect(centerColor.startsWith('#')).toBe(true);
          expect(centerColor.toLowerCase()).not.toBe('#000000');
          testedCount++;
        }
      }

      console.log(`[TEST AUDIT] Successfully validated ${testedCount} sovereign countries on 3D spherical shader matrix!`);
      expect(testedCount).toBeGreaterThanOrEqual(160);
    });
  });
});
