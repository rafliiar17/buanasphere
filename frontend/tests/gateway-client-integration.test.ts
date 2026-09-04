/**
 * Unified Edge Gateway Client & Services Integration Test Suite (ADR 0074)
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { ApiClient, apiClient } from '../src/lib/api/client';
import {
  fetchLiveEarthquakes,
  clearLiveEarthquakeCache,
  fetchUsgsCustomEvents,
  getLiveEarthquakeRings,
} from '../src/lib/features/map/services/liveEarthquakeService';
import {
  fetchWorldBankPopulation,
  clearPopulationCache,
} from '../src/lib/features/map/services/livePopulationService';
import { GLOBAL_EARTHQUAKES } from '../src/lib/framework/geoglobe/data/earthquakeData';
import { POPULATION_DATASET } from '../src/lib/framework/geoglobe/data/populationData';

describe('Unified Gateway Client & Services Integration (ADR 0074)', () => {
  beforeEach(() => {
    clearLiveEarthquakeCache();
    clearPopulationCache();
  });

  describe('1. ApiClient.gateway() Method', () => {
    it('sends GET request with serialized query params to /gateway/:app', async () => {
      let interceptedUrl = '';
      let interceptedMethod = '';

      const mockFetch = (async (input: any, init?: any) => {
        interceptedUrl = String(input);
        interceptedMethod = init?.method || 'GET';
        return new Response(
          JSON.stringify({
            success: true,
            app: 'quake',
            source: 'usgs_live',
            cached: false,
            timestamp: '2026-09-04T12:00:00.000Z',
            data: { events: [], totalCount: 0 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }) as unknown as typeof fetch;

      const client = new ApiClient('/api/v1');
      const res = await client.gateway(
        'quake',
        { minmagnitude: 5.2, limit: 20 },
        { customFetch: mockFetch }
      );

      expect(res.success).toBe(true);
      expect(res.app).toBe('quake');
      expect(interceptedMethod).toBe('GET');
      expect(interceptedUrl).toContain('/api/v1/gateway/quake');
      expect(interceptedUrl).toContain('minmagnitude=5.2');
      expect(interceptedUrl).toContain('limit=20');
    });

    it('sends POST request to /gateway with JSON body containing app and params', async () => {
      let interceptedUrl = '';
      let interceptedMethod = '';
      let interceptedBody: any = null;

      const mockFetch = (async (input: any, init?: any) => {
        interceptedUrl = String(input);
        interceptedMethod = init?.method || 'GET';
        interceptedBody = init?.body ? JSON.parse(String(init.body)) : null;
        return new Response(
          JSON.stringify({
            success: true,
            app: 'population',
            source: 'worldbank_live',
            cached: true,
            timestamp: '2026-09-04T12:00:00.000Z',
            data: { totalCountries: 195 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }) as unknown as typeof fetch;

      const client = new ApiClient('/api/v1');
      const res = await client.gateway(
        'population',
        { year: 2024, region: 'all' },
        { method: 'POST', customFetch: mockFetch }
      );

      expect(res.success).toBe(true);
      expect(res.app).toBe('population');
      expect(interceptedMethod).toBe('POST');
      expect(interceptedUrl).toBe('/api/v1/gateway');
      expect(interceptedBody).toEqual({
        app: 'population',
        params: { year: 2024, region: 'all' },
      });
    });

    it('appends refresh query parameter when forceRefresh is true on GET', async () => {
      let interceptedUrl = '';

      const mockFetch = (async (input: any) => {
        interceptedUrl = String(input);
        return new Response(
          JSON.stringify({
            success: true,
            app: 'quake',
            source: 'usgs_live',
            cached: false,
            timestamp: '2026-09-04T12:00:00.000Z',
            data: {},
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }) as unknown as typeof fetch;

      const client = new ApiClient('/api/v1');
      await client.gateway('quake', undefined, {
        forceRefresh: true,
        customFetch: mockFetch,
      });

      expect(interceptedUrl).toContain('refresh=true');
    });
  });

  describe('2. ApiClient.gatewayBatch() Method', () => {
    it('sends POST request to /gateway with batch array payload', async () => {
      let interceptedUrl = '';
      let interceptedMethod = '';
      let interceptedBody: any = null;

      const mockBatchResponse = {
        success: true,
        results: {
          quake: { success: true, count: 15 },
          population: { success: true, count: 195 },
        },
      };

      const mockFetch = (async (input: any, init?: any) => {
        interceptedUrl = String(input);
        interceptedMethod = init?.method || 'GET';
        interceptedBody = init?.body ? JSON.parse(String(init.body)) : null;
        return new Response(JSON.stringify(mockBatchResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }) as unknown as typeof fetch;

      const client = new ApiClient('/api/v1');
      const res = await client.gatewayBatch(
        [
          { app: 'quake', params: { limit: 15 } },
          { app: 'population' },
        ],
        { customFetch: mockFetch }
      );

      expect(interceptedMethod).toBe('POST');
      expect(interceptedUrl).toBe('/api/v1/gateway');
      expect(interceptedBody).toEqual({
        batch: [
          { app: 'quake', params: { limit: 15 } },
          { app: 'population' },
        ],
      });
      expect(res).toBeDefined();
    });
  });

  describe('3. liveEarthquakeService Integration with Gateway', () => {
    it('fetches live earthquake data through backend gateway endpoint', async () => {
      let interceptedUrl = '';
      const mockEvents = [
        {
          id: 'eq-test-1',
          lat: -6.2,
          lng: 106.8,
          magnitude: 6.2,
          depthKm: 12,
          place: 'Selat Sunda, Indonesia',
          timestamp: '2026-09-04T10:00:00Z',
          countryIso3: 'IDN',
          tsunamiWarning: false,
          seismicRiskTier: 'high' as const,
          source: 'BMKG Autogempa',
        },
        {
          id: 'eq-test-2',
          lat: 35.6,
          lng: 139.7,
          magnitude: 4.8,
          depthKm: 40,
          place: 'Tokyo, Japan',
          timestamp: '2026-09-04T09:00:00Z',
          countryIso3: 'JPN',
          tsunamiWarning: false,
          seismicRiskTier: 'low' as const,
          source: 'USGS',
        },
      ];

      const mockFetch = (async (input: any) => {
        interceptedUrl = String(input);
        return new Response(
          JSON.stringify({
            success: true,
            app: 'quake',
            source: 'hybrid_live',
            cached: false,
            timestamp: '2026-09-04T12:00:00.000Z',
            data: {
              events: mockEvents,
              isLive: true,
              source: 'hybrid_live',
              lastUpdated: '2026-09-04T12:00:00.000Z',
              totalCount: 2,
              latestAutoGempa: mockEvents[0],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }) as unknown as typeof fetch;

      const result = await fetchLiveEarthquakes({
        customFetch: mockFetch,
        forceRefresh: true,
      });

      expect(interceptedUrl).toContain('/gateway/quake');
      expect(result.isLive).toBe(true);
      expect(result.source).toBe('hybrid_live');
      expect(result.events.length).toBe(2);
      expect(result.events[0].id).toBe('eq-test-1');
      expect(result.latestAutoGempa).not.toBeNull();

      // Test helper function integration
      const rings = getLiveEarthquakeRings(result.events);
      expect(rings.length).toBe(2);
      expect(rings[0].color).toBe('#ef4444'); // M >= 6.0 is red
    });

    it('falls back gracefully to GLOBAL_EARTHQUAKES when gateway fails or is unreachable', async () => {
      const failingFetch = (async () => {
        return new Response('Gateway Internal Error', { status: 502 });
      }) as unknown as typeof fetch;

      const result = await fetchLiveEarthquakes({
        customFetch: failingFetch,
        forceRefresh: true,
      });

      expect(result.isLive).toBe(false);
      expect(result.source).toBe('fallback_bundled');
      expect(result.events.length).toBe(GLOBAL_EARTHQUAKES.length);
      expect(result.totalCount).toBe(GLOBAL_EARTHQUAKES.length);
    });
  });

  describe('4. livePopulationService Integration with Gateway', () => {
    it('fetches population data through backend gateway endpoint and merges dataset', async () => {
      let interceptedUrl = '';

      const mockFetch = (async (input: any) => {
        interceptedUrl = String(input);
        return new Response(
          JSON.stringify({
            success: true,
            app: 'population',
            source: 'worldbank_live',
            cached: true,
            timestamp: '2026-09-04T12:00:00.000Z',
            data: {
              IDN: 285000000,
              USA: 340000000,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }) as unknown as typeof fetch;

      const result = await fetchWorldBankPopulation({
        customFetch: mockFetch,
        forceRefresh: true,
      });

      expect(interceptedUrl).toContain('/gateway/population');
      expect(result.isLive).toBe(true);
      expect(result.source).toBe('worldbank_live');
      expect(result.data['IDN'].totalPopulation).toBe(285000000);
      expect(result.data['USA'].totalPopulation).toBe(340000000);
    });

    it('falls back gracefully to POPULATION_DATASET when gateway encounters network error', async () => {
      const networkErrorFetch = (async () => {
        throw new Error('Network offline or DNS lookup failed');
      }) as unknown as typeof fetch;

      const result = await fetchWorldBankPopulation({
        customFetch: networkErrorFetch,
        forceRefresh: true,
      });

      expect(result.isLive).toBe(false);
      expect(result.source).toBe('fallback_bundled');
      expect(result.data).toEqual(POPULATION_DATASET);
      expect(result.totalCountries).toBe(Object.keys(POPULATION_DATASET).length);
    });
  });
});
