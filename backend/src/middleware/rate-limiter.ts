import { Elysia } from 'elysia';
import { logger } from '../logger/index.ts';

export interface RateLimitOptions {
  limit?: number;
  windowSeconds?: number;
  kv?: KVNamespace;
}

export interface RateLimitStatus {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface MemoryLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryLimitEntry>();

/**
 * Extract client IP with Cloudflare / Edge proxy precedence.
 */
export function extractClientIp(request: Request): string {
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp && cfConnectingIp.trim().length > 0) {
    return cfConnectingIp.trim();
  }

  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor && xForwardedFor.trim().length > 0) {
    const first = xForwardedFor.split(',')[0];
    if (first && first.trim().length > 0) {
      return first.trim();
    }
  }

  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp && xRealIp.trim().length > 0) {
    return xRealIp.trim();
  }

  return '127.0.0.1';
}

/**
 * Check rate limit for a given key against sliding window.
 */
export async function checkRateLimit(
  key: string,
  limit = 100,
  windowSeconds = 60,
  kv?: KVNamespace
): Promise<RateLimitStatus> {
  const now = Math.floor(Date.now() / 1000);
  const resetAt = now + windowSeconds;

  // Cloudflare KV rate limiting if bound
  if (kv) {
    try {
      const kvKey = `ratelimit:${key}`;
      const dataStr = await kv.get(kvKey);
      let count = 0;
      let kvResetAt = resetAt;

      if (dataStr) {
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed && typeof parsed.count === 'number' && parsed.resetAt > now) {
            count = parsed.count;
            kvResetAt = parsed.resetAt;
          }
        } catch {
          // ignore parse error
        }
      }

      count += 1;
      const remaining = Math.max(0, limit - count);
      const allowed = count <= limit;

      await kv.put(
        kvKey,
        JSON.stringify({ count, resetAt: kvResetAt }),
        { expiration: kvResetAt }
      );

      return {
        allowed,
        limit,
        remaining,
        reset: kvResetAt,
      };
    } catch (err) {
      logger.warn(
        { error: err instanceof Error ? err.message : String(err) },
        'KV rate limiter check failed, falling back to memory store'
      );
    }
  }

  // In-memory sliding window store fallback
  // Auto-prune expired keys to prevent unbounded memory growth in long-running processes
  if (memoryStore.size > 500) {
    for (const [k, v] of memoryStore.entries()) {
      if (v.resetAt <= now) {
        memoryStore.delete(k);
      }
    }
  }

  const entry = memoryStore.get(key);
  let count = 0;
  let entryResetAt = resetAt;

  if (entry && entry.resetAt > now) {
    count = entry.count;
    entryResetAt = entry.resetAt;
  } else {
    count = 0;
    entryResetAt = resetAt;
  }

  count += 1;
  memoryStore.set(key, { count, resetAt: entryResetAt });

  const remaining = Math.max(0, limit - count);
  const allowed = count <= limit;

  return {
    allowed,
    limit,
    remaining,
    reset: entryResetAt,
  };
}

/**
 * Reset memory store (used in test suites).
 */
export function resetRateLimitStore(): void {
  memoryStore.clear();
}

/**
 * Elysia active sliding-window rate limiter middleware plugin.
 */
export const rateLimiterMiddleware = (options?: RateLimitOptions) => {
  const limit = options?.limit ?? 100;
  const windowSeconds = options?.windowSeconds ?? 60;

  return new Elysia({ name: 'rate-limiter-middleware', aot: false }).onRequest(
    async ({ request, set }) => {
      const ip = extractClientIp(request);
      const status = await checkRateLimit(ip, limit, windowSeconds, options?.kv);

      set.headers['X-RateLimit-Limit'] = String(status.limit);
      set.headers['X-RateLimit-Remaining'] = String(status.remaining);
      set.headers['X-RateLimit-Reset'] = String(status.reset);

      if (!status.allowed) {
        set.status = 429;
        return {
          success: false,
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
        };
      }
    }
  );
};
