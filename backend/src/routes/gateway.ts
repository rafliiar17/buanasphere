import { Elysia, t } from 'elysia';
import type { Env } from '../db/index.ts';
import {
  MicroappRegistry,
  defaultGatewayRegistry,
} from '../gateway/registry.ts';

export const gatewayRoutes = (
  env?: Env,
  registry: MicroappRegistry = defaultGatewayRegistry
) => {
  const reg = registry || defaultGatewayRegistry;

  return new Elysia({ prefix: '/api/v1/gateway', aot: false })
    .get(
      '/',
      () => {
        const catalog = reg.getCatalog();
        return {
          success: true,
          count: catalog.length,
          timestamp: new Date().toISOString(),
          data: catalog,
        };
      },
      {
        detail: {
          summary: 'List registered microapps catalog',
          description:
            'Discovery endpoint returning metadata and cache parameters for all available microapps.',
          tags: ['Gateway'],
        },
      }
    )
    .get(
      '/:app',
      async ({ params, query, set }) => {
        const result = await reg.dispatch(params.app, query || {}, env);
        if (!result.success) {
          if (result.error?.includes('not registered')) {
            set.status = 404;
          } else {
            set.status = 500;
          }
        }
        set.headers['X-Cache'] = result.cached ? 'HIT' : 'MISS';
        return result;
      },
      {
        params: t.Object({
          app: t.String({
            description: 'Microapp identifier e.g. quake, population',
          }),
        }),
        detail: {
          summary: 'Dispatch microapp data query',
          description:
            'Dynamic edge BFF gateway dispatcher for microapp data ingestion with automatic caching.',
          tags: ['Gateway'],
        },
      }
    )
    .post(
      '/',
      async ({ body, set }) => {
        const payload = body as any;

        if (Array.isArray(payload?.batch)) {
          const batchResults = await reg.dispatchBatch(payload.batch, env);
          return {
            success: true,
            timestamp: new Date().toISOString(),
            data: batchResults,
          };
        }

        if (typeof payload?.app === 'string') {
          const result = await reg.dispatch(
            payload.app,
            payload.params || {},
            env
          );
          if (!result.success) {
            if (result.error?.includes('not registered')) {
              set.status = 404;
            } else {
              set.status = 500;
            }
          }
          set.headers['X-Cache'] = result.cached ? 'HIT' : 'MISS';
          return result;
        }

        set.status = 400;
        return {
          success: false,
          error:
            'Invalid request body: must provide "app" string or "batch" array.',
        };
      },
      {
        detail: {
          summary: 'Dispatch single or batch microapp requests',
          description:
            'Unified edge BFF gateway single or batch dispatcher for microapps.',
          tags: ['Gateway'],
        },
      }
    );
};
