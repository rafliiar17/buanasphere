import { describe, it, expect } from 'bun:test';
import { getLiveRatesWithCache, clearMemoryCache, AggregatorService } from '../src/service/aggregator.ts';

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

describe('On-Demand (Lazy) Ingestion Architecture Unit Tests (ADR 0021)', () => {
  it('performs on-demand fetch on first user hit, serves cache on second hit, and re-fetches when expired', async () => {
    clearMemoryCache();
    const mockKv = new MockKVNamespace() as unknown as KVNamespace;

    let providerCallCount = 0;
    const mockFetchFn = async () => {
      providerCallCount++;
      return new Response(
        JSON.stringify({
          result: 'success',
          rates: {
            IDR: 17765,
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

    // Step 1: User 1 accesses the platform (Cold start / Cache Miss)
    const user1Rates = await getLiveRatesWithCache({
      env: { KURS_CACHE: mockKv },
      customFetch: mockFetchFn as unknown as typeof fetch,
    });

    expect(user1Rates.length).toBeGreaterThan(0);
    const firstCallCount = providerCallCount;
    expect(firstCallCount).toBeGreaterThan(0);

    // Step 2: User 2 accesses within active period (Cache Hit -> Zero external calls)
    clearMemoryCache();
    const user2Rates = await getLiveRatesWithCache({
      env: { KURS_CACHE: mockKv },
      customFetch: mockFetchFn as unknown as typeof fetch,
    });

    expect(user2Rates.length).toBe(user1Rates.length);
    expect(providerCallCount).toBe(firstCallCount); // 0 additional provider hits!

    // Step 3: Cache expires (Simulating 15+ minutes idle period)
    clearMemoryCache();
    await mockKv.delete('rates:live:latest');
    await mockKv.delete('kurs:latest:rates');

    // Step 4: Next user arrives after idle period (Triggers lazy on-demand ingestion)
    const user3Rates = await getLiveRatesWithCache({
      env: { KURS_CACHE: mockKv },
      customFetch: mockFetchFn as unknown as typeof fetch,
    });

    expect(user3Rates.length).toBeGreaterThan(0);
    expect(providerCallCount).toBeGreaterThan(firstCallCount); // Re-fetched on-demand!
  });
});
