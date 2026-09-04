import type { MicroappHandler } from '../types.ts';
import type { Env } from '../../db/index.ts';

export const ALLOWED_POPULATION_DOMAINS = ['api.worldbank.org'];

export const WORLDBANK_POPULATION_URL =
  'https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&mrv=1&per_page=300&date=2023:2025';

export interface PopulationIngestionResult {
  indicator: string;
  source: string;
  totalCountries: number;
  lastUpdated: string;
  populations: Record<string, number>;
}

/**
 * Enforces strict domain allowlist for World Bank ingestion.
 */
export function assertPopulationUrlAllowed(urlStr: string): void {
  const parsed = new URL(urlStr);
  if (!ALLOWED_POPULATION_DOMAINS.includes(parsed.hostname)) {
    throw new Error(
      `SSRF Blocked: Host '${parsed.hostname}' is not in the allowed population ingestion domain list`
    );
  }
}

/**
 * Parses World Bank 2-element array response [metadata, [records]]
 * into a key-value mapping of ISO-3 to numeric population count.
 */
export function parseWorldBankIndicator(payload: any): Record<string, number> {
  const result: Record<string, number> = {};
  if (!Array.isArray(payload) || payload.length < 2) {
    return result;
  }

  const records = payload[1];
  if (!Array.isArray(records)) {
    return result;
  }

  for (const item of records) {
    if (!item) continue;
    const iso3 = String(item.countryiso3code || '').toUpperCase().trim();
    const val = Number(item.value);
    if (iso3.length === 3 && !isNaN(val) && val > 0) {
      result[iso3] = val;
    }
  }

  return result;
}

export const populationHandler: MicroappHandler = {
  id: 'population',
  name: 'World Bank Population Data',
  description:
    'Global country population dataset ingested from World Bank Open Data API indicator SP.POP.TOTL',
  version: '1.0.0',
  cacheTtlSeconds: 3600, // 1 hour cache TTL
  async handle(
    params: Record<string, any> = {},
    _env?: Env
  ): Promise<PopulationIngestionResult> {
    const fetchFn: typeof fetch = params.customFetch || fetch;
    const targetUrl = params.url || WORLDBANK_POPULATION_URL;

    assertPopulationUrlAllowed(targetUrl);

    const response = await fetchFn(targetUrl, {
      signal: AbortSignal.timeout(5000),
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Buanasphere-Edge-Gateway/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(
        `World Bank API returned HTTP ${response.status}: ${response.statusText}`
      );
    }

    const payload = await response.json();
    const populations = parseWorldBankIndicator(payload);

    return {
      indicator: 'SP.POP.TOTL',
      source: 'World Bank Open Data API',
      totalCountries: Object.keys(populations).length,
      lastUpdated: new Date().toISOString(),
      populations,
    };
  },
};
