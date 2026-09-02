import { describe, expect, it } from 'bun:test';
import { createApp } from '../src/index.ts';

describe('Rates API Integration Tests (Elysia)', () => {
  const app = createApp();

  it('GET / should return root status and documentation link', async () => {
    const response = await app.handle(new Request('http://localhost/'));
    expect(response.status).toBe(200);

    const body = (await response.json()) as Record<string, unknown>;
    expect(body.name).toBe('Kurs World API');
    expect(body.status).toBe('operational');
    expect(body.documentation).toBe('/swagger');
    expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
  });

  it('GET /api/v1/health should return ok', async () => {
    const response = await app.handle(new Request('http://localhost/api/v1/health'));
    expect(response.status).toBe(200);

    const body = (await response.json()) as { status: string; uptime: number; timestamp: string };
    expect(body.status).toBe('ok');
    expect(typeof body.uptime).toBe('number');
  });

  it('GET /swagger should serve Swagger UI', async () => {
    const response = await app.handle(new Request('http://localhost/swagger'));
    expect([200, 301, 302, 308]).toContain(response.status);
  });

  it('GET /api/v1/rates/latest should return latest exchange rates list', async () => {
    const response = await app.handle(new Request('http://localhost/api/v1/rates/latest'));
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      success: boolean;
      count: number;
      data: Array<Record<string, unknown>>;
    };
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.count).toBeGreaterThan(0);

    const firstRate = body.data[0];
    expect(firstRate).toHaveProperty('provider');
    expect(firstRate).toHaveProperty('baseCurrency');
    expect(firstRate).toHaveProperty('quoteCurrency');
    expect(firstRate).toHaveProperty('buyRate');
    expect(firstRate).toHaveProperty('sellRate');
    expect(firstRate).toHaveProperty('midRate');
  });

  it('GET /api/v1/rates/compare should return side-by-side comparison for USD/IDR', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/rates/compare?pair=USD/IDR')
    );
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      success: boolean;
      data: {
        baseCurrency: string;
        quoteCurrency: string;
        rates: Array<Record<string, unknown>>;
        bestForCustomerBuy: Record<string, unknown>;
        bestForCustomerSell: Record<string, unknown>;
      };
    };
    expect(body.success).toBe(true);
    expect(body.data.baseCurrency).toBe('USD');
    expect(body.data.quoteCurrency).toBe('IDR');
    expect(body.data.rates.length).toBeGreaterThan(0);
    expect(body.data.bestForCustomerBuy).toBeDefined();
    expect(body.data.bestForCustomerSell).toBeDefined();
  });

  it('GET /api/v1/convert should compute multi-source conversion', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/convert?amount=100&from=USD&to=IDR&rateType=buy')
    );
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      success: boolean;
      data: {
        amount: number;
        fromCurrency: string;
        toCurrency: string;
        comparisons: Array<Record<string, unknown>>;
        bestOption: {
          provider: string;
          convertedAmount: number;
        };
      };
    };
    expect(body.success).toBe(true);
    expect(body.data.amount).toBe(100);
    expect(body.data.fromCurrency).toBe('USD');
    expect(body.data.toCurrency).toBe('IDR');
    expect(body.data.comparisons.length).toBeGreaterThan(0);
    expect(body.data.bestOption).toBeDefined();
    expect(body.data.bestOption.convertedAmount).toBeGreaterThan(1000000);
  });

  it('GET /api/v1/rates/history should return Google Finance timeframe series with OHLC data for 1D (24 points)', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/rates/history?currency=USD&timeframe=1D')
    );
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      success: boolean;
      data: {
        currency: string;
        baseCurrency: string;
        timeframe: string;
        points: Array<{
          timestamp: string;
          date: string;
          timeLabel: string;
          rate: number;
          open: number;
          high: number;
          low: number;
          close: number;
        }>;
        highestRate: number;
        lowestRate: number;
        startRate: number;
        currentRate: number;
        changePercentage: number;
        changeAmount: number;
      };
    };
    expect(body.success).toBe(true);
    expect(body.data.currency).toBe('USD');
    expect(body.data.timeframe).toBe('1D');
    expect(body.data.points.length).toBe(24);

    const firstPoint = body.data.points[0];
    expect(firstPoint).toHaveProperty('timestamp');
    expect(firstPoint).toHaveProperty('date');
    expect(firstPoint).toHaveProperty('timeLabel');
    expect(firstPoint).toHaveProperty('rate');
    expect(firstPoint).toHaveProperty('open');
    expect(firstPoint).toHaveProperty('high');
    expect(firstPoint).toHaveProperty('low');
    expect(firstPoint).toHaveProperty('close');
    expect(firstPoint.high).toBeGreaterThanOrEqual(firstPoint.low);

    expect(body.data.highestRate).toBeGreaterThanOrEqual(body.data.lowestRate);
    expect(body.data.currentRate).toBeGreaterThan(0);
  });

  it('GET /api/v1/rates/history should support all Google Finance timeframes (5D, 1M, 6M, 1Y, 5Y, MAX)', async () => {
    // 5D -> 40 points
    const res5D = await app.handle(new Request('http://localhost/api/v1/rates/history?currency=EUR&timeframe=5D'));
    const body5D = (await res5D.json()) as { success: boolean; data: { points: unknown[] } };
    expect(body5D.success).toBe(true);
    expect(body5D.data.points.length).toBe(40);

    // 1M -> 30 points
    const res1M = await app.handle(new Request('http://localhost/api/v1/rates/history?currency=JPY&timeframe=1M'));
    const body1M = (await res1M.json()) as { success: boolean; data: { points: unknown[] } };
    expect(body1M.success).toBe(true);
    expect(body1M.data.points.length).toBe(30);

    // 6M -> 26 points
    const res6M = await app.handle(new Request('http://localhost/api/v1/rates/history?currency=GBP&timeframe=6M'));
    const body6M = (await res6M.json()) as { success: boolean; data: { points: unknown[] } };
    expect(body6M.success).toBe(true);
    expect(body6M.data.points.length).toBe(26);

    // 1Y -> 52 points
    const res1Y = await app.handle(new Request('http://localhost/api/v1/rates/history?currency=SGD&timeframe=1Y'));
    const body1Y = (await res1Y.json()) as { success: boolean; data: { points: unknown[] } };
    expect(body1Y.success).toBe(true);
    expect(body1Y.data.points.length).toBe(52);

    // 5Y -> 60 points
    const res5Y = await app.handle(new Request('http://localhost/api/v1/rates/history?currency=AUD&timeframe=5Y'));
    const body5Y = (await res5Y.json()) as { success: boolean; data: { points: unknown[] } };
    expect(body5Y.success).toBe(true);
    expect(body5Y.data.points.length).toBe(60);

    // MAX -> 120 points
    const resMAX = await app.handle(new Request('http://localhost/api/v1/rates/history?currency=MYR&timeframe=MAX'));
    const bodyMAX = (await resMAX.json()) as { success: boolean; data: { points: unknown[] } };
    expect(bodyMAX.success).toBe(true);
    expect(bodyMAX.data.points.length).toBe(120);
  });

  it('GET /api/v1/rates/compare-currencies should return world currency comparison table vs IDR', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/rates/compare-currencies')
    );
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      success: boolean;
      count: number;
      timestamp: string;
      data: Array<{
        currencyCode: string;
        currencyName: string;
        flagEmoji: string;
        countryName: string;
        rateToIdr: number;
        change24h: number;
        change1w: number;
        change1m: number;
        change1y: number;
        high52w: number;
        low52w: number;
        sparkline: number[];
      }>;
    };
    expect(body.success).toBe(true);
    expect(body.count).toBeGreaterThan(10);
    expect(Array.isArray(body.data)).toBe(true);

    const usdItem = body.data.find((c) => c.currencyCode === 'USD');
    expect(usdItem).toBeDefined();
    if (usdItem) {
      expect(usdItem.currencyName).toBe('US Dollar');
      expect(usdItem.flagEmoji).toBe('🇺🇸');
      expect(usdItem.countryName).toBe('Amerika Serikat');
      expect(usdItem.rateToIdr).toBeGreaterThan(10000);
      expect(typeof usdItem.change24h).toBe('number');
      expect(typeof usdItem.change1w).toBe('number');
      expect(typeof usdItem.change1m).toBe('number');
      expect(typeof usdItem.change1y).toBe('number');
      expect(usdItem.high52w).toBeGreaterThan(usdItem.low52w);
      expect(Array.isArray(usdItem.sparkline)).toBe(true);
      expect(usdItem.sparkline.length).toBeGreaterThanOrEqual(7);
    }
  });

  it('GET /api/v1/rates/history should maintain backward compatibility with pair and days parameter', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/rates/history?pair=USD/IDR&days=7')
    );
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      success: boolean;
      data: {
        currency: string;
        baseCurrency: string;
        quoteCurrency: string;
        periodDays: number;
        points: Array<Record<string, unknown>>;
        highestMidRate: number;
        lowestMidRate: number;
      };
    };
    expect(body.success).toBe(true);
    expect(body.data.currency).toBe('USD');
    expect(body.data.quoteCurrency).toBe('IDR');
    expect(body.data.periodDays).toBe(7);
    expect(body.data.points.length).toBeGreaterThanOrEqual(7);
    expect(body.data.highestMidRate).toBeGreaterThan(0);
    expect(body.data.lowestMidRate).toBeGreaterThan(0);
  });

  it('GET /api/v1/rates/compare without base or pair should return 400', async () => {
    const response = await app.handle(new Request('http://localhost/api/v1/rates/compare'));
    expect(response.status).toBe(400);

    const body = (await response.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
  });
});
