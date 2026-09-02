import { describe, it, expect } from 'bun:test';
import { existsSync } from 'fs';
import { join } from 'path';
import { 
  getFlagPattern, 
  ISO_MAPPING,
  getCountryFlagTexture
} from '../src/lib/features/map/procedural-flags';
import { COUNTRY_CURRENCY_MAP } from '../src/lib/features/map/map-constants';

describe('Flag Accuracy & Specific Country Vexillological Tests (SDLC)', () => {
  const flagsDir = join(import.meta.dir, '../public/flags');

  describe('Specific Country ISO-2 Mapping & Local File Integrity', () => {
    it('verifies Australia (AUS) maps to au.png (Blue Ensign with Union Jack & Southern Cross)', () => {
      expect(ISO_MAPPING['AUS']).toBe('au');
      expect(existsSync(join(flagsDir, 'au.png'))).toBe(true);
    });

    it('verifies Israel (ISR) maps to il.png (White with Blue Stripes & Star of David)', () => {
      expect(ISO_MAPPING['ISR']).toBe('il');
      expect(existsSync(join(flagsDir, 'il.png'))).toBe(true);
    });

    it('verifies Greece (GRC) maps to gr.png (9 Blue-White Stripes & Cross Canton)', () => {
      expect(ISO_MAPPING['GRC']).toBe('gr');
      expect(existsSync(join(flagsDir, 'gr.png'))).toBe(true);
    });

    it('verifies Canada (CAN) maps to ca.png (Red, White with Maple Leaf, Red)', () => {
      expect(ISO_MAPPING['CAN']).toBe('ca');
      expect(existsSync(join(flagsDir, 'ca.png'))).toBe(true);
    });

    it('verifies New Zealand (NZL) maps to nz.png (Blue Ensign with 4 Red Stars)', () => {
      expect(ISO_MAPPING['NZL']).toBe('nz');
      expect(existsSync(join(flagsDir, 'nz.png'))).toBe(true);
    });

    it('verifies Indonesia (IDN) maps to id.png (Red and White)', () => {
      expect(ISO_MAPPING['IDN']).toBe('id');
      expect(existsSync(join(flagsDir, 'id.png'))).toBe(true);
    });
  });

  describe('Pattern Definitions Specificity', () => {
    it('ensures Australia pattern is Blue Ensign with Navy background and White/Red stars', () => {
      const pattern = getFlagPattern('AUS');
      expect(pattern.colors[0]).toBe('#00247d'); // Official Australian Navy Blue
      expect(pattern.type).not.toBe('canton-stripes'); // NOT Greek stripes!
    });

    it('ensures Israel pattern is White field with Blue stripes and Star of David', () => {
      const pattern = getFlagPattern('ISR');
      expect(pattern.colors[0]).toBe('#ffffff'); // White field
      expect(pattern.colors[1]).toBe('#0038b8'); // Star of David Blue
    });

    it('ensures Canada pattern is vertical-tricolor with Red-White-Red', () => {
      const pattern = getFlagPattern('CAN');
      expect(pattern.colors[0]).toBe('#dc2626');
      expect(pattern.colors[1]).toBe('#ffffff');
      expect(pattern.colors[2]).toBe('#dc2626');
    });
  });
});
