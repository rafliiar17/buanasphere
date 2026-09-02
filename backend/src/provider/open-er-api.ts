import type { IRateProvider, Rate, RateProviderInfo } from '../domain/rate.ts';
import { logger } from '../logger/index.ts';

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
  'CAD',
  'CHF',
  'HKD',
  'KRW',
  'NZD',
  'INR',
  'BRL',
  'ZAR',
  'AED',
  'PHP',
  'VND',
] as const;

export class OpenERApiProvider implements IRateProvider {
  public readonly info: RateProviderInfo = OPEN_ER_API_INFO;
  private readonly baseUrl: string;
  private readonly customFetch?: typeof fetch;
  private readonly log = logger.child({ provider: this.info.id });

  constructor(options?: { baseUrl?: string; customFetch?: typeof fetch }) {
    this.baseUrl = options?.baseUrl ?? 'https://open.er-api.com/v6/latest/USD';
    this.customFetch = options?.customFetch;
  }

  async fetchLatestRates(): Promise<Rate[]> {
    const startTime = performance.now();
    this.log.debug({ sourceUrl: this.baseUrl }, 'Starting exchange rate fetch from OpenERApi');

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
        const errorMsg = `OpenERApi HTTP error: ${response.status} ${response.statusText}`;
        const duration_ms = Math.round((performance.now() - startTime) * 100) / 100;
        this.log.error({ duration_ms, status: response.status, error: errorMsg }, errorMsg);
        throw new Error(errorMsg);
      }

      const data = (await response.json()) as OpenERApiResponse;

      if (data.result !== 'success' || !data.rates || typeof data.rates !== 'object') {
        const errorMsg = `Invalid OpenERApi response payload: ${JSON.stringify(data)}`;
        const duration_ms = Math.round((performance.now() - startTime) * 100) / 100;
        this.log.error({ duration_ms, error: errorMsg }, errorMsg);
        throw new Error(errorMsg);
      }

      const idrRate = data.rates['IDR'];
      if (!idrRate || idrRate <= 0) {
        const errorMsg = 'IDR rate missing or invalid in OpenERApi response';
        const duration_ms = Math.round((performance.now() - startTime) * 100) / 100;
        this.log.error({ duration_ms, error: errorMsg }, errorMsg);
        throw new Error(errorMsg);
      }

      const retrievedAt = new Date().toISOString();
      const providerTimestamp = data.time_last_update_utc ?? retrievedAt;
      const rates: Rate[] = [];

      // Parse ALL currencies returned by ExchangeRate-API (160+ currency codes)
      for (const [ccyRaw, ccyRateAgainstUSD] of Object.entries(data.rates)) {
        const ccy = ccyRaw.toUpperCase();
        if (!ccy || typeof ccyRateAgainstUSD !== 'number' || ccyRateAgainstUSD <= 0) continue;
        if (ccy === 'IDR') continue; // IDR is the target quote currency

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

      const duration_ms = Math.round((performance.now() - startTime) * 100) / 100;
      this.log.info(
        {
          duration_ms,
          parsedRatesCount: rates.length,
          baseCode: data.base_code,
        },
        `Successfully fetched and parsed ${rates.length} rates from OpenERApi (${duration_ms}ms)`
      );

      return rates;
    } catch (error) {
      clearTimeout(timeoutId);
      const duration_ms = Math.round((performance.now() - startTime) * 100) / 100;
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutMsg = 'OpenERApi request timed out after 5000ms';
        this.log.error({ duration_ms, error: timeoutMsg }, timeoutMsg);
        throw new Error(timeoutMsg);
      }
      this.log.error(
        { duration_ms, error: error instanceof Error ? error.message : String(error) },
        `Failed fetching rates from OpenERApi: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
