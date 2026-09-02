import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { ApiClient, SUPPORTED_CURRENCIES, MOCK_PROVIDERS } from '../src/lib/api/client';

describe('ApiClient & Mock Fallback Unit Tests', () => {
  let originalFetch: typeof globalThis.fetch;

  const setMockFetch = (fn: (...args: any[]) => Promise<Response>) => {
    globalThis.fetch = fn as unknown as typeof fetch;
  };

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('Configuration & Initialization', () => {
    it('initializes with default base URL when not specified', () => {
      const client = new ApiClient();
      expect(client.getBaseUrl()).toBe('/api/v1');
    });

    it('initializes with custom base URL when provided', () => {
      const client = new ApiClient('http://localhost:3000/api/v1');
      expect(client.getBaseUrl()).toBe('http://localhost:3000/api/v1');
    });

    it('exposes supported currency list with required metadata', () => {
      expect(SUPPORTED_CURRENCIES.length).toBeGreaterThanOrEqual(10);
      const usd = SUPPORTED_CURRENCIES.find((c) => c.code === 'USD');
      expect(usd).toBeDefined();
      expect(usd?.symbol).toBe('$');
      expect(usd?.country).toBe('Amerika Serikat');
    });
  });

  describe('getProviders()', () => {
    it('returns high-fidelity mock providers on network failure', async () => {
      // Simulate fetch failure
      setMockFetch(() => Promise.reject(new Error('Network offline')));

      const client = new ApiClient();
      const providers = await client.getProviders();

      expect(providers).toBeArray();
      expect(providers.length).toBe(MOCK_PROVIDERS.length);
      expect(providers.some((p) => p.id === 'bi')).toBe(true);
      expect(providers.some((p) => p.id === 'bca')).toBe(true);
      expect(providers.some((p) => p.id === 'mandiri')).toBe(true);
      expect(providers.some((p) => p.id === 'dolarasia')).toBe(true);
    });

    it('returns data from API when fetch succeeds', async () => {
      const mockApiData = [
        {
          id: 'bi',
          name: 'Bank Indonesia Mock',
          shortName: 'BI',
          type: 'central_bank' as const,
          badgeText: 'Bank Sentral',
          website: 'https://bi.go.id',
          lastUpdated: '2026-09-02T00:00:00Z',
        },
      ];

      setMockFetch(() =>
        Promise.resolve(
          new Response(JSON.stringify({ success: true, data: mockApiData }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      );

      const client = new ApiClient();
      const providers = await client.getProviders();
      expect(providers).toEqual(mockApiData);
    });
  });

  describe('getLiveRates()', () => {
    it('returns structured rate items with valid spread calculations on fallback', async () => {
      setMockFetch(() => Promise.reject(new Error('API unreachable')));

      const client = new ApiClient();
      const rates = await client.getLiveRates('IDR');

      expect(rates.length).toBeGreaterThan(0);
      const usdRate = rates.find((r) => r.targetCurrency === 'USD');
      expect(usdRate).toBeDefined();
      if (usdRate) {
        expect(usdRate.buyRate).toBeGreaterThan(0);
        expect(usdRate.sellRate).toBeGreaterThan(usdRate.buyRate);
        expect(usdRate.spread).toBe(usdRate.sellRate - usdRate.buyRate);
        expect(usdRate.spreadPercent).toBeGreaterThan(0);
      }
    });
  });

  describe('getRateMatrix()', () => {
    it('returns side-by-side matrix with best buy and sell providers on fallback', async () => {
      setMockFetch(() => Promise.reject(new Error('Timeout')));

      const client = new ApiClient();
      const matrix = await client.getRateMatrix('USD');

      expect(matrix.currency).toBe('USD');
      expect(matrix.baseCurrency).toBe('IDR');
      expect(matrix.rows.length).toBeGreaterThan(0);
      expect(matrix.bestBuyProvider).toBeDefined();
      expect(matrix.bestSellProvider).toBeDefined();

      const biRow = matrix.rows.find((r) => r.providerId === 'bi');
      expect(biRow).toBeDefined();
      expect(biRow?.rateType).toBe('JISDOR');

      const bcaRow = matrix.rows.find((r) => r.providerId === 'bca');
      expect(bcaRow).toBeDefined();
      expect(bcaRow?.isBestSell).toBe(true);
    });
  });

  describe('convertCurrency()', () => {
    it('converts Foreign Currency to IDR using buy rate on fallback', async () => {
      setMockFetch(() => Promise.reject(new Error('Connection error')));

      const client = new ApiClient();
      const result = await client.convertCurrency('USD', 'IDR', 100, 'bca');

      expect(result.from).toBe('USD');
      expect(result.to).toBe('IDR');
      expect(result.amount).toBe(100);
      expect(result.rateType).toBe('buy');
      expect(result.resultAmount).toBeGreaterThan(1_000_000);
      expect(result.comparisons).toBeArray();
      expect(result.comparisons?.length).toBeGreaterThan(0);
    });

    it('converts IDR to Foreign Currency using sell rate on fallback', async () => {
      setMockFetch(() => Promise.reject(new Error('Connection error')));

      const client = new ApiClient();
      const result = await client.convertCurrency('IDR', 'USD', 17_790_000, 'bca');

      expect(result.from).toBe('IDR');
      expect(result.to).toBe('USD');
      expect(result.rateType).toBe('sell');
      expect(result.resultAmount).toBeCloseTo(1000, 1);
    });
  });

  describe('getHistoricalRates()', () => {
    it('returns time-series data points and summary analytics on fallback', async () => {
      setMockFetch(() => Promise.reject(new Error('Endpoint down')));

      const client = new ApiClient();
      const history = await client.getHistoricalRates('USD', '7d');

      expect(history.currency).toBe('USD');
      expect(history.range).toBe('7d');
      expect(history.points.length).toBe(8); // 7 days + current
      expect(history.summary.min).toBeLessThanOrEqual(history.summary.max);
      expect(history.summary.avg).toBeGreaterThan(0);
    });
  });

  describe('createRateAlert()', () => {
    it('returns mock confirmation message on fallback', async () => {
      setMockFetch(() => Promise.reject(new Error('Server unavailable')));

      const client = new ApiClient();
      const response = await client.createRateAlert({
        email: 'user@example.com',
        baseCurrency: 'IDR',
        targetCurrency: 'USD',
        targetRate: 16500,
        condition: 'above',
      });

      expect(response.success).toBe(true);
      expect(response.message).toContain('user@example.com');
      expect(response.message).toContain('16500');
    });
  });
});
