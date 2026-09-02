import { Elysia, t } from 'elysia';
import {
  getCachedCountries,
  getCountryByIso3,
  filterCountriesByRegion,
  seedCountriesToDb,
} from '../service/country.ts';
import type { Env } from '../db/index.ts';

export const countriesRoutes = (env?: Env) => {
  return new Elysia({ prefix: '/api/v1/countries', aot: false })
    .get(
      '/',
      async ({ query }) => {
        const countries = await getCachedCountries(env);
        const filtered = filterCountriesByRegion(countries, query.region);

        return {
          success: true,
          total: filtered.length,
          timestamp: new Date().toISOString(),
          data: filtered,
        };
      },
      {
        query: t.Object({
          region: t.Optional(
            t.String({
              description: 'Filter countries by region (e.g. "asean", "Asia", "Europe", "Americas", "Oceania", "Africa", "Middle East")',
            })
          ),
        }),
        detail: {
          summary: 'Get list of countries and currency mappings',
          description:
            'Retrieves global ISO-3 country definitions and currency mappings with region filtering and 24h KV edge caching.',
          tags: ['Countries'],
        },
      }
    )
    .get(
      '/:iso3',
      async ({ params, set }) => {
        const iso3 = params.iso3.toUpperCase();
        const country = await getCountryByIso3(iso3, env);

        if (!country) {
          set.status = 404;
          return {
            success: false,
            error: `Country not found for ISO-3 code: ${iso3}`,
          };
        }

        return {
          success: true,
          data: country,
        };
      },
      {
        params: t.Object({
          iso3: t.String({
            minLength: 2,
            maxLength: 4,
            description: 'ISO 3166-1 alpha-3 country code e.g. IDN, USA, JPN',
          }),
        }),
        detail: {
          summary: 'Get country details by ISO-3 code',
          description:
            'Retrieves country metadata, currency code, currency name, and flag emoji by ISO-3 code.',
          tags: ['Countries'],
        },
      }
    )
    .post(
      '/seed',
      async ({ set }) => {
        const result = await seedCountriesToDb(env);
        if (!result.success && result.message.includes('not configured')) {
          set.status = 503;
        } else if (!result.success) {
          set.status = 500;
        }

        return result;
      },
      {
        detail: {
          summary: 'Seed sovereign countries metadata into D1 database',
          description:
            'Initializes or seeds the D1 countries table with 195+ sovereign countries and global territories.',
          tags: ['Countries'],
        },
      }
    );
};
