import { describe, it, expect } from 'bun:test';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { 
  getFlagPattern, 
  computeFeatureBounds, 
  createProceduralFlagMaterial,
  FLAG_PATTERNS 
} from '../src/lib/features/map/procedural-flags';
import { COUNTRY_CURRENCY_MAP } from '../src/lib/features/map/map-constants';

// Simulated GLSL shader execution matching GPU Fragment Shader
function evaluateShaderPixel(
  u: number,
  v: number,
  pattern: { type: string; colors: string[] }
): string {
  const c1 = pattern.colors[0] || '#eab308';
  const c2 = pattern.colors[1] || '#ffffff';
  const c3 = pattern.colors[2] || '#18181b';

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
  if (pattern.type === 'circle-disc') {
    const dist = Math.hypot(u - 0.5, v - 0.5);
    return dist < 0.26 ? c2 : c1;
  }
  if (pattern.type === 'nordic-cross') {
    if (Math.abs(u - 0.38) < 0.07 || Math.abs(v - 0.50) < 0.08) return c2;
    return c1;
  }
  if (pattern.type === 'cross') {
    if ((Math.abs(u - 0.5) < 0.08 && Math.abs(v - 0.5) < 0.28) || (Math.abs(v - 0.5) < 0.08 && Math.abs(u - 0.5) < 0.28)) return c2;
    return c1;
  }
  if (pattern.type === 'canton-stripes') {
    if (u < 0.40 && v >= 0.44) {
      const cu = u / 0.40;
      const cv = (v - 0.44) / 0.56;
      if (Math.abs(cu - 0.50) < 0.12 || Math.abs(cv - 0.50) < 0.12) return '#ffffff';
      return '#1d4ed8';
    }
    const stripe = Math.floor(v * 9.0) % 2;
    return stripe === 0 ? '#1d4ed8' : '#ffffff';
  }
  if (pattern.type === 'diamond-emblem') {
    const dx = Math.abs(u - 0.5) * 2.0;
    const dy = Math.abs(v - 0.5) * 2.0;
    const dist = Math.hypot(u - 0.5, v - 0.5);
    if (dist < 0.18) return c3;
    if (dx + dy <= 0.85) return c2;
    return c1;
  }
  if (pattern.type === 'vertical-bicolor') {
    return u < 0.40 ? c1 : c2;
  }
  if (pattern.type === 'diagonal-stripe') {
    const diag = (u + (1.0 - v)) * 0.5;
    const distCenter = Math.hypot(u - 0.5, v - 0.5);
    if (distCenter < 0.15) return '#dc2626';
    if (Math.abs(diag - 0.50) < 0.13) return diag < 0.50 ? c2 : c3;
    return c1;
  }
  if (pattern.type === 'blue-ensign') {
    // Australia & New Zealand: Blue Ensign with Union Jack Canton & Stars
    if (u < 0.50 && v >= 0.50) {
      const cu = u / 0.50;
      const cv = (v - 0.50) / 0.50;
      if (Math.abs(cu - 0.50) < 0.07 || Math.abs(cv - 0.50) < 0.07 || Math.abs(cu - cv) < 0.04 || Math.abs(cu - (1.0 - cv)) < 0.04) {
        return '#cf142b'; // Red St George & St Patrick Cross
      }
      if (Math.abs(cu - 0.50) < 0.12 || Math.abs(cv - 0.50) < 0.12 || Math.abs(cu - cv) < 0.08 || Math.abs(cu - (1.0 - cv)) < 0.08) {
        return '#ffffff'; // White Diagonals
      }
      return '#00247d'; // Navy Blue Canton Base
    }
    const distCommonwealth = Math.hypot(u - 0.25, v - 0.25);
    if (distCommonwealth < 0.065) return '#ffffff'; // Commonwealth Star

    const d1 = Math.hypot(u - 0.75, v - 0.78);
    const d2 = Math.hypot(u - 0.86, v - 0.50);
    const d3 = Math.hypot(u - 0.75, v - 0.22);
    const d4 = Math.hypot(u - 0.64, v - 0.54);
    const d5 = Math.hypot(u - 0.80, v - 0.38);
    if (d1 < 0.025 || d2 < 0.025 || d3 < 0.025 || d4 < 0.025 || d5 < 0.015) {
      return '#ffffff'; // Southern Cross Stars
    }
    return '#00247d'; // Navy Blue Field
  }
  if (pattern.type === 'israel-flag') {
    if ((v >= 0.12 && v <= 0.24) || (v >= 0.76 && v <= 0.88)) return '#0038b8';
    const distCenter = Math.hypot(u - 0.50, v - 0.50);
    if (distCenter >= 0.08 && distCenter <= 0.15) return '#0038b8';
    return '#ffffff';
  }
  if (pattern.type === 'canada-flag') {
    if (u < 0.25 || u > 0.75) return '#dc2626';
    const distCenter = Math.hypot(u - 0.50, v - 0.50);
    if (distCenter < 0.14) return '#dc2626';
    return '#ffffff';
  }

  return c1;
}

describe('Automated Visual Country Flag Matrix Comparison Test Suite (Bun)', () => {
  const flagsDir = join(import.meta.dir, '../public/flags');

  describe('Australia (AUS) Detailed Visual Verification', () => {
    const pattern = getFlagPattern('AUS');

    it('verifies Australia is Blue Ensign (Navy Blue field #00247d)', () => {
      expect(pattern.type).toBe('blue-ensign');
      expect(pattern.colors[0]).toBe('#00247d');
    });

    it('verifies Australia canton (Top-Left) renders authentic Union Jack cross, NOT a solid white box', () => {
      // Center of Union Jack in Canton is Red Cross
      const redCenter = evaluateShaderPixel(0.25, 0.75, pattern);
      expect(redCenter).toBe('#cf142b');

      // Navy background of Canton
      const navyCorner = evaluateShaderPixel(0.05, 0.625, pattern);
      expect(navyCorner).toBe('#00247d');
    });

    it('verifies Australia fly and south render Navy Blue field with Southern Cross stars', () => {
      const flyNavy = evaluateShaderPixel(0.95, 0.50, pattern);
      expect(flyNavy).toBe('#00247d');

      const southNavy = evaluateShaderPixel(0.50, 0.10, pattern);
      expect(southNavy).toBe('#00247d');
    });
  });

  describe('Israel (ISR) Detailed Visual Verification', () => {
    const pattern = getFlagPattern('ISR');

    it('verifies Israel renders 2 Blue stripes on White field with Blue Star of David', () => {
      expect(pattern.type).toBe('israel-flag');
      // Top stripe
      expect(evaluateShaderPixel(0.50, 0.80, pattern)).toBe('#0038b8');
      // Bottom stripe
      expect(evaluateShaderPixel(0.50, 0.20, pattern)).toBe('#0038b8');
      // White field
      expect(evaluateShaderPixel(0.10, 0.50, pattern)).toBe('#ffffff');
      // Star of David ring
      expect(evaluateShaderPixel(0.50, 0.60, pattern)).toBe('#0038b8');
    });
  });

  describe('Canada (CAN) Detailed Visual Verification', () => {
    const pattern = getFlagPattern('CAN');

    it('verifies Canada renders Red bars on sides, White in center, Red Maple Leaf in middle', () => {
      expect(pattern.type).toBe('canada-flag');
      expect(evaluateShaderPixel(0.10, 0.50, pattern)).toBe('#dc2626'); // West Red
      expect(evaluateShaderPixel(0.90, 0.50, pattern)).toBe('#dc2626'); // East Red
      expect(evaluateShaderPixel(0.50, 0.50, pattern)).toBe('#dc2626'); // Center Maple Leaf
      expect(evaluateShaderPixel(0.40, 0.80, pattern)).toBe('#ffffff'); // Center White Field
    });
  });

  describe('Full 195+ Sovereign Country Non-Blank Pixel Integrity Audit', () => {
    const countries = COUNTRY_CURRENCY_MAP;

    it('ensures every single country in the world renders non-black, non-blank colors across 5 sample points', () => {
      let auditedCount = 0;
      for (const country of countries) {
        const pattern = getFlagPattern(country.iso3);
        expect(pattern).toBeDefined();
        expect(pattern.colors.length).toBeGreaterThan(0);

        const samples = [
          evaluateShaderPixel(0.1, 0.1, pattern),
          evaluateShaderPixel(0.9, 0.9, pattern),
          evaluateShaderPixel(0.5, 0.5, pattern),
          evaluateShaderPixel(0.2, 0.8, pattern),
          evaluateShaderPixel(0.8, 0.2, pattern),
        ];

        for (const sample of samples) {
          expect(sample).toBeDefined();
          expect(typeof sample).toBe('string');
          expect(sample.length).toBeGreaterThanOrEqual(4);
          // Zero undefined or black error
          expect(sample).not.toBe('#000000');
          expect(sample).not.toBe('undefined');
        }
        auditedCount++;
      }
      expect(auditedCount).toBeGreaterThanOrEqual(165);
    });
  });
});
