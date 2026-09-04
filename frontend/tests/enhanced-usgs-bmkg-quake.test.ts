/**
 * Enhanced USGS FDSN Web Services & BMKG Open Data Suite (ADR 0073 / TDD)
 */

import { describe, it, expect } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Enhanced USGS FDSN & BMKG Quake Ingestion Suite (ADR 0073 / TDD)', () => {
  const servicePath = path.resolve(
    __dirname,
    '../src/lib/features/map/services/liveEarthquakeService.ts'
  );

  describe('1. BMKG autogempa.json Parser (parseBmkgAutoGempa)', () => {
    it('parses valid BMKG autogempa payload into enriched EarthquakeRecord', async () => {
      const { parseBmkgAutoGempa } = await import(
        '../src/lib/features/map/services/liveEarthquakeService'
      );

      const mockPayload = {
        Infogempa: {
          gempa: {
            Tanggal: '04 Sep 2026',
            Jam: '12:04:59 WIB',
            DateTime: '2026-09-04T05:04:59+00:00',
            Coordinates: '-8.42,109.02',
            Lintang: '8.42 LS',
            Bujur: '109.02 BT',
            Magnitude: '5.4',
            Kedalaman: '10 km',
            Wilayah: 'Pusat gempa berada di laut 77 km tenggara Cilacap',
            Potensi: 'Tidak berpotensi tsunami',
            Dirasakan: 'III Kebumen, III Bantul, III Cilacap, II Sleman',
            Shakemap: '20260904120459.mmi.jpg',
          },
        },
      };

      const record = parseBmkgAutoGempa(mockPayload);
      expect(record).not.toBeNull();
      expect(record?.lat).toBeCloseTo(-8.42, 2);
      expect(record?.lng).toBeCloseTo(109.02, 2);
      expect(record?.magnitude).toBe(5.4);
      expect(record?.depthKm).toBe(10);
      expect(record?.place).toBe('Pusat gempa berada di laut 77 km tenggara Cilacap');
      expect(record?.countryIso3).toBe('IDN');
      expect(record?.tsunamiWarning).toBe(false);
      expect(record?.dirasakanMmi).toContain('Kebumen');
      expect(record?.shakemapUrl).toContain('20260904120459.mmi.jpg');
    });

    it('detects tsunami warning in Potensi field', async () => {
      const { parseBmkgAutoGempa } = await import(
        '../src/lib/features/map/services/liveEarthquakeService'
      );

      const mockPayloadTsunami = {
        Infogempa: {
          gempa: {
            DateTime: '2026-09-04T06:00:00+00:00',
            Coordinates: '-9.10,110.50',
            Magnitude: '7.2',
            Kedalaman: '15 km',
            Wilayah: 'Pusat gempa di Samudera Hindia',
            Potensi: 'Peringatan Dini Tsunami untuk wilayah pesisir Jawa Selatan',
          },
        },
      };

      const record = parseBmkgAutoGempa(mockPayloadTsunami);
      expect(record).not.toBeNull();
      expect(record?.tsunamiWarning).toBe(true);
    });

    it('handles malformed or empty autogempa payload gracefully', async () => {
      const { parseBmkgAutoGempa } = await import(
        '../src/lib/features/map/services/liveEarthquakeService'
      );

      expect(parseBmkgAutoGempa(null)).toBeNull();
      expect(parseBmkgAutoGempa({})).toBeNull();
      expect(parseBmkgAutoGempa({ Infogempa: {} })).toBeNull();
    });
  });

  describe('2. BMKG gempadirasakan.json Parser (parseBmkgDirasakan)', () => {
    it('parses array of felt earthquakes accurately', async () => {
      const { parseBmkgDirasakan } = await import(
        '../src/lib/features/map/services/liveEarthquakeService'
      );

      const mockFeltPayload = {
        Infogempa: {
          gempa: [
            {
              Tanggal: '04 Sep 2026',
              Jam: '10:15:00 WIB',
              DateTime: '2026-09-04T03:15:00+00:00',
              Coordinates: '-7.15,107.55',
              Magnitude: '3.8',
              Kedalaman: '5 km',
              Wilayah: 'Pusat gempa di darat 15 km barat daya Kab. Bandung',
              Dirasakan: 'II-III Soreang, II Banjaran',
            },
            {
              Tanggal: '04 Sep 2026',
              Jam: '08:00:00 WIB',
              DateTime: '2026-09-04T01:00:00+00:00',
              Coordinates: '-2.45,140.70',
              Magnitude: '4.2',
              Kedalaman: '10 km',
              Wilayah: 'Pusat gempa di laut 20 km barat laut Kota Jayapura',
              Dirasakan: 'II Jayapura',
            },
          ],
        },
      };

      const records = parseBmkgDirasakan(mockFeltPayload);
      expect(records.length).toBe(2);
      expect(records[0].magnitude).toBe(3.8);
      expect(records[0].lat).toBeCloseTo(-7.15, 2);
      expect(records[0].lng).toBeCloseTo(107.55, 2);
      expect(records[0].countryIso3).toBe('IDN');
      expect(records[0].dirasakanMmi).toContain('Soreang');
    });
  });

  describe('3. USGS FDSN Web Services Query Endpoint (fetchUsgsCustomEvents)', () => {
    it('constructs query URL with dynamic parameters correctly', async () => {
      const { buildUsgsFdsnUrl } = await import(
        '../src/lib/features/map/services/liveEarthquakeService'
      );

      const url = buildUsgsFdsnUrl({
        minMagnitude: 5.5,
        limit: 25,
        orderBy: 'time',
      });

      expect(url).toContain('https://earthquake.usgs.gov/fdsnws/event/1/query');
      expect(url).toContain('format=geojson');
      expect(url).toContain('minmagnitude=5.5');
      expect(url).toContain('limit=25');
      expect(url).toContain('orderby=time');
    });

    it('fetches custom USGS FDSN events with offline fallback defense', async () => {
      const { fetchUsgsCustomEvents } = await import(
        '../src/lib/features/map/services/liveEarthquakeService'
      );

      // Test with failing custom fetch to verify fallback resilience
      const failingFetch = () => Promise.reject(new Error('Network error'));
      const fallbackEvents = await fetchUsgsCustomEvents({
        minMagnitude: 6.0,
        customFetch: failingFetch as any,
      });

      expect(Array.isArray(fallbackEvents)).toBe(true);
      expect(fallbackEvents.length).toBeGreaterThan(0);
    });
  });

  describe('4. Hybrid Live Feed & autogempa Integration', () => {
    it('returns latestAutoGempa in LiveEarthquakeResult', async () => {
      const { fetchLiveEarthquakes } = await import(
        '../src/lib/features/map/services/liveEarthquakeService'
      );

      const result = await fetchLiveEarthquakes({ forceRefresh: true });
      expect(result).toBeDefined();
      expect(Array.isArray(result.events)).toBe(true);
      expect(result.totalCount).toBeGreaterThan(0);
      expect(result).toHaveProperty('latestAutoGempa');
    });
  });

  describe('5. UI Components & Microapp Integration', () => {
    it('verifies QuakeBottomDock.svelte contains BMKG gempa mutakhir display logic', () => {
      const dockFile = path.resolve(
        __dirname,
        '../src/lib/apps/quake/QuakeBottomDock.svelte'
      );
      expect(fs.existsSync(dockFile)).toBe(true);
      const content = fs.readFileSync(dockFile, 'utf-8');
      expect(content).toContain('autogempa');
    });

    it('verifies QuakeControls.svelte supports magnitude and BMKG filter options', () => {
      const controlsFile = path.resolve(
        __dirname,
        '../src/lib/apps/quake/QuakeControls.svelte'
      );
      expect(fs.existsSync(controlsFile)).toBe(true);
      const content = fs.readFileSync(controlsFile, 'utf-8');
      expect(content).toContain('BMKG');
    });
  });
});
