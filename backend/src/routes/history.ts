import { Elysia, t } from 'elysia';
import { AggregatorService } from '../service/aggregator.ts';
import type { TimeframeRange } from '../domain/rate.ts';
import type { Env } from '../db/index.ts';

export const historyRoutes = (env?: Env) => {
  const aggregator = new AggregatorService({ env });

  const handler = async ({ query, set }: any) => {
    try {
      let base = query.base || query.currency;
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
          error: 'Parameter "base", "currency", or "pair" (e.g. USD/IDR) is required',
        };
      }

      // Check if timeframe is provided
      let timeframe: TimeframeRange | undefined = undefined;
      if (query.timeframe) {
        const tfUpper = String(query.timeframe).toUpperCase();
        if (['1D', '5D', '1M', '6M', '1Y', '5Y', 'MAX'].includes(tfUpper)) {
          timeframe = tfUpper as TimeframeRange;
        }
      }

      if (timeframe) {
        const history = await aggregator.getHistoricalSeries(base, timeframe, quote);
        return {
          success: true,
          data: history,
        };
      }

      let days = 7;
      if (query.range) {
        const rLower = String(query.range).toLowerCase();
        if (rLower === '1d') timeframe = '1D';
        else if (rLower === '5d') timeframe = '5D';
        else if (rLower === '7d') days = 7;
        else if (rLower === '1m' || rLower === '30d') days = 30;
        else if (rLower === '6m' || rLower === '90d') days = 90;
        else if (rLower === '1y' || rLower === '365d') days = 365;
        else if (rLower === '5y') timeframe = '5Y';
        else if (rLower === 'max') timeframe = 'MAX';
      } else if (query.days) {
        days = parseInt(query.days, 10);
      }

      if (timeframe) {
        const history = await aggregator.getHistoricalSeries(base, timeframe, quote);
        return {
          success: true,
          data: history,
        };
      }

      if (isNaN(days) || days <= 0 || days > 3650) {
        set.status = 400;
        return {
          success: false,
          error: 'Parameter "days" must be an integer between 1 and 3650',
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
  };

  const historySchema = {
    query: t.Object({
      base: t.Optional(t.String({ description: 'Base currency e.g. USD' })),
      currency: t.Optional(t.String({ description: 'Foreign currency e.g. USD' })),
      quote: t.Optional(t.String({ description: 'Quote currency e.g. IDR' })),
      pair: t.Optional(t.String({ description: 'Currency pair e.g. USD/IDR' })),
      timeframe: t.Optional(t.String({ description: 'Google Finance timeframe range (1D, 5D, 1M, 6M, 1Y, 5Y, MAX)' })),
      days: t.Optional(t.String({ description: 'History time period in days (e.g. 7, 30, 90, 365)', default: '7' })),
      range: t.Optional(t.String({ description: 'Range shorthand e.g. 1D, 5D, 1M, 6M, 1Y, 5Y, MAX, 7d, 30d' })),
      provider: t.Optional(t.String({ description: 'Specific bank provider filter e.g. bca, mandiri, bi' })),
    }),
    detail: {
      summary: 'Historical exchange rate time-series for trend charts',
      description:
        'Fetches aggregated historical time-series data with Google Finance timeframes (1D, 5D, 1M, 6M, 1Y, 5Y, MAX) and OHLC data.',
      tags: ['History'],
    },
  };

  return new Elysia({ prefix: '/api/v1', aot: false })
    .get('/history', handler, historySchema)
    .get('/rates/history', handler, historySchema);
};
