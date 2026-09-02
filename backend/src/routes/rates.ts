import { Elysia, t } from 'elysia';
import { AggregatorService } from '../service/aggregator.ts';
import { ComparatorService } from '../service/comparator.ts';
import type { Env } from '../db/index.ts';

export const ratesRoutes = (env?: Env) => {
  const aggregator = new AggregatorService({ env });
  const comparator = new ComparatorService({ aggregator });

  return new Elysia({ prefix: '/api/v1/rates' })
    .get(
      '/latest',
      async ({ query, set }) => {
        try {
          const rates = await aggregator.getLatestRates({
            base: query.base,
            quote: query.quote ?? 'IDR',
            provider: query.provider,
          });

          return {
            success: true,
            count: rates.length,
            timestamp: new Date().toISOString(),
            data: rates,
          };
        } catch (error) {
          set.status = 500;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch latest exchange rates',
          };
        }
      },
      {
        query: t.Object({
          base: t.Optional(t.String({ description: 'Base currency e.g. USD, EUR, SGD' })),
          quote: t.Optional(t.String({ description: 'Quote currency e.g. IDR', default: 'IDR' })),
          provider: t.Optional(t.String({ description: 'Specific provider filter e.g. bca, mandiri, bi' })),
        }),
        detail: {
          summary: 'Get latest foreign exchange rates',
          description:
            'Retrieves real-time aggregated foreign exchange rates from banks and market references.',
          tags: ['Rates'],
        },
      }
    )
    .get(
      '/compare',
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

          const result = await comparator.compareRates(base, quote);

          return {
            success: true,
            data: result,
          };
        } catch (error) {
          set.status = 500;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to compare exchange rates',
          };
        }
      },
      {
        query: t.Object({
          base: t.Optional(t.String({ description: 'Base currency e.g. USD' })),
          quote: t.Optional(t.String({ description: 'Quote currency e.g. IDR' })),
          pair: t.Optional(t.String({ description: 'Currency pair e.g. USD/IDR' })),
        }),
        detail: {
          summary: 'Compare exchange rates side-by-side across banks',
          description:
            'Evaluates exchange rates from all registered providers for a currency pair, highlighting best buy/sell.',
          tags: ['Rates'],
        },
      }
    );
};
