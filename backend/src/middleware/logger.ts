import { Elysia } from 'elysia';
import { logger } from '../logger/index.ts';

/**
 * Elysia Logger Middleware:
 * Injects a unique requestId into every incoming HTTP request,
 * tracks execution time, and writes a structured JSON log on response or error.
 */
export const loggerMiddleware = () =>
  new Elysia({ name: 'logger-middleware' })
    .derive({ as: 'global' }, ({ request, set }) => {
      const requestId =
        request.headers.get('x-request-id') ||
        (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

      const startTime = performance.now();

      // Ensure X-Request-ID is attached to response headers
      set.headers['x-request-id'] = requestId;

      return {
        requestId,
        startTime,
      };
    })
    .onAfterResponse(({ request, set, requestId, startTime }) => {
      const duration_ms = startTime ? Math.round((performance.now() - startTime) * 100) / 100 : 0;
      const status = typeof set.status === 'number' ? set.status : 200;
      const url = new URL(request.url);

      logger.info(
        {
          requestId: requestId ?? 'unknown',
          method: request.method,
          path: url.pathname,
          status,
          duration_ms,
        },
        `HTTP ${request.method} ${url.pathname} ${status} (${duration_ms}ms)`
      );
    })
    .onError(({ error, request, set, requestId, startTime }) => {
      const duration_ms = startTime ? Math.round((performance.now() - startTime) * 100) / 100 : 0;
      const status = typeof set.status === 'number' ? set.status : 500;
      const url = new URL(request.url);

      logger.error(
        {
          requestId: requestId ?? 'unknown',
          method: request.method,
          path: url.pathname,
          status,
          duration_ms,
          error: error instanceof Error ? error.message : String(error),
        },
        `HTTP ${request.method} ${url.pathname} ${status} - Error: ${error instanceof Error ? error.message : String(error)}`
      );
    });
