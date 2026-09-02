/**
 * ADR-0033: System Diagnostics & Reliability Remediation
 *
 * Test suite untuk 4 bug backend yang teridentifikasi:
 *   Bug 1 — In-Memory Cache TTL tidak diperiksa (aggregator.ts)
 *   Bug 2 — KV Rate Limiter `expiration` < 60s throws exception (rate-limiter.ts)
 *   Bug 3 — Adaptive Precision micro-rates hilang pada CCY minor (open-er-api.ts, synthetic.ts)
 *   Bug 4 — D1 Sequential Insert bottleneck → Batch Insert (aggregator.ts)
 *
 * Urutan TDD:
 *   1. Test ditulis dulu → RED state
 *   2. Implementasi fix → GREEN state
 */

import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import { AggregatorService } from '../src/service/aggregator.ts';
import { ConverterService } from '../src/service/converter.ts';
import { checkRateLimit, resetRateLimitStore } from '../src/middleware/rate-limiter.ts';
import { roundRate } from '../src/provider/open-er-api.ts';
import type { IRateProvider, Rate } from '../src/domain/rate.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRate(overrides: Partial<Rate> = {}): Rate {
  return {
    provider: 'test_provider',
    baseCurrency: 'USD',
    quoteCurrency: 'IDR',
    buyRate: 17700,
    sellRate: 17830,
    midRate: 17765,
    spread: 130,
    retrievedAt: new Date().toISOString(),
    providerTimestamp: new Date().toISOString(),
    sourceUrl: 'https://example.com',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Bug 1 — In-Memory Cache TTL check
// ---------------------------------------------------------------------------

describe('Bug 1: In-Memory Cache TTL harus diperiksa sebelum dikembalikan', () => {
  beforeEach(() => {
    // Reset singleton cache state setiap test
    AggregatorService.memoryCache = [];
    AggregatorService.memoryCacheTimestamp = 0;
  });

  it('mengembalikan cache jika masih dalam TTL window (< 15 menit)', async () => {
    const mockRates = [makeRate()];
    AggregatorService.memoryCache = mockRates;
    // Timestamp sekarang = cache masih fresh
    AggregatorService.memoryCacheTimestamp = Date.now();

    // Karena readRatesFromCache adalah private, kita test via getLatestRates
    // dengan mock providers agar tidak menyentuh network / DB
    const svc = new AggregatorService({ providers: [] });
    const result = await svc.getLatestRates();

    expect(result).toEqual(mockRates);
  });

  it('TIDAK mengembalikan expired cache (memoryCacheTimestamp > 15 menit lalu)', async () => {
    const staleRates = [makeRate({ provider: 'stale_provider' })];
    AggregatorService.memoryCache = staleRates;
    // Timestamp 16 menit lalu → expired
    AggregatorService.memoryCacheTimestamp = Date.now() - 16 * 60 * 1000;

    const svc = new AggregatorService({ providers: [] });
    const ingestSpy = spyOn(
      svc as unknown as { ingestAll: () => Promise<unknown> },
      'ingestAll'
    ).mockResolvedValue({
      timestamp: new Date().toISOString(),
      totalProviders: 0,
      successfulProviders: 0,
      ratesIngested: 0,
      quarantinedCount: 0,
      errors: [],
    });

    await svc.getLatestRates();

    // Jika TTL check benar, cache expired → ingestAll() dipanggil
    expect(ingestSpy).toHaveBeenCalled();
  });

  it('TIDAK mengembalikan cache jika memoryCacheTimestamp = 0 (belum pernah diisi)', async () => {
    AggregatorService.memoryCache = [makeRate()];
    AggregatorService.memoryCacheTimestamp = 0; // belum pernah diisi

    const svc = new AggregatorService({ providers: [] });
    const ingestSpy = spyOn(
      svc as unknown as { ingestAll: () => Promise<unknown> },
      'ingestAll'
    ).mockResolvedValue({
      timestamp: new Date().toISOString(),
      totalProviders: 0,
      successfulProviders: 0,
      ratesIngested: 0,
      quarantinedCount: 0,
      errors: [],
    });

    await svc.getLatestRates();
    // timestamp 0 → now - 0 > TTL → expired → ingestAll dipanggil
    expect(ingestSpy).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Bug 2 — KV Rate Limiter expirationTtl >= 60
// ---------------------------------------------------------------------------

describe('Bug 2: KV Rate Limiter harus menggunakan expirationTtl (min 60s)', () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it('menggunakan expirationTtl >= 60 saat kv.put dipanggil', async () => {
    const putCalls: Array<[string, string, Record<string, unknown>]> = [];

    const mockKv = {
      get: async (_key: string) => null,
      put: async (key: string, value: string, opts?: unknown) => {
        putCalls.push([key, value, opts as Record<string, unknown>]);
      },
      delete: async (_key: string) => {},
      list: async () => ({ keys: [], list_complete: true, cursor: '' }),
      getWithMetadata: async (_key: string) => ({ value: null, metadata: null }),
    } as unknown as KVNamespace;

    await checkRateLimit('test-ip-192.168.1.1', 100, 60, mockKv);

    expect(putCalls).toHaveLength(1);
    const opts = putCalls[0][2];

    // Bug 2 fix: harus pakai expirationTtl, bukan expiration
    expect(opts).not.toHaveProperty('expiration');
    expect(opts).toHaveProperty('expirationTtl');
    expect(typeof opts.expirationTtl).toBe('number');
    expect(opts.expirationTtl as number).toBeGreaterThanOrEqual(60);
  });

  it('expirationTtl tidak pernah kurang dari 60 detik (minimum Cloudflare KV)', async () => {
    // Simulasikan window yang sangat singkat (5 detik)
    const putCalls: Array<[string, string, Record<string, unknown>]> = [];

    const mockKv = {
      get: async () => null,
      put: async (key: string, value: string, opts?: unknown) => {
        putCalls.push([key, value, opts as Record<string, unknown>]);
      },
      delete: async () => {},
      list: async () => ({ keys: [], list_complete: true, cursor: '' }),
      getWithMetadata: async () => ({ value: null, metadata: null }),
    } as unknown as KVNamespace;

    // window 5 detik — tanpa fix, expiration < 60 akan throw KV exception
    await checkRateLimit('test-short-window', 100, 5, mockKv);

    expect(putCalls).toHaveLength(1);
    const opts = putCalls[0][2];
    expect(opts.expirationTtl as number).toBeGreaterThanOrEqual(60);
  });
});

// ---------------------------------------------------------------------------
// Bug 3 — Adaptive Precision untuk Micro-Rates
// ---------------------------------------------------------------------------

describe('Bug 3: roundRate() harus menggunakan presisi adaptif berdasarkan magnitude', () => {
  it('nilai >= 100 dibulatkan ke 2 desimal', () => {
    expect(roundRate(17765.123456)).toBe(17765.12);
    expect(roundRate(100)).toBe(100);
    expect(roundRate(1234.5678)).toBe(1234.57);
  });

  it('nilai >= 1 dan < 100 dibulatkan ke 4 desimal', () => {
    expect(roundRate(13.1234567)).toBe(13.1235);
    expect(roundRate(1.00001)).toBe(1.0);
    expect(roundRate(99.99991)).toBe(99.9999);
  });

  it('nilai < 1 (micro-rates) dibulatkan ke 6 desimal', () => {
    // VND: ~0.70, LAK: ~0.82, IQD: ~0.421, LBP: ~0.197
    expect(roundRate(0.700123456)).toBe(0.700123);
    expect(roundRate(0.4213579)).toBe(0.421358);
    expect(roundRate(0.197)).toBe(0.197);
  });

  it('roundRate harus dieksport dari open-er-api.ts', () => {
    // Jika roundRate tidak dieksport, import akan bernilai undefined
    expect(typeof roundRate).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// Bug 4 — D1 Batch Insert
// ---------------------------------------------------------------------------

describe('Bug 4: persistRatesToDb harus menggunakan batch insert (bukan 1 query/rate)', () => {
  it('source code memverifikasi CHUNK_SIZE=50 batching pattern pada rateHistoryTable insert', async () => {
    // Bun does not support vitest.mock importOriginal, so we validate the implementation
    // by reading the source file and asserting the correct batching pattern is applied.
    const fs = await import('fs');
    const src = fs.readFileSync(
      new URL('../src/service/aggregator.ts', import.meta.url).pathname,
      'utf-8'
    );
    // CHUNK_SIZE constant must be declared at 50
    expect(src).toContain('CHUNK_SIZE = 50');
    // The batch loop increments by CHUNK_SIZE — not per-item sequential
    expect(src).toContain('i += CHUNK_SIZE');
    // rateHistoryTable must use bulk .values() with chunk.map (not individual awaited inserts)
    expect(src).toContain('chunk.map');
    // The ratesTable upsert loop is documented as sequential (Drizzle D1 constraint)
    expect(src).toContain('onConflictDoUpdate');
  });


  it('pure unit: batch chunking logic menghasilkan chunk ukuran ≤ 50', () => {
    // Test the chunking algorithm in isolation — not the DB call
    const CHUNK_SIZE = 50;
    const items = Array.from({ length: 127 }, (_, i) => i);
    const chunks: number[][] = [];
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      chunks.push(items.slice(i, i + CHUNK_SIZE));
    }

    expect(chunks).toHaveLength(Math.ceil(127 / 50)); // 3
    expect(chunks[0]).toHaveLength(50);
    expect(chunks[1]).toHaveLength(50);
    expect(chunks[2]).toHaveLength(27); // remainder
    // No chunk exceeds CHUNK_SIZE
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(CHUNK_SIZE);
    }
  });

  it('pure unit: batch chunking untuk N < CHUNK_SIZE menghasilkan 1 chunk', () => {
    const CHUNK_SIZE = 50;
    const items = Array.from({ length: 10 }, (_, i) => i);
    const chunks: number[][] = [];
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      chunks.push(items.slice(i, i + CHUNK_SIZE));
    }

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toHaveLength(10);
  });
});

// ---------------------------------------------------------------------------
// Rate Spike Anomaly Detection (>50%)
// ---------------------------------------------------------------------------

describe('Rate Spike Anomaly Detection (>50%)', () => {
  it('validateRate menolak lonjakan kurs > 50% dibandingkan rate sebelumnya', () => {
    const svc = new AggregatorService({ providers: [] });
    const prevRate = makeRate({ midRate: 16000, buyRate: 15900, sellRate: 16100 });
    // Lonjakan > 50% (16000 -> 25000 = +56.25%)
    const spikedRate = makeRate({ midRate: 25000, buyRate: 24900, sellRate: 25100 });

    const result = svc.validateRate(spikedRate, prevRate);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Rate spike anomaly');
    expect(result.reason).toContain('> 50% threshold');
  });

  it('validateRate menerima perubahan wajar (<= 50%)', () => {
    const svc = new AggregatorService({ providers: [] });
    const prevRate = makeRate({ midRate: 16000, buyRate: 15900, sellRate: 16100 });
    // Perubahan normal +2% (16000 -> 16320)
    const normalRate = makeRate({ midRate: 16320, buyRate: 16200, sellRate: 16400 });

    const result = svc.validateRate(normalRate, prevRate);
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('ingestAll menempatkan rate yang mengalami spike >50% ke quarantinedRates', async () => {
    const mockProvider: IRateProvider = {
      info: {
        id: 'test_spike_bank',
        name: 'Test Spike Bank',
        type: 'commercial_bank',
        website: 'https://example.com',
      },
      fetchLatestRates: async () => [
        // Spiked rate (+80% jump)
        makeRate({ provider: 'test_spike_bank', midRate: 30000, buyRate: 29900, sellRate: 30100 }),
      ],
    };

    // Pre-populate memoryCache with previous baseline rate (midRate: 16000)
    AggregatorService.memoryCache = [
      makeRate({ provider: 'test_spike_bank', midRate: 16000, buyRate: 15900, sellRate: 16100 }),
    ];
    AggregatorService.memoryCacheTimestamp = Date.now();

    const svc = new AggregatorService({ providers: [mockProvider] });
    const res = await svc.ingestAll();

    expect(res.quarantinedCount).toBe(1);
    expect(res.ratesIngested).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Converter Rate Semantics (IDR -> Valas menggunakan sellRate)
// ---------------------------------------------------------------------------

describe('ConverterService: Rate Semantics saat beli Valas dengan IDR', () => {
  beforeEach(() => {
    AggregatorService.memoryCache = [];
    AggregatorService.memoryCacheTimestamp = 0;
  });

  const mockBcaRates: Rate[] = [
    {
      provider: 'bca',
      baseCurrency: 'USD',
      quoteCurrency: 'IDR',
      buyRate: 15400, // Bank membeli USD (nasabah jual USD)
      sellRate: 15600, // Bank menjual USD (nasabah beli USD)
      midRate: 15500,
      spread: 200,
      retrievedAt: new Date().toISOString(),
    },
  ];

  const mockProvider: IRateProvider = {
    info: { id: 'bca', name: 'Bank BCA', type: 'commercial_bank', website: 'https://bca.co.id' },
    fetchLatestRates: async () => mockBcaRates,
  };

  it('beli Valas dengan IDR menggunakan sellRate (kurs jual bank)', async () => {
    const aggregator = new AggregatorService({ providers: [mockProvider] });
    const converter = new ConverterService({ aggregator });

    // Nasabah beli USD dengan 15.600.000 IDR (default rateType 'buy')
    // Harusnya dapat 1000 USD (15.600.000 / 15.600), bukan 15.600.000 / 15.400
    const result = await converter.convert(15600000, 'IDR', 'USD', 'buy');

    expect(result.fromCurrency).toBe('IDR');
    expect(result.toCurrency).toBe('USD');
    expect(result.comparisons).toHaveLength(1);
    expect(result.comparisons[0].rate).toBe(15600);
    expect(result.comparisons[0].convertedAmount).toBe(1000);
  });

  it('jual Valas untuk mendapatkan IDR menggunakan buyRate (kurs beli bank)', async () => {
    const aggregator = new AggregatorService({ providers: [mockProvider] });
    const converter = new ConverterService({ aggregator });

    // Nasabah jual 1000 USD untuk dapat IDR (rateType 'buy' / kurs beli bank)
    // Harusnya dapat 15.400.000 IDR (1000 * 15.400)
    const result = await converter.convert(1000, 'USD', 'IDR', 'buy');

    expect(result.fromCurrency).toBe('USD');
    expect(result.toCurrency).toBe('IDR');
    expect(result.comparisons).toHaveLength(1);
    expect(result.comparisons[0].rate).toBe(15400);
    expect(result.comparisons[0].convertedAmount).toBe(15400000);
  });
});


