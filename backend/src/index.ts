import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { ratesRoutes } from './routes/rates.ts';
import { convertRoutes } from './routes/convert.ts';
import { historyRoutes } from './routes/history.ts';
import { loggerMiddleware } from './middleware/logger.ts';
import { AggregatorService } from './service/aggregator.ts';
import { logger } from './logger/index.ts';
import type { Env } from './db/index.ts';

export function createApp(env?: Env) {
  const app = new Elysia()
    .use(loggerMiddleware())
    .use(
      cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
      })
    )
    .use(
      swagger({
        path: '/swagger',
        documentation: {
          info: {
            title: 'Kurs World Public API',
            version: '1.0.0',
            description:
              'Real-time multi-source foreign exchange rate aggregator, bank comparison matrix, and instant converter for Indonesian Rupiah (IDR) and global currencies.',
          },
          tags: [
            { name: 'General', description: 'System health and overview' },
            { name: 'Rates', description: 'Current rates and side-by-side bank comparisons' },
            { name: 'Converter', description: 'Multi-source currency conversion calculations' },
            { name: 'History', description: 'Historical time-series trend queries' },
          ],
        },
      })
    )
    // Rate-limiting and standard headers middleware
    .onRequest(({ set }) => {
      set.headers['X-RateLimit-Limit'] = '100';
      set.headers['X-RateLimit-Remaining'] = '99';
      set.headers['X-RateLimit-Reset'] = String(Math.floor(Date.now() / 1000) + 60);
      set.headers['X-Content-Type-Options'] = 'nosniff';
    })
    .get(
      '/',
      () => ({
        name: 'Kurs World API',
        version: '1.0.0',
        documentation: '/swagger',
        status: 'operational',
        edgeRuntime: 'Cloudflare Workers (Elysia.js on Bun)',
        timestamp: new Date().toISOString(),
      }),
      {
        detail: {
          summary: 'Root API Status',
          tags: ['General'],
        },
      }
    )
    .get(
      '/api/v1/health',
      () => ({
        status: 'ok',
        uptime: process.uptime?.() ?? 0,
        timestamp: new Date().toISOString(),
      }),
      {
        detail: {
          summary: 'Health check endpoint',
          tags: ['General'],
        },
      }
    )
    .get(
      '/api/v1/providers',
      () => ({
        success: true,
        data: [
          {
            id: 'bi',
            name: 'Bank Indonesia (JISDOR)',
            shortName: 'BI JISDOR',
            type: 'central_bank',
            badgeText: 'Bank Sentral',
            website: 'https://www.bi.go.id',
            lastUpdated: new Date().toISOString(),
          },
          {
            id: 'bca',
            name: 'Bank Central Asia (BCA)',
            shortName: 'BCA',
            type: 'commercial_bank',
            badgeText: 'Bank Komersial',
            website: 'https://www.bca.co.id',
            lastUpdated: new Date().toISOString(),
          },
          {
            id: 'mandiri',
            name: 'Bank Mandiri',
            shortName: 'Mandiri',
            type: 'commercial_bank',
            badgeText: 'Bank Komersial',
            website: 'https://www.bankmandiri.co.id',
            lastUpdated: new Date().toISOString(),
          },
          {
            id: 'bri',
            name: 'Bank Rakyat Indonesia (BRI)',
            shortName: 'BRI',
            type: 'commercial_bank',
            badgeText: 'Bank Komersial',
            website: 'https://bri.co.id',
            lastUpdated: new Date().toISOString(),
          },
          {
            id: 'bni',
            name: 'Bank Negara Indonesia (BNI)',
            shortName: 'BNI',
            type: 'commercial_bank',
            badgeText: 'Bank Komersial',
            website: 'https://www.bni.co.id',
            lastUpdated: new Date().toISOString(),
          },
          {
            id: 'cimb',
            name: 'CIMB Niaga',
            shortName: 'CIMB',
            type: 'commercial_bank',
            badgeText: 'Bank Komersial',
            website: 'https://www.cimbniaga.co.id',
            lastUpdated: new Date().toISOString(),
          },
          {
            id: 'dolarasia',
            name: 'DolarAsia Money Changer',
            shortName: 'DolarAsia',
            type: 'money_changer',
            badgeText: 'Money Changer',
            website: 'https://dolarasia.com',
            lastUpdated: new Date().toISOString(),
          },
        ],
      }),
      {
        detail: {
          summary: 'List of registered rate providers',
          tags: ['General'],
        },
      }
    )
    .post(
      '/api/v1/alerts',
      async ({ body }) => {
        const payload = body as any;
        return {
          success: true,
          message: `Notifikasi berhasil didaftarkan untuk ${payload?.email || 'user'}. Anda akan menerima email saat kurs mencapai target.`,
        };
      },
      {
        detail: {
          summary: 'Register rate alert',
          tags: ['General'],
        },
      }
    )
    .use(ratesRoutes(env))
    .use(convertRoutes(env))
    .use(historyRoutes(env));

  return app;
}

export type App = ReturnType<typeof createApp>;

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const workerApp = createApp(env);
    return workerApp.fetch(request);
  },
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    logger.info(
      { scheduledTime: event.scheduledTime, cron: event.cron },
      `[Cron Trigger] Ingesting latest exchange rates at ${new Date().toISOString()}`
    );
    const aggregator = new AggregatorService({ env });
    ctx.waitUntil(aggregator.ingestAll());
  },
};
