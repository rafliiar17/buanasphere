import { describe, it, expect, beforeEach } from 'bun:test';
import { createApp } from '../src/index.ts';

describe('ADR 0045: Nimda Operator API Test Suite (/nimda)', () => {
  const TEST_ADMIN_KEY = 'kw_secret_adminkey_test_12345';
  let mockKv: Record<string, string> = {};

  const createMockStmt = () => {
    const stmt = {
      bind: (..._args: any[]) => stmt,
      all: async () => ({ results: [], success: true, meta: {} }),
      raw: async () => [],
      run: async () => ({ success: true, meta: { changes: 1 } }),
      first: async () => null,
    };
    return stmt;
  };

  const mockEnv: any = {
    ADMIN_SECRET_KEY: TEST_ADMIN_KEY,
    KURS_CACHE: {
      get: async (key: string) => mockKv[key] ?? null,
      put: async (key: string, val: string) => {
        mockKv[key] = val;
      },
      delete: async (key: string) => {
        delete mockKv[key];
      },
    },
    DB: {
      prepare: (_query: string) => createMockStmt(),
    },
  };

  beforeEach(() => {
    mockKv = {
      'kurs:latest:rates': JSON.stringify({ USD: 16200 }),
    };
  });

  describe('1. Security & Authentication Guard', () => {
    it('rejects unauthenticated requests without X-Admin-Key with 401', async () => {
      const app = createApp(mockEnv);
      const res = await app.handle(new Request('http://localhost/nimda/health'));
      expect(res.status).toBe(401);
      const body: any = await res.json();
      expect(body.error).toBeDefined();
    });

    it('rejects requests with invalid X-Admin-Key with 401', async () => {
      const app = createApp(mockEnv);
      const res = await app.handle(
        new Request('http://localhost/nimda/health', {
          headers: { 'X-Admin-Key': 'wrong_secret_key' },
        })
      );
      expect(res.status).toBe(401);
    });

    it('accepts requests with valid X-Admin-Key with 200', async () => {
      const app = createApp(mockEnv);
      const res = await app.handle(
        new Request('http://localhost/nimda/health', {
          headers: { 'X-Admin-Key': TEST_ADMIN_KEY },
        })
      );
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.status).toBe('ok');
    });

    it('accepts requests with valid Authorization Bearer token with 200', async () => {
      const app = createApp(mockEnv);
      const res = await app.handle(
        new Request('http://localhost/nimda/health', {
          headers: { Authorization: `Bearer ${TEST_ADMIN_KEY}` },
        })
      );
      expect(res.status).toBe(200);
    });
  });

  describe('2. Operational Endpoints', () => {
    it('purges edge KV cache on POST /nimda/cache/purge', async () => {
      const app = createApp(mockEnv);
      const res = await app.handle(
        new Request('http://localhost/nimda/cache/purge', {
          method: 'POST',
          headers: { 'X-Admin-Key': TEST_ADMIN_KEY },
        })
      );
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(mockKv['kurs:latest:rates']).toBeUndefined();
    });

    it('returns quarantine list on GET /nimda/quarantine', async () => {
      const app = createApp(mockEnv);
      const res = await app.handle(
        new Request('http://localhost/nimda/quarantine', {
          headers: { 'X-Admin-Key': TEST_ADMIN_KEY },
        })
      );
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(Array.isArray(body.items)).toBe(true);
    });

    it('returns API keys list on GET /nimda/api-keys', async () => {
      const app = createApp(mockEnv);
      const res = await app.handle(
        new Request('http://localhost/nimda/api-keys', {
          headers: { 'X-Admin-Key': TEST_ADMIN_KEY },
        })
      );
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(Array.isArray(body.keys)).toBe(true);
    });
  });
});
