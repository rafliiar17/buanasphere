import { describe, it, expect } from 'bun:test';
import { getCachedCountries, setCachedCountries, clearCountryCache } from '../src/service/country.ts';
import { ISO3_LOOKUP } from '../src/domain/country-map.ts';

// Mock KVNamespace for testing
class MockKVNamespace {
  private store = new Map<string, { value: string; expiration?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    return item.value;
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    this.store.set(key, { value });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

describe('Cloudflare KV Caching Layer & Country Service (SDLC)', () => {
  it('falls back to domain dataset when KV and DB are unavailable', async () => {
    clearCountryCache();
    const countries = await getCachedCountries();
    expect(countries.length).toBeGreaterThanOrEqual(160);
    const idn = countries.find(c => c.iso3 === 'IDN');
    expect(idn).toBeDefined();
    expect(idn?.name).toBe('Indonesia');
    expect(idn?.currencyCode).toBe('IDR');
  });

  it('stores and retrieves countries from Cloudflare KV with cache hit', async () => {
    const mockKv = new MockKVNamespace() as unknown as KVNamespace;
    clearCountryCache();

    // First call: writes to KV
    const countries = await getCachedCountries({ KURS_CACHE: mockKv });
    expect(countries.length).toBeGreaterThan(0);

    // Verify KV has the data stored
    const kvData = await mockKv.get('countries:all');
    expect(kvData).not.toBeNull();
    const parsed = JSON.parse(kvData!);
    expect(parsed.length).toBe(countries.length);

    // Second call: reads directly from KV
    const cached = await getCachedCountries({ KURS_CACHE: mockKv });
    expect(cached.length).toBe(countries.length);
  });
});
