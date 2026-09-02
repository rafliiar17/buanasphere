import { Elysia, t } from 'elysia';
import { AggregatorService } from '../service/aggregator.ts';
import { ComparatorService } from '../service/comparator.ts';
import { getAllCountryMappings } from '../domain/country-map.ts';
import { parseCurrencyPair } from '../domain/rate.ts';
import type { Env } from '../db/index.ts';

export const ratesRoutes = (env?: Env) => {
  const aggregator = new AggregatorService({ env });
  const comparator = new ComparatorService({ aggregator });

  return new Elysia({ prefix: '/api/v1/rates', aot: false })
    .get(
      '/countries',
      () => {
        return {
          success: true,
          data: getAllCountryMappings(),
        };
      },
      {
        detail: {
          summary: 'Get ISO-3 country to currency mapping list',
          description:
            'Retrieves complete ISO-3 country definitions and currency mappings for map visualizations.',
          tags: ['Rates'],
        },
      }
    )
    .get(
      '/compare-currencies',
      async ({ set }) => {
        try {
          const comparisons = await aggregator.getCurrencyComparisonList();
          return {
            success: true,
            count: comparisons.length,
            timestamp: new Date().toISOString(),
            data: comparisons,
          };
        } catch (error) {
          set.status = 500;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to retrieve currency comparisons',
          };
        }
      },
      {
        detail: {
          summary: 'Get multi-currency performance comparison against IDR',
          description:
            'Retrieves global currency performance table vs IDR with multi-timeframe changes and sparkline trends.',
          tags: ['Rates'],
        },
      }
    )
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
          const { base, quote } = parseCurrencyPair(query.pair, query.base, query.quote);

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
    )
    .get(
      '/matrix',
      async ({ query, set }) => {
        try {
          const currency = (query.currency || query.base || 'USD').toUpperCase();
          const baseCurrency = (query.quote || 'IDR').toUpperCase();
          const result = await comparator.compareRates(currency, baseCurrency);

          let lowestSpreadProvider = '';
          let minSpread = Number.MAX_VALUE;

          const rows = result.rates.map((r) => {
            const spread = r.spread;
            const spreadPercent = r.midRate > 0 ? (spread / r.midRate) * 100 : 0;
            if (spread < minSpread) {
              minSpread = spread;
              lowestSpreadProvider = r.providerName;
            }
            return {
              providerId: r.provider,
              providerName: r.providerName,
              providerType: r.providerType || 'commercial_bank',
              rateType: r.provider === 'bi' ? 'JISDOR' : 'Special Rate',
              buyRate: r.buyRate,
              sellRate: r.sellRate,
              middleRate: r.midRate,
              spread,
              spreadPercent: Math.round(spreadPercent * 100) / 100,
              updatedAt: r.updatedAt,
              isBestBuy: result.bestForCustomerSell?.provider === r.provider,
              isBestSell: result.bestForCustomerBuy?.provider === r.provider,
              isLowestSpread: false,
            };
          });

          for (const row of rows) {
            if (row.providerName === lowestSpreadProvider) {
              row.isLowestSpread = true;
            }
          }

          return {
            success: true,
            data: {
              currency,
              baseCurrency,
              timestamp: result.timestamp,
              totalProviders: rows.length,
              bestBuyProvider: result.bestForCustomerSell?.providerName || '-',
              bestSellProvider: result.bestForCustomerBuy?.providerName || '-',
              lowestSpreadProvider: lowestSpreadProvider || '-',
              rows,
            },
          };
        } catch (error) {
          set.status = 500;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to retrieve rate matrix',
          };
        }
      },
      {
        query: t.Object({
          currency: t.Optional(t.String({ description: 'Foreign currency e.g. USD, EUR, SGD' })),
          base: t.Optional(t.String({ description: 'Base foreign currency' })),
          quote: t.Optional(t.String({ description: 'Quote currency e.g. IDR' })),
        }),
        detail: {
          summary: 'Get side-by-side exchange rate matrix for currency table',
          tags: ['Rates'],
        },
      }
    )
    .post(
      '/refresh',
      async ({ set }) => {
        try {
          const result = await aggregator.ingestAll();
          return {
            success: true,
            message: 'Rates successfully refreshed on-demand from provider',
            data: result,
          };
        } catch (error) {
          set.status = 500;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to execute on-demand refresh',
          };
        }
      },
      {
        detail: {
          summary: 'Trigger on-demand rate ingestion (manual/webhook)',
          description: 'Refreshes rates directly from upstream provider and updates KV and D1 database.',
          tags: ['Rates'],
        },
      }
    );
};
