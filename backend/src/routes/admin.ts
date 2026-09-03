import { Elysia, t } from 'elysia';
import type { Env } from '../db/index.ts';
import { getDb, ratesTable, rateHistoryTable, quarantineRatesTable, apiKeysTable } from '../db/index.ts';
import { eq, desc } from 'drizzle-orm';
import { AggregatorService } from '../service/aggregator.ts';
import { nimdaAuthMiddleware } from '../middleware/admin-auth.ts';

async function sha256Hex(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function buildNimdaApp(prefix: string, env?: Env) {
  const aggregator = new AggregatorService({ env });

  return new Elysia({ prefix })
    .onBeforeHandle(nimdaAuthMiddleware(env))
    // 1. Health & Statistics
    .get('/health', async () => {
      let d1Connected = false;
      let ratesCount = 0;
      let historyCount = 0;
      let quarantineCount = 0;
      let apiKeysCount = 0;

      try {
        const db = getDb(env);
        if (db) {
          d1Connected = true;
          const allRates = await db.select().from(ratesTable).all();
          ratesCount = allRates.length;

          const allQuarantine = await db.select().from(quarantineRatesTable).all();
          quarantineCount = allQuarantine.length;

          const allKeys = await db.select().from(apiKeysTable).all();
          apiKeysCount = allKeys.length;
        }
      } catch (err) {
        console.error('Error querying health counts:', err);
      }

      const kvConnected = Boolean(env?.KURS_CACHE);

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        storage: {
          d1Connected,
          kvConnected,
          ratesCount,
          quarantineCount,
          apiKeysCount,
        },
        worker: {
          env: env ? 'cloudflare-workers' : 'development-local',
        },
      };
    })

    // 2. Manual Ingestion Trigger
    .post('/ingest/trigger', async () => {
      const startTime = performance.now();
      try {
        const result = await aggregator.ingestAll();
        const duration_ms = Math.round((performance.now() - startTime) * 100) / 100;
        return {
          success: true,
          duration_ms,
          result,
        };
      } catch (error) {
        const duration_ms = Math.round((performance.now() - startTime) * 100) / 100;
        return {
          success: false,
          duration_ms,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    })

    // 3. Edge KV Cache Purge
    .post('/cache/purge', async () => {
      let purgedKeys: string[] = [];
      if (env?.KURS_CACHE) {
        await env.KURS_CACHE.delete('kurs:latest:rates');
        purgedKeys.push('kurs:latest:rates');
      }

      return {
        success: true,
        purgedKeys,
        timestamp: new Date().toISOString(),
        message: 'Edge KV cache keys purged successfully.',
      };
    })

    // 4. Quarantine List
    .get('/quarantine', async () => {
      const db = getDb(env);
      if (!db) {
        return { items: [] };
      }

      const items = await db
        .select()
        .from(quarantineRatesTable)
        .orderBy(desc(quarantineRatesTable.createdAt))
        .limit(100)
        .all();

      return {
        items,
        total: items.length,
      };
    })

    // 5. Delete Quarantine Item
    .delete(
      '/quarantine/:id',
      async ({ params: { id } }) => {
        const db = getDb(env);
        if (!db) return { success: false, error: 'Database unavailable' };

        const numId = parseInt(id, 10);
        if (isNaN(numId)) return { success: false, error: 'Invalid ID' };

        await db.delete(quarantineRatesTable).where(eq(quarantineRatesTable.id, numId)).run();
        return { success: true, message: `Quarantine entry #${id} removed.` };
      },
      {
        params: t.Object({ id: t.String() }),
      }
    )

    // 6. API Keys List
    .get('/api-keys', async () => {
      const db = getDb(env);
      if (!db) return { keys: [] };

      const keys = await db
        .select({
          id: apiKeysTable.id,
          name: apiKeysTable.name,
          tier: apiKeysTable.tier,
          ownerEmail: apiKeysTable.ownerEmail,
          createdAt: apiKeysTable.createdAt,
          lastUsedAt: apiKeysTable.lastUsedAt,
          isActive: apiKeysTable.isActive,
          keyHashPreview: apiKeysTable.keyHash,
        })
        .from(apiKeysTable)
        .orderBy(desc(apiKeysTable.createdAt))
        .all();

      const sanitized = keys.map((k) => ({
        ...k,
        keyHashPreview: k.keyHashPreview.slice(0, 8) + '...' + k.keyHashPreview.slice(-6),
      }));

      return { keys: sanitized };
    })

    // 7. Create New API Key
    .post(
      '/api-keys',
      async ({ body }) => {
        const db = getDb(env);
        if (!db) return { success: false, error: 'Database unavailable' };

        const randomBytes = new Uint8Array(24);
        crypto.getRandomValues(randomBytes);
        const randomHex = Array.from(randomBytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

        const rawKey = `kw_live_${randomHex}`;
        const keyHash = await sha256Hex(rawKey);
        const id = `key_${Date.now()}_${randomHex.slice(0, 6)}`;
        const now = new Date().toISOString();

        await db
          .insert(apiKeysTable)
          .values({
            id,
            keyHash,
            name: body.name,
            tier: body.tier || 'free',
            ownerEmail: body.ownerEmail,
            createdAt: now,
            isActive: true,
          })
          .run();

        return {
          success: true,
          key: {
            id,
            name: body.name,
            tier: body.tier || 'free',
            ownerEmail: body.ownerEmail,
            rawKey, // Returned ONLY ONCE
            createdAt: now,
          },
          warning: 'Salin kunci ini sekarang. Kunci tidak akan ditampilkan lagi demi alasan keamanan.',
        };
      },
      {
        body: t.Object({
          name: t.String(),
          ownerEmail: t.String(),
          tier: t.Optional(t.Union([t.Literal('free'), t.Literal('pro'), t.Literal('enterprise')])),
        }),
      }
    )

    // 8. Toggle API Key Active State
    .patch(
      '/api-keys/:id/toggle',
      async ({ params: { id } }) => {
        const db = getDb(env);
        if (!db) return { success: false, error: 'Database unavailable' };

        const existing = await db
          .select()
          .from(apiKeysTable)
          .where(eq(apiKeysTable.id, id))
          .all();

        if (existing.length === 0) {
          return { success: false, error: 'Key not found' };
        }

        const newStatus = !existing[0].isActive;
        await db
          .update(apiKeysTable)
          .set({ isActive: newStatus })
          .where(eq(apiKeysTable.id, id))
          .run();

        return {
          success: true,
          id,
          isActive: newStatus,
        };
      },
      {
        params: t.Object({ id: t.String() }),
      }
    )

    // 9. Delete API Key
    .delete(
      '/api-keys/:id',
      async ({ params: { id } }) => {
        const db = getDb(env);
        if (!db) return { success: false, error: 'Database unavailable' };

        await db.delete(apiKeysTable).where(eq(apiKeysTable.id, id)).run();
        return { success: true, message: `API Key ${id} successfully deleted.` };
      },
      {
        params: t.Object({ id: t.String() }),
      }
    );
}

export function nimdaRoutes(env?: Env) {
  return new Elysia()
    .use(buildNimdaApp('/nimda', env))
    .use(buildNimdaApp('/api/v1/nimda', env))
    .use(buildNimdaApp('/api/nimda', env));
}
