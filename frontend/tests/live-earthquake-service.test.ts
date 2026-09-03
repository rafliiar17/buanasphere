import { describe, it, expect } from 'bun:test';
import {
  parseUsgsGeoJson,
  parseBmkgGempa,
  getLiveEarthquakeRings,
  fetchLiveEarthquakes,
  type LiveEarthquakeResult,
} from '../src/lib/features/map/services/liveEarthquakeService';

describe('Live Earthquake Service (USGS & BMKG Live Feed) Suite (ADR 0065 / TDD)', () => {
  describe('1. USGS GeoJSON Feed Parser (parseUsgsGeoJson)', () => {
    it('accurately parses USGS GeoJSON features into EarthquakeRecord objects', () => {
      const mockUsgs = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'us7000te21',
            properties: {
              mag: 5.2,
              place: '271 km SSE of Dunhuang, China',
              time: 1788455080769,
              tsunami: 0,
              url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us7000te21',
            },
            geometry: {
              type: 'Point',
              coordinates: [95.887, 37.954, 10.0], // [lng, lat, depth]
            },
          },
          {
            type: 'Feature',
            id: 'us7000te22',
            properties: {
              mag: 6.4,
              place: 'Off the coast of Miyagi, Japan',
              time: 1788456000000,
              tsunami: 1,
              url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us7000te22',
            },
            geometry: {
              type: 'Point',
              coordinates: [142.12, 38.35, 35.0],
            },
          },
        ],
      };

      const records = parseUsgsGeoJson(mockUsgs);

      expect(records.length).toBe(2);

      const chinaEq = records[0];
      expect(chinaEq.id).toBe('us7000te21');
      expect(chinaEq.magnitude).toBe(5.2);
      expect(chinaEq.lat).toBe(37.954);
      expect(chinaEq.lng).toBe(95.887);
      expect(chinaEq.depthKm).toBe(10.0);
      expect(chinaEq.place).toContain('Dunhuang, China');
      expect(chinaEq.tsunamiWarning).toBe(false);

      const japanEq = records[1];
      expect(japanEq.magnitude).toBe(6.4);
      expect(japanEq.tsunamiWarning).toBe(true);
    });

    it('handles empty or malformed USGS features gracefully', () => {
      expect(parseUsgsGeoJson(null as any)).toEqual([]);
      expect(parseUsgsGeoJson({} as any)).toEqual([]);
      expect(parseUsgsGeoJson({ features: [] })).toEqual([]);
    });
  });

  describe('2. BMKG Earthquake Feed Parser (parseBmkgGempa)', () => {
    it('accurately parses BMKG autogempa coordinates and metadata', () => {
      const mockBmkg = {
        Infogempa: {
          gempa: {
            Tanggal: '03 Sep 2026',
            Jam: '20:25:03 WIB',
            DateTime: '2026-09-03T13:25:03+00:00',
            Coordinates: '-8.19,120.52',
            Lintang: '8.19 LS',
            Bujur: '120.52 BT',
            Magnitude: '4.8',
            Kedalaman: '10 km',
            Wilayah: 'Pusat gempa berada di laut 47 km utara Ruteng - Manggarai',
            Potensi: 'Gempa ini dirasakan untuk diteruskan pada masyarakat',
            Dirasakan: 'II Kab. Manggarai',
          },
        },
      };

      const records = parseBmkgGempa(mockBmkg);

      expect(records.length).toBe(1);
      const eq = records[0];
      expect(eq.magnitude).toBe(4.8);
      expect(eq.lat).toBeCloseTo(-8.19, 2);
      expect(eq.lng).toBeCloseTo(120.52, 2);
      expect(eq.depthKm).toBe(10);
      expect(eq.place).toContain('Manggarai');
      expect(eq.source).toBe('BMKG');
    });
  });

  describe('3. 3D Seismic Wave Propagation Rings (getLiveEarthquakeRings)', () => {
    it('generates 3D Globe wave rings proportional to magnitude and danger level', () => {
      const records = [
        {
          id: 'eq1',
          lat: 10,
          lng: 100,
          magnitude: 4.6,
          depthKm: 10,
          timestamp: new Date().toISOString(),
          place: 'Test Light',
          tsunamiWarning: false,
          seismicRiskTier: 'moderate' as const,
          countryIso3: 'IDN',
        },
        {
          id: 'eq2',
          lat: 20,
          lng: 120,
          magnitude: 6.5,
          depthKm: 20,
          timestamp: new Date().toISOString(),
          place: 'Test Strong',
          tsunamiWarning: true,
          seismicRiskTier: 'high' as const,
          countryIso3: 'JPN',
        },
      ];

      const rings = getLiveEarthquakeRings(records);

      expect(rings.length).toBe(2);
      expect(rings[0].color).toBe('#eab308'); // M < 5 (kuning)
      expect(rings[1].color).toBe('#ef4444'); // M >= 6 (merah)
      expect(rings[1].maxRadius!).toBeGreaterThan(rings[0].maxRadius!);
    });
  });

  describe('4. Graceful Fallback & Resilience (fetchLiveEarthquakes)', () => {
    it('falls back to bundled local dataset if network fails without throwing', async () => {
      // Pass an invalid custom URL or failing fetch to simulate network loss
      const result = await fetchLiveEarthquakes({
        customFetch: (async () => {
          throw new Error('Network error / offline');
        }) as any,
      });

      expect(result).toBeDefined();
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.isLive).toBe(false);
      expect(result.source).toBe('fallback_bundled');
    });
  });
});
