import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { createApp } from '../src/index.ts';
import { MicroappRegistry } from '../src/gateway/registry.ts';
import {
  quakeHandler,
  parseBmkgAutoGempa,
  parseBmkgDirasakan,
  parseUsgsGeoJson,
  mergeHybridQuakeEvents,
  assertQuakeUrlAllowed,
} from '../src/gateway/handlers/quakeHandler.ts';
import {
  populationHandler,
  parseWorldBankIndicator,
  assertPopulationUrlAllowed,
} from '../src/gateway/handlers/populationHandler.ts';
import type { Env } from '../src/db/index.ts';

// Mock Cloudflare KVNamespace
class MockKVNamespace {
  public store = new Map<string, string>();
  public getCount = 0;
  public putCount = 0;

  async get(key: string, type?: string): Promise<any> {
    this.getCount++;
    const val = this.store.get(key);
    if (!val) return null;
    if (type === 'json') {
      try {
        return JSON.parse(val);
      } catch {
        return null;
      }
    }
    return val;
  }

  async put(
    key: string,
    value: string,
    _options?: { expirationTtl?: number }
  ): Promise<void> {
    this.putCount++;
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
    this.getCount = 0;
    this.putCount = 0;
  }
}

// Mock payloads
const MOCK_USGS_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'us7000aceh',
      properties: {
        mag: 6.2,
        place: '120 km W of Banda Aceh, Indonesia',
        time: 1788501000000,
        tsunami: 1,
      },
      geometry: {
        type: 'Point',
        coordinates: [95.3, 5.5, 20],
      },
    },
    {
      type: 'Feature',
      id: 'us7000japan',
      properties: {
        mag: 4.8,
        place: 'Near coast of Honshu, Japan',
        time: 1788500000000,
        tsunami: 0,
      },
      geometry: {
        type: 'Point',
        coordinates: [140.5, 36.2, 35],
      },
    },
  ],
};

const MOCK_BMKG_AUTOGEMPA = {
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

const MOCK_BMKG_DIRASAKAN = {
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
    ],
  },
};

const MOCK_WORLDBANK_PAYLOAD = [
  {
    page: 1,
    pages: 1,
    per_page: 300,
    total: 3,
  },
  [
    {
      indicator: { id: 'SP.POP.TOTL', value: 'Population, total' },
      country: { id: 'ID', value: 'Indonesia' },
      countryiso3code: 'IDN',
      date: '2024',
      value: 281600000,
    },
    {
      indicator: { id: 'SP.POP.TOTL', value: 'Population, total' },
      country: { id: 'US', value: 'United States' },
      countryiso3code: 'USA',
      date: '2024',
      value: 341000000,
    },
    {
      indicator: { id: 'SP.POP.TOTL', value: 'Population, total' },
      country: { id: 'JP', value: 'Japan' },
      countryiso3code: 'JPN',
      date: '2024',
      value: 124000000,
    },
  ],
];

function mockFetchImplementation(urlStr: string | URL | Request) {
  const url = urlStr.toString();
  if (url.includes('earthquake.usgs.gov')) {
    return Promise.resolve(
      new Response(JSON.stringify(MOCK_USGS_GEOJSON), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }
  if (url.includes('autogempa.json')) {
    return Promise.resolve(
      new Response(JSON.stringify(MOCK_BMKG_AUTOGEMPA), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }
  if (url.includes('gempadirasakan.json')) {
    return Promise.resolve(
      new Response(JSON.stringify(MOCK_BMKG_DIRASAKAN), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }
  if (url.includes('api.worldbank.org')) {
    return Promise.resolve(
      new Response(JSON.stringify(MOCK_WORLDBANK_PAYLOAD), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }
  return Promise.resolve(
    new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  );
}

describe('Unified Edge API Gateway Suite (/api/v1/gateway)', () => {
  let mockKv: MockKVNamespace;
  let testEnv: Env;
  let fetchSpy: any;

  beforeEach(() => {
    mockKv = new MockKVNamespace();
    testEnv = { KURS_CACHE: mockKv as unknown as KVNamespace };
    fetchSpy = spyOn(globalThis, 'fetch').mockImplementation(mockFetchImplementation as any);
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  describe('1. Microapp Catalog Discovery', () => {
    it('GET /api/v1/gateway returns catalog of registered microapps', async () => {
      const app = createApp();
      const response = await app.handle(
        new Request('http://localhost/api/v1/gateway')
      );
      expect(response.status).toBe(200);

      const body = (await response.json()) as any;
      expect(body.success).toBe(true);
      expect(body.count).toBeGreaterThanOrEqual(2);
      expect(Array.isArray(body.data)).toBe(true);

      const catalogIds = body.data.map((item: any) => item.id);
      expect(catalogIds).toContain('quake');
      expect(catalogIds).toContain('population');

      const quakeItem = body.data.find((item: any) => item.id === 'quake');
      expect(quakeItem).toBeDefined();
      expect(quakeItem.name).toBe('USGS & BMKG Live Seismic Feed');
      expect(quakeItem.cacheTtlSeconds).toBe(180);

      const popItem = body.data.find((item: any) => item.id === 'population');
      expect(popItem).toBeDefined();
      expect(popItem.name).toBe('World Bank Population Data');
      expect(popItem.cacheTtlSeconds).toBe(3600);
    });
  });

  describe('2. Microapp Ingestion Handlers Logic', () => {
    it('quakeHandler parses BMKG autogempa, dirasakan, and USGS GeoJSON', () => {
      // Test BMKG autogempa parser
      const auto = parseBmkgAutoGempa(MOCK_BMKG_AUTOGEMPA);
      expect(auto).not.toBeNull();
      expect(auto?.lat).toBeCloseTo(-8.42, 2);
      expect(auto?.lng).toBeCloseTo(109.02, 2);
      expect(auto?.magnitude).toBe(5.4);
      expect(auto?.depthKm).toBe(10);
      expect(auto?.tsunamiWarning).toBe(false);
      expect(auto?.countryIso3).toBe('IDN');
      expect(auto?.dirasakanMmi).toContain('Kebumen');
      expect(auto?.shakemapUrl).toContain('20260904120459.mmi.jpg');

      // Test BMKG felt earthquakes parser
      const felt = parseBmkgDirasakan(MOCK_BMKG_DIRASAKAN);
      expect(felt.length).toBe(1);
      expect(felt[0].magnitude).toBe(3.8);
      expect(felt[0].lat).toBeCloseTo(-7.15, 2);
      expect(felt[0].lng).toBeCloseTo(107.55, 2);
      expect(felt[0].dirasakanMmi).toContain('Soreang');

      // Test USGS parser
      const usgs = parseUsgsGeoJson(MOCK_USGS_GEOJSON);
      expect(usgs.length).toBe(2);
      expect(usgs[0].magnitude).toBe(6.2);
      expect(usgs[0].countryIso3).toBe('IDN');
      expect(usgs[0].tsunamiWarning).toBe(true);
      expect(usgs[0].seismicRiskTier).toBe('high');
      expect(usgs[1].countryIso3).toBe('JPN');
      expect(usgs[1].tsunamiWarning).toBe(false);
    });

    it('quakeHandler performs hybrid merging correctly', async () => {
      const result = await quakeHandler.handle({});

      expect(result).toBeDefined();
      expect(result.source).toBe('hybrid_live');
      expect(result.events.length).toBeGreaterThanOrEqual(3);
      expect(result.latestAutoGempa).not.toBeNull();
      expect(result.latestAutoGempa?.place).toContain('Cilacap');

      // Check deduplication / merging order (descending by timestamp)
      for (let i = 0; i < result.events.length - 1; i++) {
        const t1 = new Date(result.events[i].timestamp).getTime();
        const t2 = new Date(result.events[i + 1].timestamp).getTime();
        expect(t1).toBeGreaterThanOrEqual(t2);
      }
    });

    it('quakeHandler enforces strict domain allowlist for SSRF prevention', () => {
      expect(() =>
        assertQuakeUrlAllowed('https://earthquake.usgs.gov/feed.geojson')
      ).not.toThrow();
      expect(() =>
        assertQuakeUrlAllowed('https://data.bmkg.go.id/autogempa.json')
      ).not.toThrow();
      expect(() =>
        assertQuakeUrlAllowed('https://evil-attacker.com/steal-data')
      ).toThrow(/SSRF Blocked/);
    });

    it('populationHandler parses World Bank SP.POP.TOTL indicator accurately', async () => {
      const populations = parseWorldBankIndicator(MOCK_WORLDBANK_PAYLOAD);
      expect(populations['IDN']).toBe(281600000);
      expect(populations['USA']).toBe(341000000);
      expect(populations['JPN']).toBe(124000000);
      expect(Object.keys(populations).length).toBe(3);

      const result = await populationHandler.handle({});
      expect(result.indicator).toBe('SP.POP.TOTL');
      expect(result.totalCountries).toBe(3);
      expect(result.populations['IDN']).toBe(281600000);
    });

    it('populationHandler enforces SSRF domain allowlist', () => {
      expect(() =>
        assertPopulationUrlAllowed('https://api.worldbank.org/v2/country')
      ).not.toThrow();
      expect(() =>
        assertPopulationUrlAllowed('https://malicious-host.net/api')
      ).toThrow(/SSRF Blocked/);
    });
  });

  describe('3. Dynamic Dispatcher and Edge KV Caching', () => {
    it('GET /api/v1/gateway/:app dispatches correctly and caches on repeat call (KV)', async () => {
      const customRegistry = new MicroappRegistry();
      customRegistry.register(populationHandler);

      // Cold call: Cache Miss
      const res1 = await customRegistry.dispatch('population', {}, testEnv);
      expect(res1.success).toBe(true);
      expect(res1.cached).toBe(false);
      expect(res1.app).toBe('population');
      expect(res1.data.populations['IDN']).toBe(281600000);

      // Verify KV store has cached the entry
      expect(mockKv.putCount).toBeGreaterThanOrEqual(1);

      // Repeat call: Cache Hit from KV!
      const res2 = await customRegistry.dispatch('population', {}, testEnv);
      expect(res2.success).toBe(true);
      expect(res2.cached).toBe(true);
      expect(res2.app).toBe('population');
      expect(res2.data.populations['IDN']).toBe(281600000);
    });

    it('falls back to in-memory LRU cache when KURS_CACHE is null or undefined', async () => {
      const registry = new MicroappRegistry();
      registry.register(populationHandler);

      // Cold call without KURS_CACHE
      const call1 = await registry.dispatch('population', {});
      expect(call1.success).toBe(true);
      expect(call1.cached).toBe(false);

      // Repeat call: should hit in-memory fallback
      const call2 = await registry.dispatch('population', {});
      expect(call2.success).toBe(true);
      expect(call2.cached).toBe(true);
      expect(call2.data.populations['IDN']).toBe(281600000);
    });

    it('GET /api/v1/gateway/:app dispatches via Elysia HTTP app', async () => {
      const app = createApp(testEnv);
      const response = await app.handle(
        new Request('http://localhost/api/v1/gateway/population')
      );
      expect(response.status).toBe(200);

      const body = (await response.json()) as any;
      expect(body.success).toBe(true);
      expect(body.app).toBe('population');
      expect(body.data.populations).toBeDefined();
      expect(body.data.populations['IDN']).toBe(281600000);
      expect(response.headers.get('X-Cache')).toBe('MISS');

      // Repeat HTTP request: should return HIT
      const responseRepeat = await app.handle(
        new Request('http://localhost/api/v1/gateway/population')
      );
      expect(responseRepeat.status).toBe(200);
      const bodyRepeat = (await responseRepeat.json()) as any;
      expect(bodyRepeat.cached).toBe(true);
      expect(responseRepeat.headers.get('X-Cache')).toBe('HIT');
    });
  });

  describe('4. Error Handling for Unknown Microapps', () => {
    it('GET /api/v1/gateway/:app returns 404 for unknown app', async () => {
      const app = createApp();
      const response = await app.handle(
        new Request('http://localhost/api/v1/gateway/non-existent-app')
      );
      expect(response.status).toBe(404);

      const body = (await response.json()) as any;
      expect(body.success).toBe(false);
      expect(body.error).toContain('not registered');
    });

    it('POST /api/v1/gateway returns 404 for unknown single app', async () => {
      const app = createApp();
      const response = await app.handle(
        new Request('http://localhost/api/v1/gateway', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ app: 'unknown-service' }),
        })
      );
      expect(response.status).toBe(404);

      const body = (await response.json()) as any;
      expect(body.success).toBe(false);
      expect(body.error).toContain('not registered');
    });

    it('POST /api/v1/gateway returns 400 for empty or invalid payload', async () => {
      const app = createApp();
      const response = await app.handle(
        new Request('http://localhost/api/v1/gateway', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
      );
      expect(response.status).toBe(400);

      const body = (await response.json()) as any;
      expect(body.success).toBe(false);
    });
  });

  describe('5. Single & Batch Dispatch via POST /api/v1/gateway', () => {
    it('POST /api/v1/gateway handles single microapp dispatch with params', async () => {
      const registry = new MicroappRegistry();
      registry.register({
        id: 'test-app',
        name: 'Test App',
        description: 'Test Microapp',
        cacheTtlSeconds: 60,
        handle: async (params) => ({
          computed: `hello-${params.foo || 'world'}`,
        }),
      });

      const response = await registry.dispatch('test-app', { foo: 'bar' });
      expect(response.success).toBe(true);
      expect(response.data.computed).toBe('hello-bar');
    });

    it('POST /api/v1/gateway handles batch dispatch of multiple microapps', async () => {
      const registry = new MicroappRegistry();
      registry.register({
        id: 'app-a',
        name: 'App A',
        description: 'App A Desc',
        handle: async () => ({ value: 'A' }),
      });
      registry.register({
        id: 'app-b',
        name: 'App B',
        description: 'App B Desc',
        handle: async () => ({ value: 'B' }),
      });

      const batchResults = await registry.dispatchBatch([
        { app: 'app-a' },
        { app: 'app-b' },
      ]);

      expect(batchResults['app-a']).toBeDefined();
      expect(batchResults['app-a'].success).toBe(true);
      expect(batchResults['app-a'].data.value).toBe('A');

      expect(batchResults['app-b']).toBeDefined();
      expect(batchResults['app-b'].success).toBe(true);
      expect(batchResults['app-b'].data.value).toBe('B');
    });

    it('POST /api/v1/gateway batch HTTP endpoint returns aggregated payload', async () => {
      const app = createApp();
      const response = await app.handle(
        new Request('http://localhost/api/v1/gateway', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            batch: [{ app: 'quake' }, { app: 'population' }],
          }),
        })
      );
      expect(response.status).toBe(200);

      const body = (await response.json()) as any;
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data['quake']).toBeDefined();
      expect(body.data['quake'].success).toBe(true);
      expect(body.data['quake'].data.events).toBeDefined();
      expect(body.data['population']).toBeDefined();
      expect(body.data['population'].success).toBe(true);
      expect(body.data['population'].data.populations).toBeDefined();
    });
  });
});
