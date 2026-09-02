import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { createApp } from '../src/index.ts';
import { OpenERApiProvider, validateProviderUrl } from '../src/provider/open-er-api.ts';
import { ConverterService } from '../src/service/converter.ts';
import { AggregatorService } from '../src/service/aggregator.ts';
import {
  checkRateLimit,
  extractClientIp,
  resetRateLimitStore,
} from '../src/middleware/rate-limiter.ts';
import type { IRateProvider } from '../src/domain/rate.ts';

describe('Security Remediation & Edge Hardening Suite (ADR-0010)', () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  // [SEC-01] Active sliding-window rate limiter
  describe('[SEC-01] Active Sliding-Window Rate Limiter', () => {
    it('should extract client IP accurately with precedence: CF-Connecting-IP > X-Forwarded-For > Fallback', () => {
      const reqCf = new Request('http://localhost/api/v1/health', {
        headers: { 'cf-connecting-ip': '203.0.113.195' },
      });
      expect(extractClientIp(reqCf)).toBe('203.0.113.195');

      const reqXff = new Request('http://localhost/api/v1/health', {
        headers: { 'x-forwarded-for': '198.51.100.24, 10.0.0.1' },
      });
      expect(extractClientIp(reqXff)).toBe('198.51.100.24');

      const reqEmpty = new Request('http://localhost/api/v1/health');
      expect(extractClientIp(reqEmpty)).toBe('127.0.0.1');
    });

    it('should decrement remaining quota and return dynamic rate limit headers', async () => {
      const res1 = await checkRateLimit('test-ip-1', 5, 60);
      expect(res1.allowed).toBe(true);
      expect(res1.limit).toBe(5);
      expect(res1.remaining).toBe(4);
      expect(res1.reset).toBeGreaterThan(Math.floor(Date.now() / 1000));

      const res2 = await checkRateLimit('test-ip-1', 5, 60);
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(3);
    });

    it('should block requests and return 429 Too Many Requests when quota is exhausted', async () => {
      const app = createApp();

      // Exhaust limit of 3 requests for this IP
      for (let i = 0; i < 3; i++) {
        await checkRateLimit('spam-ip', 3, 60);
      }

      const overLimitStatus = await checkRateLimit('spam-ip', 3, 60);
      expect(overLimitStatus.allowed).toBe(false);
      expect(overLimitStatus.remaining).toBe(0);

      // Verify app integration responds with 429 when client exceeds limit
      const ip = 'rate-limited-user-ip';
      // Make 100 requests to trigger rate limit (default limit 100)
      for (let i = 0; i < 100; i++) {
        await app.handle(
          new Request('http://localhost/api/v1/health', {
            headers: { 'cf-connecting-ip': ip },
          })
        );
      }

      const throttledResponse = await app.handle(
        new Request('http://localhost/api/v1/health', {
          headers: { 'cf-connecting-ip': ip },
        })
      );

      expect(throttledResponse.status).toBe(429);
      expect(throttledResponse.headers.get('x-ratelimit-remaining')).toBe('0');
      const body = (await throttledResponse.json()) as {
        success?: boolean;
        error?: string;
        message?: string;
      };
      expect(body.error).toBe('Too Many Requests');
    });
  });

  // [SEC-02] Ingestion 5MB response size limit
  describe('[SEC-02] Ingestion 5MB Response Size Limit', () => {
    it('should reject response when Content-Length exceeds 5MB limit', async () => {
      const customFetch = mock(() =>
        Promise.resolve(
          new Response('{}', {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': String(6 * 1024 * 1024), // 6 MB
            },
          })
        )
      ) as unknown as typeof fetch;

      const provider = new OpenERApiProvider({ customFetch });
      expect(provider.fetchLatestRates()).rejects.toThrow(/exceeds 5MB/i);
    });

    it('should reject response when body content exceeds 5MB limit', async () => {
      const oversizedPayload = 'a'.repeat(5 * 1024 * 1024 + 100);
      const customFetch = mock(() =>
        Promise.resolve(
          new Response(oversizedPayload, {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      ) as unknown as typeof fetch;

      const provider = new OpenERApiProvider({ customFetch });
      expect(provider.fetchLatestRates()).rejects.toThrow(/exceeds 5MB/i);
    });
  });

  // [SEC-03] POST /api/v1/alerts Schema Validation
  describe('[SEC-03] POST /api/v1/alerts Schema Validation', () => {
    const app = createApp();

    it('should accept valid alert registration payload', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'trader@example.com',
            baseCurrency: 'USD',
            targetCurrency: 'IDR',
            targetRate: 16500,
            condition: 'above',
          }),
        })
      );

      expect(response.status).toBe(200);
      const data = (await response.json()) as {
        success: boolean;
        message: string;
        data?: {
          email: string;
          baseCurrency: string;
          targetCurrency: string;
          targetRate: number;
          condition: string;
        };
      };
      expect(data.success).toBe(true);
      expect(data.message).toContain('trader@example.com');
    });

    it('should reject invalid email format with validation error (400 or 422)', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'not-an-email',
            baseCurrency: 'USD',
            targetRate: 16500,
          }),
        })
      );

      expect([400, 422]).toContain(response.status);
    });

    it('should reject missing required fields with validation error', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'valid@example.com',
          }),
        })
      );

      expect([400, 422]).toContain(response.status);
    });

    it('should reject negative or zero targetRate with validation error', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'valid@example.com',
            baseCurrency: 'USD',
            targetRate: -100,
            condition: 'above',
          }),
        })
      );

      expect([400, 422]).toContain(response.status);
    });
  });

  // [SEC-04] Outbound Domain Allowlist
  describe('[SEC-04] Outbound Domain Allowlist & SSRF Guard', () => {
    it('should allow legitimate provider domains and protocols', () => {
      expect(validateProviderUrl('https://open.er-api.com/v6/latest/USD')).toBe(true);
      expect(validateProviderUrl('https://www.bi.go.id/biweb/api/rates')).toBe(true);
      expect(validateProviderUrl('https://bi.go.id/rates')).toBe(true);
      expect(validateProviderUrl('https://www.bca.co.id/api/forex')).toBe(true);
      expect(validateProviderUrl('https://bca.co.id/api/forex')).toBe(true);
      expect(validateProviderUrl('https://bankmandiri.co.id/rates')).toBe(true);
      expect(validateProviderUrl('http://localhost:3000/mock-rates')).toBe(true);
      expect(validateProviderUrl('http://127.0.0.1:8787/rates')).toBe(true);
    });

    it('should reject untrusted domains, cloud metadata endpoints, and non-approved protocols', () => {
      expect(validateProviderUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
      expect(validateProviderUrl('https://malicious-attacker.com/rates')).toBe(false);
      expect(validateProviderUrl('ftp://open.er-api.com/rates')).toBe(false);
      expect(validateProviderUrl('http://open.er-api.com/insecure')).toBe(false);
      expect(validateProviderUrl('javascript:alert(1)')).toBe(false);
      expect(validateProviderUrl('file:///etc/passwd')).toBe(false);
    });

    it('should throw error in OpenERApiProvider when initialized with untrusted domain', async () => {
      expect(() => {
        new OpenERApiProvider({ baseUrl: 'https://evil-hacker.com/rates' });
      }).toThrow(/untrusted|disallowed/i);
    });
  });

  // [SEC-05] Single-Flight Ingestion Promise Lock
  describe('[SEC-05] Single-Flight Promise Lock (Stampede Prevention)', () => {
    it('should reuse the in-flight ingestion promise for concurrent ingestAll() calls', async () => {
      let fetchCallCount = 0;
      const mockProvider: IRateProvider = {
        info: {
          id: 'test_provider',
          name: 'Test Provider',
          type: 'commercial_bank',
          website: 'https://bca.co.id',
        },
        fetchLatestRates: async () => {
          fetchCallCount++;
          await new Promise((resolve) => setTimeout(resolve, 50));
          return [
            {
              provider: 'test_provider',
              baseCurrency: 'USD',
              quoteCurrency: 'IDR',
              buyRate: 15400,
              sellRate: 15600,
              midRate: 15500,
              spread: 200,
              retrievedAt: new Date().toISOString(),
            },
          ];
        },
      };

      const aggregator = new AggregatorService({ providers: [mockProvider] });

      // Trigger 5 concurrent ingest calls simultaneously
      const [res1, res2, res3, res4, res5] = await Promise.all([
        aggregator.ingestAll(),
        aggregator.ingestAll(),
        aggregator.ingestAll(),
        aggregator.ingestAll(),
        aggregator.ingestAll(),
      ]);

      expect(fetchCallCount).toBe(1);
      expect(res1.ratesIngested).toBe(1);
      expect(res2.ratesIngested).toBe(1);
      expect(res3.ratesIngested).toBe(1);
      expect(res4.ratesIngested).toBe(1);
      expect(res5.ratesIngested).toBe(1);
    });
  });

  // [SEC-07] Finite Number & Arithmetic Guards in ConverterService
  describe('[SEC-07] Finite Number and Arithmetic Guards', () => {
    const mockProvider: IRateProvider = {
      info: {
        id: 'test_bank',
        name: 'Test Bank',
        type: 'commercial_bank',
        website: 'https://bca.co.id',
      },
      fetchLatestRates: async () => [
        {
          provider: 'test_bank',
          baseCurrency: 'USD',
          quoteCurrency: 'IDR',
          buyRate: 15500,
          sellRate: 15600,
          midRate: 15550,
          spread: 100,
          retrievedAt: new Date().toISOString(),
        },
      ],
    };

    const aggregator = new AggregatorService({ providers: [mockProvider] });
    const converter = new ConverterService({ aggregator });

    it('should reject non-finite and extreme numbers', async () => {
      await expect(converter.convert(Infinity, 'USD', 'IDR')).rejects.toThrow(/positive/i);
      await expect(converter.convert(-Infinity, 'USD', 'IDR')).rejects.toThrow(/positive/i);
      await expect(converter.convert(NaN, 'USD', 'IDR')).rejects.toThrow(/positive/i);
      await expect(converter.convert(0, 'USD', 'IDR')).rejects.toThrow(/positive/i);
      await expect(converter.convert(-50, 'USD', 'IDR')).rejects.toThrow(/positive/i);
      await expect(converter.convert(1e16, 'USD', 'IDR')).rejects.toThrow(/1e15/i);
    });

    it('should allow valid large finite numbers <= 1e15', async () => {
      const res = await converter.convert(1e12, 'USD', 'USD');
      expect(res.amount).toBe(1e12);
      expect(res.bestOption?.convertedAmount).toBe(1e12);
    });
  });

  // [SEC-08] Security Response Headers
  describe('[SEC-08] Standard Defense-in-Depth Security Headers', () => {
    const app = createApp();

    it('should emit hardened security headers on all responses', async () => {
      const response = await app.handle(new Request('http://localhost/api/v1/health'));

      expect(response.headers.get('x-frame-options')).toBe('DENY');
      expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
      expect(response.headers.get('permissions-policy')).toBe(
        'geolocation=(), camera=(), microphone=()'
      );
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    });
  });
});
