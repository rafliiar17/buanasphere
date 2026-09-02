import { describe, expect, it, mock } from 'bun:test';
import { OpenERApiProvider, type OpenERApiResponse } from '../src/provider/open-er-api.ts';

describe('OpenERApiProvider', () => {
  const mockApiResponse: OpenERApiResponse = {
    result: 'success',
    provider: 'https://www.exchangerate-api.com',
    base_code: 'USD',
    time_last_update_utc: 'Wed, 02 Sep 2026 00:00:01 +0000',
    rates: {
      USD: 1,
      IDR: 15500,
      EUR: 0.92,
      SGD: 1.32,
      JPY: 145.0,
      GBP: 0.78,
      AUD: 1.5,
      CNY: 7.2,
      MYR: 4.4,
      SAR: 3.75,
      THB: 34.0,
      CAD: 1.35,
      CHF: 0.88,
      BRL: 5.4,
      ZAR: 18.2,
      AED: 3.67,
      PHP: 56.5,
      VND: 24500,
      NGN: 1500,
      EGP: 48.5,
      KES: 130,
    },
  };

  it('should fetch and normalize all currencies against IDR from OpenERApi', async () => {
    const customFetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify(mockApiResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    ) as unknown as typeof fetch;

    const provider = new OpenERApiProvider({ customFetch });
    const rates = await provider.fetchLatestRates();

    // 21 currencies in response minus IDR (as base quote) => 20 rates
    expect(rates.length).toBe(20);

    const usdRate = rates.find((r) => r.baseCurrency === 'USD');
    expect(usdRate).toBeDefined();
    expect(usdRate?.quoteCurrency).toBe('IDR');
    expect(usdRate?.midRate).toBe(15500);
    expect(usdRate?.buyRate).toBeLessThan(15500);
    expect(usdRate?.sellRate).toBeGreaterThan(15500);
    expect(usdRate?.spread).toBe(usdRate!.sellRate - usdRate!.buyRate);

    // Verify EUR rate (15500 / 0.92 = ~16847.83)
    const eurRate = rates.find((r) => r.baseCurrency === 'EUR');
    expect(eurRate).toBeDefined();
    expect(eurRate?.midRate).toBeCloseTo(15500 / 0.92, 1);

    // Verify African & emerging market currency (NGN: 15500 / 1500 = ~10.33)
    const ngnRate = rates.find((r) => r.baseCurrency === 'NGN');
    expect(ngnRate).toBeDefined();
    expect(ngnRate?.midRate).toBeCloseTo(15500 / 1500, 1);

    // Verify micro currency (VND: 15500 / 24500 = ~0.63)
    const vndRate = rates.find((r) => r.baseCurrency === 'VND');
    expect(vndRate).toBeDefined();
    expect(vndRate?.midRate).toBeCloseTo(15500 / 24500, 2);
  });

  it('should throw an error when API returns error status', async () => {
    const customFetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ result: 'error', 'error-type': 'invalid-key' }), {
          status: 400,
          statusText: 'Bad Request',
        })
      )
    ) as unknown as typeof fetch;

    const provider = new OpenERApiProvider({ customFetch });
    expect(provider.fetchLatestRates()).rejects.toThrow('OpenERApi HTTP error: 400 Bad Request');
  });

  it('should throw an error when IDR is missing in response rates', async () => {
    const customFetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            result: 'success',
            base_code: 'USD',
            rates: { USD: 1, EUR: 0.9 },
          }),
          { status: 200 }
        )
      )
    ) as unknown as typeof fetch;

    const provider = new OpenERApiProvider({ customFetch });
    expect(provider.fetchLatestRates()).rejects.toThrow('IDR rate missing or invalid in OpenERApi response');
  });
});
