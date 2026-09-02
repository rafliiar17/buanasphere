import { Elysia, t } from 'elysia';
import { AggregatorService } from '../service/aggregator.ts';
import { ConverterService } from '../service/converter.ts';
import type { Env } from '../db/index.ts';

export const convertRoutes = (env?: Env) => {
  const aggregator = new AggregatorService({ env });
  const converter = new ConverterService({ aggregator });

  return new Elysia({ prefix: '/api/v1' }).get(
    '/convert',
    async ({ query, set }) => {
      try {
        const amount = parseFloat(query.amount);
        if (isNaN(amount) || amount <= 0) {
          set.status = 400;
          return {
            success: false,
            error: 'Parameter "amount" must be a positive number',
          };
        }

        const from = query.from;
        const to = query.to ?? 'IDR';
        const rateType = (query.rateType ?? 'buy') as 'buy' | 'sell' | 'mid';

        const result = await converter.convert(amount, from, to, rateType);

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Currency conversion failed',
        };
      }
    },
    {
      query: t.Object({
        amount: t.String({ description: 'Amount of currency to convert e.g. 100' }),
        from: t.String({ description: 'Source currency code e.g. USD' }),
        to: t.Optional(t.String({ description: 'Target currency code e.g. IDR', default: 'IDR' })),
        rateType: t.Optional(
          t.Union([t.Literal('buy'), t.Literal('sell'), t.Literal('mid')], {
            default: 'buy',
            description: 'Rate type for conversion (buy, sell, or mid)',
          })
        ),
      }),
      detail: {
        summary: 'Multi-source instant currency converter',
        description:
          'Converts an amount between currencies and compares the converted values across all bank providers.',
        tags: ['Converter'],
      },
    }
  );
};
