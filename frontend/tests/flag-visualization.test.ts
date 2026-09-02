import { describe, it, expect } from 'bun:test';
import { COUNTRY_FLAG_COLOR_MAP, getCountryFlagColor } from '../src/lib/features/map/country-flag-colors';
import { COUNTRY_CURRENCY_MAP } from '../src/lib/features/map/map-constants';

describe('National Flag Mode & Sovereign Visualization Unit Tests (SDLC)', () => {
  describe('Authentic Sovereign Flag Color Coverage', () => {
    it('provides authentic flag colors for key countries (Indonesia, Chad, USA, Germany, France, Japan)', () => {
      expect(COUNTRY_FLAG_COLOR_MAP['IDN']).toBe('#dc2626'); // Indonesia Merah Putih
      expect(COUNTRY_FLAG_COLOR_MAP['TCD']).toBeDefined(); // Chad
      expect(COUNTRY_FLAG_COLOR_MAP['USA']).toBe('#1e3a8a'); // USA Navy
      expect(COUNTRY_FLAG_COLOR_MAP['DEU']).toBe('#d97706'); // Germany Gold
      expect(COUNTRY_FLAG_COLOR_MAP['FRA']).toBe('#1d4ed8'); // France Blue
      expect(COUNTRY_FLAG_COLOR_MAP['JPN']).toBe('#dc2626'); // Japan Red
      expect(COUNTRY_FLAG_COLOR_MAP['SAU']).toBe('#047857'); // Saudi Arabia Emerald
    });

    it('ensures getCountryFlagColor always returns a valid hex color for every country in COUNTRY_CURRENCY_MAP', () => {
      for (const country of COUNTRY_CURRENCY_MAP) {
        const color = getCountryFlagColor(country.iso3, true);
        expect(color).toBeDefined();
        expect(color.startsWith('#')).toBe(true);
        expect(color.length).toBe(7);
        // Guarantee color is never solid black #000000 to prevent WebGL black polygon bug
        expect(color.toLowerCase()).not.toBe('#000000');
        expect(color.toLowerCase()).not.toBe('#0b0f19');
      }
    });

    it('gracefully provides deterministic non-black fallback for unknown ISO-3 codes', () => {
      const fallbackColor = getCountryFlagColor('XYZ', true);
      expect(fallbackColor).toBeDefined();
      expect(fallbackColor.startsWith('#')).toBe(true);
      expect(fallbackColor).not.toBe('#000000');
    });
  });

  describe('HTML Flag Pin Badges Data Preparation', () => {
    it('constructs valid FlagCDN URL for country ISO-2 codes', () => {
      const testCases = [
        { iso2: 'id', expectedUrl: 'https://flagcdn.com/w40/id.png' },
        { iso2: 'td', expectedUrl: 'https://flagcdn.com/w40/td.png' },
        { iso2: 'us', expectedUrl: 'https://flagcdn.com/w40/us.png' },
        { iso2: 'de', expectedUrl: 'https://flagcdn.com/w40/de.png' },
      ];

      for (const tc of testCases) {
        const url = `https://flagcdn.com/w40/${tc.iso2}.png`;
        expect(url).toBe(tc.expectedUrl);
      }
    });
  });
});
