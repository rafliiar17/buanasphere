import { describe, it, expect } from 'bun:test';
import { getLiveRatesWithCache, clearMemoryCache } from '../src/service/aggregator.ts';
import type { Rate } from '../src/domain/rate.ts';

// Mock KVNamespace for testing
class MockKVNamespace {
  public store = new Map<string, { value: string; expiration?: number }>();
  public getCount = 0;
  public putCount = 0;

  async get(key: string, type?: string): Promise<any> {
    this.getCount++;
    const item = this.store.get(key);
    if (!item) return null;
    if (type === 'json') {
      try {
        return JSON.parse(item.value);
      } catch {
        return null;
      }
    }
    return item.value;
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    this.putCount++;
    this.store.set(key, { value });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
    this.getCount = 0;
    this.putCount = 0;
  }
}

describe('Centralized D1 Database & KV Caching Ingestion Flow (SDLC)', () => {
  it('User 1 triggers fetch and saves to KV & D1; User 2 retrieves from cache with zero provider hit', async () => {
    clearMemoryCache();
    const mockKv = new MockKVNamespace() as unknown as KVNamespace;

    let providerCallCount = 0;
    const mockFetchFn = async () => {
      providerCallCount++;
      return new Response(
        JSON.stringify({
          result: 'success',
          rates: {
            IDR: 16250,
            USD: 1,
            EUR: 0.95,
            SGD: 1.33,
            JPY: 150,
          },
          time_last_update_utc: 'Wed, 02 Sep 2026 06:00:00 +0000',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    // User 1: Cold start / Cache Miss (triggers 1 ingestion cycle across providers)
    const user1Rates = await getLiveRatesWithCache({
      env: { KURS_CACHE: mockKv },
      customFetch: mockFetchFn,
    });

    expect(user1Rates.length).toBeGreaterThan(0);
    const initialCallCount = providerCallCount;
    expect(initialCallCount).toBeGreaterThan(0);

    // Verify data is now cached in KV
    const kvStored = await mockKv.get('rates:live:latest');
    expect(kvStored).not.toBeNull();
    const parsedKv = JSON.parse(kvStored!);
    expect(parsedKv.length).toBe(user1Rates.length);

    // User 2: Subsequent request within TTL
    clearMemoryCache(); // Clear in-memory to test pure KV hit
    const user2Rates = await getLiveRatesWithCache({
      env: { KURS_CACHE: mockKv },
      customFetch: mockFetchFn,
    });

    expect(user2Rates.length).toBe(user1Rates.length);
    // ZERO additional provider hits! Total calls remains strictly initialCallCount
    expect(providerCallCount).toBe(initialCallCount);
  });
});
