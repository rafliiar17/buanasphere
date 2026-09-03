/**
 * Live Population Service (World Bank Open Data API)
 * ADR 0066: Connects /population to real-time World Bank demographic data with offline fallback.
 */

import {
  POPULATION_DATASET,
  type CountryPopulationData,
} from '$lib/framework/geoglobe/data/populationData';

export const WORLDBANK_POPULATION_URL =
  'https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&mrv=1&per_page=300&date=2023:2025';

const CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes

export interface LivePopulationResult {
  data: Record<string, CountryPopulationData>;
  isLive: boolean;
  source: 'worldbank_live' | 'fallback_bundled';
  lastUpdated: string;
  totalCountries: number;
}

let cachedResult: LivePopulationResult | null = null;
let lastCacheTime = 0;

/**
 * Resets the in-memory cache (primarily for tests and force refresh)
 */
export function clearPopulationCache(): void {
  cachedResult = null;
  lastCacheTime = 0;
}

/**
 * Parses World Bank 2-element array response [metadata, [records]]
 * Returns key-value mapping of ISO-3 to numeric indicator value.
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

/**
 * Fetches real-time World Bank population with strict 5s timeout and offline fallback
 */
export async function fetchWorldBankPopulation(options?: {
  customFetch?: typeof fetch;
  forceRefresh?: boolean;
  timeoutMs?: number;
}): Promise<LivePopulationResult> {
  const now = Date.now();
  if (
    !options?.forceRefresh &&
    !options?.customFetch &&
    cachedResult &&
    now - lastCacheTime < CACHE_TTL_MS
  ) {
    return cachedResult;
  }

  const fetchClient = options?.customFetch || (typeof fetch !== 'undefined' ? fetch : null);
  const timeoutMs = options?.timeoutMs || 5000;

  if (!fetchClient) {
    return getFallbackResult();
  }

  try {
    const res = await fetchClient(WORLDBANK_POPULATION_URL, {
      signal: AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined,
    });

    if (!res.ok) {
      return getFallbackResult();
    }

    const payload = await res.json();
    const livePopMap = parseWorldBankIndicator(payload);

    if (Object.keys(livePopMap).length === 0) {
      return getFallbackResult();
    }

    // Merge live population data with base dataset
    const mergedData: Record<string, CountryPopulationData> = {};
    for (const [iso3, base] of Object.entries(POPULATION_DATASET)) {
      if (livePopMap[iso3]) {
        mergedData[iso3] = {
          ...base,
          totalPopulation: livePopMap[iso3],
          source: 'World Bank Live',
        };
      } else {
        mergedData[iso3] = base;
      }
    }

    const result: LivePopulationResult = {
      data: mergedData,
      isLive: true,
      source: 'worldbank_live',
      lastUpdated: new Date().toISOString(),
      totalCountries: Object.keys(mergedData).length,
    };

    cachedResult = result;
    lastCacheTime = now;
    return result;
  } catch (_err) {
    return getFallbackResult();
  }
}

function getFallbackResult(): LivePopulationResult {
  return {
    data: POPULATION_DATASET,
    isLive: false,
    source: 'fallback_bundled',
    lastUpdated: new Date().toISOString(),
    totalCountries: Object.keys(POPULATION_DATASET).length,
  };
}
