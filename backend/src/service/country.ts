import { eq } from 'drizzle-orm';
import { countriesTable, type CountryRow, type InsertCountryRow } from '../db/schema.ts';
import { getDb, type Env } from '../db/index.ts';
import {
  COUNTRY_CURRENCY_LIST,
  ISO3_LOOKUP,
  getCountryByIso3 as domainGetCountryByIso3,
  getAllCountryMappings,
} from '../domain/country-map.ts';
import { logger } from '../logger/index.ts';

export interface CountryItem {
  iso3: string;
  name: string;
  countryName?: string;
  currencyCode: string;
  currencyName: string;
  flagEmoji: string;
  region: string;
  capital?: string | null;
  lat?: number | null;
  lon?: number | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const KV_COUNTRIES_CACHE_KEY = 'countries:all';
export const COUNTRIES_CACHE_TTL_SECONDS = 86400; // 24 hours

// ASEAN member states + observer
const ASEAN_ISO3 = new Set([
  'IDN', 'SGP', 'MYS', 'THA', 'PHL', 'VNM', 'MMR', 'KHM', 'LAO', 'BRN', 'TLS'
]);

let memoryCountriesCache: CountryItem[] | null = null;

function toCountryItem(
  entry:
    | CountryRow
    | InsertCountryRow
    | {
        iso3: string;
        countryName: string;
        currencyCode: string;
        currencyName: string;
        flagEmoji: string;
        region: string;
      }
): CountryItem {
  const now = new Date().toISOString();
  if ('name' in entry) {
    return {
      iso3: entry.iso3,
      name: entry.name,
      countryName: entry.name,
      currencyCode: entry.currencyCode,
      currencyName: entry.currencyName,
      flagEmoji: entry.flagEmoji,
      region: entry.region,
      capital: entry.capital ?? null,
      lat: entry.lat ?? null,
      lon: entry.lon ?? null,
      isActive: entry.isActive ?? true,
      createdAt: entry.createdAt ?? now,
      updatedAt: entry.updatedAt ?? now,
    };
  }

  return {
    iso3: entry.iso3,
    name: entry.countryName,
    countryName: entry.countryName,
    currencyCode: entry.currencyCode,
    currencyName: entry.currencyName,
    flagEmoji: entry.flagEmoji,
    region: entry.region,
    capital: null,
    lat: null,
    lon: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Clear in-memory country cache (useful for testing or cache invalidation).
 */
export function clearCountryCache(): void {
  memoryCountriesCache = null;
}

/**
 * Explicitly set countries into in-memory and Cloudflare KV cache.
 */
export async function setCachedCountries(countries: CountryItem[], env?: Env): Promise<void> {
  memoryCountriesCache = countries;
  if (env?.KURS_CACHE) {
    try {
      await env.KURS_CACHE.put(
        KV_COUNTRIES_CACHE_KEY,
        JSON.stringify(countries),
        { expirationTtl: COUNTRIES_CACHE_TTL_SECONDS }
      );
    } catch (err) {
      logger.warn({ err }, 'Failed writing countries list to Cloudflare KV');
    }
  }
}

/**
 * Retrieves country list with 3-tier caching:
 * Tier 1: In-memory cache
 * Tier 2: Cloudflare KV ('countries:all')
 * Tier 3: D1 Database ('countries' table)
 * Tier 4 Fallback: In-memory domain dataset (195+ entries)
 */
export async function getCachedCountries(env?: Env): Promise<CountryItem[]> {
  // Tier 1: In-memory cache
  if (memoryCountriesCache && memoryCountriesCache.length > 0) {
    return memoryCountriesCache;
  }

  // Tier 2: Cloudflare KV
  if (env?.KURS_CACHE) {
    try {
      const kvData = await env.KURS_CACHE.get(KV_COUNTRIES_CACHE_KEY);
      if (kvData) {
        const parsed = JSON.parse(kvData) as CountryItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryCountriesCache = parsed;
          return parsed;
        }
      }
    } catch (err) {
      logger.warn({ err }, 'Failed reading countries list from Cloudflare KV');
    }
  }

  // Tier 3: D1 Database
  const db = getDb(env);
  if (db) {
    try {
      const rows = await db
        .select()
        .from(countriesTable)
        .where(eq(countriesTable.isActive, true));

      if (rows.length > 0) {
        const items = rows.map((r) => toCountryItem(r));
        await setCachedCountries(items, env);
        return items;
      }
    } catch (err) {
      logger.warn({ err }, 'Failed reading countries from D1 database');
    }
  }

  // Tier 4 Fallback: Domain list
  const fallbackItems = getAllCountryMappings().map((entry) => toCountryItem(entry));
  await setCachedCountries(fallbackItems, env);
  return fallbackItems;
}

/**
 * Lookup single country by ISO-3 code (case-insensitive).
 */
export async function getCountryByIso3(iso3: string, env?: Env): Promise<CountryItem | undefined> {
  if (!iso3) return undefined;
  const upper = iso3.toUpperCase();

  const countries = await getCachedCountries(env);
  const matched = countries.find((c) => c.iso3.toUpperCase() === upper);
  if (matched) return matched;

  // Fallback domain lookup (including alias handling e.g. UGX -> UGA)
  const domainEntry = domainGetCountryByIso3(upper);
  if (domainEntry) {
    return toCountryItem(domainEntry);
  }

  return undefined;
}

/**
 * Filter country list by region (supports standard regions + 'asean').
 */
export function filterCountriesByRegion(countries: CountryItem[], region?: string): CountryItem[] {
  if (!region) return countries;

  const normalized = region.trim().toLowerCase().replace(/[-_]/g, ' ');

  if (normalized === 'asean') {
    return countries.filter(
      (c) => ASEAN_ISO3.has(c.iso3.toUpperCase()) || c.region.toLowerCase() === 'asean'
    );
  }

  return countries.filter(
    (c) => c.region.toLowerCase().replace(/[-_]/g, ' ') === normalized
  );
}

/**
 * Seeds countries from domain mapping into D1 database if empty.
 */
export async function seedCountriesToDb(env?: Env): Promise<{
  success: boolean;
  seeded: number;
  message: string;
  total?: number;
}> {
  const db = getDb(env);
  if (!db) {
    return {
      success: false,
      seeded: 0,
      message: 'D1 database binding (DB) is not configured',
    };
  }

  try {
    const existing = await db.select().from(countriesTable);
    if (existing.length > 0) {
      return {
        success: true,
        seeded: 0,
        message: `Countries table already contains ${existing.length} records`,
        total: existing.length,
      };
    }

    const now = new Date().toISOString();
    const rows: InsertCountryRow[] = COUNTRY_CURRENCY_LIST.map((c) => ({
      iso3: c.iso3,
      name: c.countryName,
      currencyCode: c.currencyCode,
      currencyName: c.currencyName,
      flagEmoji: c.flagEmoji,
      region: c.region,
      capital: null,
      lat: null,
      lon: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }));

    // Batch insert into D1 (chunks of 50 to stay well under D1 SQL parameter limits)
    const chunkSize = 50;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      await db.insert(countriesTable).values(chunk);
    }

    const mappedItems = rows.map((r) => toCountryItem(r));
    await setCachedCountries(mappedItems, env);

    return {
      success: true,
      seeded: rows.length,
      message: `Successfully seeded ${rows.length} countries into D1 database`,
      total: rows.length,
    };
  } catch (err: any) {
    logger.error({ err }, 'Error seeding countries to D1 database');
    return {
      success: false,
      seeded: 0,
      message: `Failed seeding countries: ${err?.message || String(err)}`,
    };
  }
}
