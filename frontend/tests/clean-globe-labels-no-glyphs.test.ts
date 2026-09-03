import { describe, it, expect } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { sanitizeLabelText } from '../src/lib/features/map/globe/layers/labelLayer';
import { earthquakeApp } from '../src/lib/framework/geoglobe/plugins/earthquakeApp';
import { worldCapitalsApp } from '../src/lib/framework/geoglobe/plugins/worldCapitalsApp';
import { worldTimeApp } from '../src/lib/framework/geoglobe/plugins/worldTimeApp';
import { flowCorridorsApp } from '../src/lib/framework/geoglobe/plugins/flowCorridorsApp';
import { floraFaunaApp } from '../src/lib/framework/geoglobe/plugins/floraFaunaApp';

describe('Clean 3D Globe Typography & Complete Glyph Elimination Suite (ADR 0067)', () => {
  const dummyCountry: any = {
    iso3: 'CHN',
    countryName: 'Tiongkok',
    flagEmoji: '🇨🇳',
    capital: 'Beijing',
    currencyCode: 'CNY',
    utcOffset: 8,
    lat: 35.86,
    lng: 104.19,
  };

  describe('1. sanitizeLabelText Utility (labelLayer.ts)', () => {
    it('strips leading question marks and broken glyph artifacts', () => {
      expect(sanitizeLabelText('? Tiongkok (M5.2)')).toBe('Tiongkok (M5.2)');
      expect(sanitizeLabelText('?? Beijing • Tiongkok')).toBe('Beijing • Tiongkok');
      expect(sanitizeLabelText('??? Tokyo (JPY)')).toBe('Tokyo (JPY)');
    });

    it('strips emojis and pictographic symbols cleanly', () => {
      expect(sanitizeLabelText('⚡ Tiongkok (M5.2)')).toBe('Tiongkok (M5.2)');
      expect(sanitizeLabelText('🌋 Indonesia')).toBe('Indonesia');
      expect(sanitizeLabelText('✈️ Singapura')).toBe('Singapura');
      expect(sanitizeLabelText('🏛️ Athena • Yunani')).toBe('Athena • Yunani');
      expect(sanitizeLabelText('🇨🇳 Beijing • Tiongkok')).toBe('Beijing • Tiongkok');
      expect(sanitizeLabelText('Komodo 🦎 Indonesia')).toBe('Komodo Indonesia');
    });

    it('preserves valid alphanumeric text, parentheses, dots, commas, hyphens and accents', () => {
      expect(sanitizeLabelText('Jakarta (IDR)')).toBe('Jakarta (IDR)');
      expect(sanitizeLabelText('Washington, D.C.')).toBe('Washington, D.C.');
      expect(sanitizeLabelText('Port-au-Prince')).toBe('Port-au-Prince');
      expect(sanitizeLabelText('São Paulo')).toBe('São Paulo');
      expect(sanitizeLabelText('M5.2')).toBe('M5.2');
    });
  });

  describe('2. Plugin Pin Labels Pure Typography (No Arbitrary Icons)', () => {
    it('earthquakeApp.getPinLabel returns pure text without ⚡ or ? for recent events', () => {
      const mockData: any = {
        countryIso3: 'CHN',
        countryName: 'Tiongkok',
        recentEvents: [{ magnitude: 5.2, depthKm: 10, place: 'Sichuan', tsunamiWarning: false }],
        seismicRiskTier: 'high',
      };
      const label = earthquakeApp.getPinLabel(dummyCountry, mockData, 'magnitude');
      expect(label.text).toBe('Tiongkok (M5.2)');
      expect(label.text).not.toContain('⚡');
      expect(label.text).not.toContain('?');
      expect(label.shortText).toBe('M5.2');
    });

    it('earthquakeApp.getPinLabel returns pure country name without 🌋, ⚠️, 🛡️ when no events', () => {
      const mockData: any = {
        countryIso3: 'CHN',
        countryName: 'Tiongkok',
        recentEvents: [],
        seismicRiskTier: 'high',
      };
      const label = earthquakeApp.getPinLabel(dummyCountry, mockData, 'seismic_risk');
      expect(label.text).toBe('Tiongkok');
      expect(label.text).not.toMatch(/[🌋⚠️🛡️?]/);
    });

    it('worldCapitalsApp.getPinLabel returns pure text without flag emoji or 🏛️', () => {
      const capitalData: any = {
        capital: 'Beijing',
        countryIso3: 'CHN',
        capitalCoordinates: { lat: 39.9, lng: 116.4 },
      };
      const label = worldCapitalsApp.getPinLabel(dummyCountry, capitalData);
      expect(label.text).toBe('Beijing • Tiongkok');
      expect(label.text).not.toContain('🇨🇳');
      expect(label.text).not.toContain('🏛️');
      expect(label.text).not.toContain('?');
      expect(label.shortText).toBe('Beijing');
    });

    it('worldTimeApp.getPinLabel returns pure text without phase emojis', () => {
      const label = worldTimeApp.getPinLabel(dummyCountry, undefined, 'local_time');
      expect(label.text).not.toMatch(/[☀️🌙🌅🌆?]/);
      expect(label.shortText).not.toMatch(/[☀️🌙🌅🌆?]/);
    });

    it('flowCorridorsApp.getPinLabel returns pure text without ✈️', () => {
      const label = flowCorridorsApp.getPinLabel(dummyCountry);
      expect(label.text).not.toContain('✈️');
      expect(label.text).not.toContain('?');
    });

    it('floraFaunaApp.getPinLabel returns pure text without animal emojis', () => {
      const label = floraFaunaApp.getPinLabel(dummyCountry, undefined);
      expect(label.text).not.toMatch(/[\u{1F300}-\u{1FAFF}?]/u);
    });
  });

  describe('3. Globe3DView.svelte Default Labels (No Flag Emoji in WebGL Canvas)', () => {
    it('does not prepend flagEmoji in default country label text in Globe3DView.svelte', () => {
      const globeViewPath = path.resolve(__dirname, '../src/lib/features/map/components/Globe3DView.svelte');
      const content = fs.readFileSync(globeViewPath, 'utf-8');

      expect(content).not.toContain('spatial?.flagEmoji ?');
      expect(content).not.toContain('flagPart');
    });
  });
});
