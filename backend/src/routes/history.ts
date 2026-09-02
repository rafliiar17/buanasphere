import { Elysia, t } from 'elysia';
import { AggregatorService } from '../service/aggregator.ts';
import type { Env } from '../db/index.ts';

export const historyRoutes = (env?: Env) => {
  const aggregator = new AggregatorService({ env });

  return new Elysia({ prefix: '/api/v1/rates' }).get(
    '/history',
    async ({ query, set }) => {
      try {
        let base = query.base;
        let quote = query.quote ?? 'IDR';

        if (query.pair && query.pair.includes('/')) {
          const [pBase, pQuote] = query.pair.split('/');
          if (pBase) base = pBase;
          if (pQuote) quote = pQuote;
        }

        if (!base) {
          set.status = 400;
          return {
            success: false,
            error: 'Parameter "base" or "pair" (e.g. USD/IDR) is required',
          };
        }

        const days = query.days ? parseInt(query.days, 10) : 7;
        if (isNaN(days) || days <= 0 || days > 365) {
          set.status = 400;
          return {
            success: false,
            error: 'Parameter "days" must be an integer between 1 and 365',
          };
        }

        const history = await aggregator.getHistoricalRates({
          base,
          quote,
          provider: query.provider,
          days,
        });

        return {
          success: true,
          data: history,
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch rate history',
        };
      }
    },
    {
      query: t.Object({
        base: t.Optional(t.String({ description: 'Base currency e.g. USD' })),
        quote: t.Optional(t.String({ description: 'Quote currency e.g. IDR' })),
        pair: t.Optional(t.String({ description: 'Currency pair e.g. USD/IDR' })),
        days: t.Optional(t.String({ description: 'History time period in days (e.g. 7, 30, 90, 365)', default: '7' })),
        provider: t.Optional(t.String({ description: 'Specific bank provider filter e.g. bca, mandiri, bi' })),
      }),
      detail: {
        summary: 'Historical exchange rate time-series for trend charts',
        description:
          'Fetches aggregated historical time-series data with percentage changes, min/max points, and trend curves.',
        tags: ['History'],
      },
    }
  );
};
