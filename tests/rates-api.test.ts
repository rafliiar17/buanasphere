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

  it('GET /api/v1/rates/history should return historical time-series points', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/rates/history?pair=USD/IDR&days=7')
    );
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      success: boolean;
      data: {
        baseCurrency: string;
        quoteCurrency: string;
        periodDays: number;
        points: Array<Record<string, unknown>>;
        highestMidRate: number;
        lowestMidRate: number;
      };
    };
    expect(body.success).toBe(true);
    expect(body.data.baseCurrency).toBe('USD');
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
