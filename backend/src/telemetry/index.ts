/**
 * Cloudflare Workers Analytics Engine Telemetry Module
 * Implements non-blocking time-series metrics recording per ADR-0023.
 */

export interface AnalyticsEngineDataPoint {
  blobs?: string[];
  doubles?: number[];
  indexes?: string[];
}

export interface ProviderFetchTelemetry {
  provider: string;
  durationMs: number;
  status: 'success' | 'error';
  rateCount: number;
  errorReason?: string;
}

export interface ApiRequestTelemetry {
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  cacheStatus: 'HIT' | 'MISS' | 'BYPASS';
  currencyPair?: string;
}

export interface ConversionTelemetry {
  from: string;
  to: string;
  amount: number;
  rateType: 'buy' | 'sell' | 'mid';
  durationMs: number;
  bestProvider: string;
}

/**
 * Record external provider fetch latency, parsed rate count, and status.
 */
export function recordProviderFetch(
  analytics: AnalyticsEngineDataset | undefined,
  data: ProviderFetchTelemetry
): void {
  if (!analytics) return;

  try {
    analytics.writeDataPoint({
      blobs: ['provider_fetch', data.provider, data.status, data.errorReason ?? ''],
      doubles: [data.durationMs, data.rateCount],
      indexes: [data.provider],
    });
  } catch {
    // Non-blocking: Silently ignore telemetry write failures to never disrupt application flow
  }
}

/**
 * Record API request traffic, status code, latency, and edge cache status.
 */
export function recordApiRequest(
  analytics: AnalyticsEngineDataset | undefined,
  data: ApiRequestTelemetry
): void {
  if (!analytics) return;

  try {
    analytics.writeDataPoint({
      blobs: ['api_request', data.endpoint, data.method, data.cacheStatus, data.currencyPair ?? ''],
      doubles: [data.statusCode, data.durationMs],
      indexes: [data.endpoint],
    });
  } catch {
    // Non-blocking: Silently ignore telemetry write failures
  }
}

/**
 * Record currency conversion activity to track popular currency pairs and provider selection.
 */
export function recordConversion(
  analytics: AnalyticsEngineDataset | undefined,
  data: ConversionTelemetry
): void {
  if (!analytics) return;

  try {
    const pairIndex = `${data.from}/${data.to}`;
    analytics.writeDataPoint({
      blobs: ['conversion', data.from, data.to, data.rateType, data.bestProvider],
      doubles: [data.amount, data.durationMs],
      indexes: [pairIndex],
    });
  } catch {
    // Non-blocking: Silently ignore telemetry write failures
  }
}
