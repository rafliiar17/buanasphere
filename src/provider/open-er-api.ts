import type { IRateProvider, Rate, RateProviderInfo } from '../domain/rate.ts';

export interface OpenERApiResponse {
  result: string;
  provider?: string;
  documentation?: string;
  terms_of_use?: string;
  time_last_update_unix?: number;
  time_last_update_utc?: string;
  time_next_update_unix?: number;
  time_next_update_utc?: string;
  base_code: string;
  rates: Record<string, number>;
}

export const OPEN_ER_API_INFO: RateProviderInfo = {
  id: 'open_er_api',
  name: 'ExchangeRate-API (Market Reference)',
  type: 'market_reference',
  website: 'https://open.er-api.com',
  description: 'Global benchmark spot exchange rate reference for 160+ currencies.',
};

export const MAJOR_CURRENCIES = [
  'USD',
  'EUR',
  'SGD',
  'JPY',
  'GBP',
  'AUD',
  'CNY',
  'MYR',
  'SAR',
  'THB',
] as const;

export class OpenERApiProvider implements IRateProvider {
  public readonly info: RateProviderInfo = OPEN_ER_API_INFO;
  private readonly baseUrl: string;
  private readonly customFetch?: typeof fetch;

  constructor(options?: { baseUrl?: string; customFetch?: typeof fetch }) {
    this.baseUrl = options?.baseUrl ?? 'https://open.er-api.com/v6/latest/USD';
    this.customFetch = options?.customFetch;
  }

  async fetchLatestRates(): Promise<Rate[]> {
    const fetchFn = this.customFetch ?? fetch;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetchFn(this.baseUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'KursWorld/1.0 (Edge Ingestion Worker)',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OpenERApi HTTP error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as OpenERApiResponse;

      if (data.result !== 'success' || !data.rates || typeof data.rates !== 'object') {
        throw new Error(`Invalid OpenERApi response payload: ${JSON.stringify(data)}`);
      }

      const idrRate = data.rates['IDR'];
      if (!idrRate || idrRate <= 0) {
        throw new Error(`IDR rate missing or invalid in OpenERApi response`);
      }

      const retrievedAt = new Date().toISOString();
      const providerTimestamp = data.time_last_update_utc ?? retrievedAt;
      const rates: Rate[] = [];

      for (const ccy of MAJOR_CURRENCIES) {
        const ccyRateAgainstUSD = data.rates[ccy];
        if (!ccyRateAgainstUSD || ccyRateAgainstUSD <= 0) continue;

        // 1 USD = idrRate IDR, 1 USD = ccyRateAgainstUSD CCY => 1 CCY = (idrRate / ccyRateAgainstUSD) IDR
        const midRate = idrRate / ccyRateAgainstUSD;
        // Market spot reference indicative spread (0.15% bid-ask margin)
        const buyRate = Math.round((midRate * 0.9985) * 100) / 100;
        const sellRate = Math.round((midRate * 1.0015) * 100) / 100;
        const spread = Math.round((sellRate - buyRate) * 100) / 100;

        rates.push({
          provider: this.info.id,
          baseCurrency: ccy,
          quoteCurrency: 'IDR',
          buyRate,
          sellRate,
          midRate: Math.round(midRate * 100) / 100,
          spread,
          retrievedAt,
          providerTimestamp,
          sourceUrl: this.baseUrl,
        });
      }

      return rates;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('OpenERApi request timed out after 5000ms');
      }
      throw error;
    }
  }
}
