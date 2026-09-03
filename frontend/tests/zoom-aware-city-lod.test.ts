import { describe, it, expect } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { WORLD_CITIES_TIME } from '../src/lib/framework/geoglobe/data/worldCitiesTimeData';

const globeViewPath = path.resolve(__dirname, '../src/lib/features/map/components/Globe3DView.svelte');

describe('Zoom-Aware City Level-of-Detail (LOD) Filtering in TimeWorld (ADR 0056 / TDD)', () => {

  describe('1. worldTimeApp.getCustomLabels Zoom Filtering Logic', () => {
    it('returns only major hubs when zoomed out far (altitude > 1.4) without country selection', async () => {
      const { worldTimeApp } = await import('../src/lib/framework/geoglobe/plugins/worldTimeApp');
      
      // Far zoom altitude = 2.2 (default globe POV)
      const labels = worldTimeApp.getCustomLabels!({}, 'diurnal_cycle', 'dark', undefined, undefined, 2.2);

      // Should return significantly fewer cities than total (around 25-40 hubs instead of 120+)
      expect(labels.length).toBeLessThan(50);
      expect(labels.length).toBeGreaterThanOrEqual(20);

      const cityNames = labels.map((l: any) => l.text);

      // Major hubs MUST be present
      expect(cityNames).toContain('Jakarta');
      expect(cityNames).toContain('Tokyo');
      expect(cityNames).toContain('London');
      expect(cityNames).toContain('New York');
      expect(cityNames).toContain('Singapura');
      expect(cityNames).toContain('Sydney');

      // Non-major regional cities MUST NOT be present at far zoom
      expect(cityNames).not.toContain('Banda Aceh');
      expect(cityNames).not.toContain('Pekanbaru');
      expect(cityNames).not.toContain('Semarang');
      expect(cityNames).not.toContain('Chiang Mai');
    });

    it('returns all cities of selected country even when zoomed out far (altitude > 1.4)', async () => {
      const { worldTimeApp } = await import('../src/lib/framework/geoglobe/plugins/worldTimeApp');
      
      // Far zoom altitude = 2.2 with Indonesia selected ('IDN')
      const labels = worldTimeApp.getCustomLabels!({}, 'diurnal_cycle', 'dark', 'IDN', undefined, 2.2);

      const cityNames = labels.map((l: any) => l.text);

      // Global hubs are present
      expect(cityNames).toContain('Tokyo');
      expect(cityNames).toContain('London');

      // AND all Indonesian regional cities are present for selected country!
      expect(cityNames).toContain('Jakarta');
      expect(cityNames).toContain('Banda Aceh');
      expect(cityNames).toContain('Medan');
      expect(cityNames).toContain('Semarang');
      expect(cityNames).toContain('Surabaya');
      expect(cityNames).toContain('Jayapura');
    });

    it('returns all 120+ cities in full detail when zoomed in (altitude <= 1.4)', async () => {
      const { worldTimeApp } = await import('../src/lib/framework/geoglobe/plugins/worldTimeApp');
      
      // Close zoom altitude = 0.8
      const labels = worldTimeApp.getCustomLabels!({}, 'diurnal_cycle', 'dark', undefined, undefined, 0.8);

      expect(labels.length).toBeGreaterThanOrEqual(110);

      const cityNames = labels.map((l: any) => l.text);
      expect(cityNames).toContain('Jakarta');
      expect(cityNames).toContain('Banda Aceh');
      expect(cityNames).toContain('Pekanbaru');
      expect(cityNames).toContain('Semarang');
      expect(cityNames).toContain('Chiang Mai');
      expect(cityNames).toContain('Busan');
      expect(cityNames).toContain('Osaka');
    });

    it('ensures all returned labels are clean pure city names without ??, colons, or bullet points', async () => {
      const { worldTimeApp } = await import('../src/lib/framework/geoglobe/plugins/worldTimeApp');
      const labels = worldTimeApp.getCustomLabels!({}, 'diurnal_cycle', 'dark', undefined, undefined, 0.8);

      for (const label of labels) {
        expect(label.text).not.toContain('??');
        expect(label.text).not.toMatch(/[0-9]{2}:[0-9]{2}/);
        expect(label.text).not.toContain('•');
        expect(label.shortText).toBe(label.text);
      }
    });
  });

  describe('2. Globe3DView.svelte Integration', () => {
    it('passes cameraAltitude to activeApp.getCustomLabels in Globe3DView.svelte', () => {
      const content = fs.readFileSync(globeViewPath, 'utf-8');
      expect(content).toMatch(/getCustomLabels\([^)]*cameraAltitude/);
    });
  });
});
