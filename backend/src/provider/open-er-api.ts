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

export const MAX_INGESTION_RESPONSE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Adaptive precision rounding for exchange rates.
 * - value >= 100 → 2 decimal places  (e.g. IDR/USD ~17765)
 * - value >= 1   → 4 decimal places  (e.g. JPY/IDR ~118.xx)
 * - value < 1    → 6 decimal places  (micro-rates: VND, LAK, IQD, LBP, etc.)
 */
export function roundRate(value: number): number {
  if (value >= 100) return Math.round(value * 100) / 100;
  if (value >= 1) return Math.round(value * 10000) / 10000;
  return Math.round(value * 1000000) / 1000000;
}

const ALLOWED_DOMAINS = [
  'open.er-api.com',
  'bi.go.id',
  'bca.co.id',
  'bankmandiri.co.id',
  'bri.co.id',
  'bni.co.id',
  'cimbniaga.co.id',
  'dolarasia.com',
  'localhost',
  '127.0.0.1',
] as const;

/**
 * Validates provider URL against SSRF and outbound domain whitelist.
 */
export function validateProviderUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

    if (isLocal) {
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    }

    if (parsed.protocol !== 'https:') {
      return false;
    }

    const host = parsed.hostname.toLowerCase();
    return ALLOWED_DOMAINS.some(
      (domain) => host === domain || host.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

export class OpenERApiProvider implements IRateProvider {
  public readonly info: RateProviderInfo = OPEN_ER_API_INFO;
  private readonly baseUrl: string;
  private readonly customFetch?: typeof fetch;
  private readonly log = logger.child({ provider: this.info.id });

  constructor(options?: { baseUrl?: string; customFetch?: typeof fetch }) {
    const url = options?.baseUrl ?? 'https://open.er-api.com/v6/latest/USD';
    if (!validateProviderUrl(url)) {
      throw new Error(`Untrusted or disallowed provider URL: ${url}`);
    }
    this.baseUrl = url;
    this.customFetch = options?.customFetch;
  }

  async fetchLatestRates(): Promise<Rate[]> {
    const startTime = performance.now();
    this.log.debug({ sourceUrl: this.baseUrl }, 'Starting exchange rate fetch from OpenERApi');

    if (!validateProviderUrl(this.baseUrl)) {
      throw new Error(`Untrusted or disallowed provider URL: ${this.baseUrl}`);
    }

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

      // Check Content-Length header if present
      const contentLengthHeader = response.headers.get('content-length');
      if (contentLengthHeader) {
        const contentLength = parseInt(contentLengthHeader, 10);
        if (!isNaN(contentLength) && contentLength > MAX_INGESTION_RESPONSE_BYTES) {
          const errorMsg = `Response size exceeds 5MB limit: ${contentLength} bytes`;
          const duration_ms = Math.round((performance.now() - startTime) * 100) / 100;
          this.log.error({ duration_ms, error: errorMsg }, errorMsg);
          throw new Error(errorMsg);
        }
      }

      // Read arrayBuffer and enforce strict 5MB limit
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > MAX_INGESTION_RESPONSE_BYTES) {
        const errorMsg = `Response body exceeds 5MB limit: ${arrayBuffer.byteLength} bytes`;
        const duration_ms = Math.round((performance.now() - startTime) * 100) / 100;
        this.log.error({ duration_ms, error: errorMsg }, errorMsg);
        throw new Error(errorMsg);
      }

      const text = new TextDecoder().decode(arrayBuffer);
      const data = JSON.parse(text) as OpenERApiResponse;

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
        const buyRate = roundRate(midRate * 0.9985);
        const sellRate = roundRate(midRate * 1.0015);
        const spread = roundRate(sellRate - buyRate);

        rates.push({
          provider: this.info.id,
          baseCurrency: ccy,
          quoteCurrency: 'IDR',
          buyRate,
          sellRate,
          midRate: roundRate(midRate),
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
