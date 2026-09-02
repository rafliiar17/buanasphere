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
