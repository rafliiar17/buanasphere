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
    },
  };

  it('should fetch and normalize rates for major currencies against IDR', async () => {
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

    expect(rates.length).toBeGreaterThan(0);
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
