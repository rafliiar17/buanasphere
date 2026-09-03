import { describe, it, expect } from 'bun:test';
import { worldTimeApp } from '../src/lib/framework/geoglobe/plugins/worldTimeApp';

describe('Indonesian Timezone Pillars LOD Hierarchy Suite (ADR 0070 / TDD)', () => {
  describe('1. Zoomed Out (Global Orbit View, alt = 2.2)', () => {
    it('renders exactly 3 primary timezone pillars for Indonesia (Jakarta, Denpasar, Jayapura)', () => {
      const labels = worldTimeApp.getCustomLabels!({}, 'local_time', 'dark', 'IDN', undefined, 2.2);

      const indoCities = labels.filter((l) => l.iso3 === 'IDN');
      expect(indoCities.length).toBe(3);

      const cityNames = indoCities.map((c) => c.text);
      expect(cityNames).toContain('Jakarta');
      expect(cityNames).toContain('Denpasar');
      expect(cityNames).toContain('Jayapura');

      // Secondary cities must NOT be rendered at this altitude
      expect(cityNames).not.toContain('Surabaya');
      expect(cityNames).not.toContain('Bandung');
      expect(cityNames).not.toContain('Medan');
      expect(cityNames).not.toContain('Balikpapan');
    });

    it('retains major international hubs when zoomed out', () => {
      const labels = worldTimeApp.getCustomLabels!({}, 'local_time', 'dark', 'IDN', undefined, 2.2);
      const cityNames = labels.map((c) => c.text);

      expect(cityNames).toContain('Tokyo');
      expect(cityNames).toContain('London');
      expect(cityNames).toContain('New York');
    });
  });

  describe('2. Zoomed In (Close Regional View, alt = 1.0)', () => {
    it('renders all 28 Indonesian cities in full detail when zoomed in close', () => {
      const labels = worldTimeApp.getCustomLabels!({}, 'local_time', 'dark', 'IDN', undefined, 1.0);

      const indoCities = labels.filter((l) => l.iso3 === 'IDN');
      expect(indoCities.length).toBe(28);

      const cityNames = indoCities.map((c) => c.text);
      expect(cityNames).toContain('Jakarta');
      expect(cityNames).toContain('Surabaya');
      expect(cityNames).toContain('Bandung');
      expect(cityNames).toContain('Medan');
      expect(cityNames).toContain('Denpasar');
      expect(cityNames).toContain('Makassar');
      expect(cityNames).toContain('Jayapura');
      expect(cityNames).toContain('Ambon');
      expect(cityNames).toContain('Merauke');
    });
  });
});
