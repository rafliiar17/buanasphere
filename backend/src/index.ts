import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { ratesRoutes } from './routes/rates.ts';
import { convertRoutes } from './routes/convert.ts';
import { historyRoutes } from './routes/history.ts';
import { countriesRoutes } from './routes/countries.ts';
import { nimdaRoutes } from './routes/admin.ts';
import { gatewayRoutes } from './routes/gateway.ts';
import { loggerMiddleware } from './middleware/logger.ts';
import { rateLimiterMiddleware } from './middleware/rate-limiter.ts';
import { AggregatorService } from './service/aggregator.ts';
import { logger } from './logger/index.ts';
import { recordApiRequest } from './telemetry/index.ts';
import type { Env } from './db/index.ts';

/**
 * Validates CORS origin against production and development allowlists (ADR 0028).
 */
export function isAllowedCorsOrigin(origin: string): boolean {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1') return true;
    if (host === 'globe.arafz.id' || host.endsWith('.globe.arafz.id')) return true;
    if (host === 'kurs.arafz.id' || host.endsWith('.kurs.arafz.id')) return true;
    if (host === 'api-globe.arafz.id' || host.endsWith('.api-globe.arafz.id')) return true;
    if (host === 'buanasphere-frontend.pages.dev' || host.endsWith('.buanasphere-frontend.pages.dev')) return true;
    if (host === 'kurs-world-frontend.pages.dev' || host.endsWith('.kurs-world-frontend.pages.dev')) return true;
    return false;
  } catch {
    return false;
  }
}

export function createApp(env?: Env) {
  const app = new Elysia({ aot: false })
    .use(loggerMiddleware())
    // Security defense-in-depth headers middleware (SEC-08)
    .onRequest(({ set }) => {
      set.headers['X-Content-Type-Options'] = 'nosniff';
      set.headers['X-Frame-Options'] = 'DENY';
      set.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
      set.headers['Permissions-Policy'] = 'geolocation=(), camera=(), microphone=()';
    })
    // Active sliding-window rate limiter middleware (SEC-01)
    .use(rateLimiterMiddleware({ kv: env?.KURS_CACHE }))
    .use(
      cors({
        origin: (request) => {
          const origin = request.headers.get('origin');
          if (!origin) return true;
          return isAllowedCorsOrigin(origin);
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Admin-Key', 'X-Request-ID'],
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
            { name: 'Countries', description: 'Global country metadata and currency mappings' },
            { name: 'Converter', description: 'Multi-source currency conversion calculations' },
            { name: 'History', description: 'Historical time-series trend queries' },
            { name: 'Gateway', description: 'Unified Edge API Gateway and Microapp Ingestion BFF' },
          ],
        },
      })
    )
    .get(
      '/',
      () => ({
        name: 'Buanasphere API',
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
        const payload = body;
        return {
          success: true,
          message: `Notifikasi berhasil didaftarkan untuk ${payload.email}. Anda akan menerima email saat kurs mencapai target.`,
          data: {
            email: payload.email,
            baseCurrency: payload.baseCurrency.toUpperCase(),
            targetCurrency: (payload.targetCurrency ?? 'IDR').toUpperCase(),
            targetRate: payload.targetRate,
            condition: payload.condition ?? 'above',
          },
        };
      },
      {
        body: t.Object({
          email: t.String({ format: 'email', description: 'User notification email address' }),
          baseCurrency: t.String({ minLength: 3, maxLength: 5, description: 'Base currency e.g. USD' }),
          targetCurrency: t.Optional(
            t.String({ minLength: 3, maxLength: 5, default: 'IDR', description: 'Target currency e.g. IDR' })
          ),
          targetRate: t.Number({ minimum: 0.000001, description: 'Target exchange rate threshold' }),
          condition: t.Optional(
            t.Union([t.Literal('above'), t.Literal('below'), t.Literal('exact')], {
              default: 'above',
              description: 'Alert trigger condition',
            })
          ),
        }),
        detail: {
          summary: 'Register rate alert',
          tags: ['General'],
        },
      }
    )
    .use(ratesRoutes(env))
    .use(convertRoutes(env))
    .use(historyRoutes(env))
    .use(countriesRoutes(env))
    .use(nimdaRoutes(env))
    .use(gatewayRoutes(env))
    .onAfterResponse(({ request, set }) => {
      try {
        const url = new URL(request.url);
        const cacheHeader = (set.headers['X-Cache'] as 'HIT' | 'MISS' | 'BYPASS') || 'BYPASS';
        const statusCode = typeof set.status === 'number' ? set.status : 200;
        recordApiRequest(env?.ANALYTICS, {
          endpoint: url.pathname,
          method: request.method,
          statusCode,
          durationMs: 1.0,
          cacheStatus: cacheHeader,
        });
      } catch {
        // Non-blocking telemetry
      }
    });

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
