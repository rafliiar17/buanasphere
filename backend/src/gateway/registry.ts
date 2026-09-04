import type {
  MicroappHandler,
  GatewayResponse,
  GatewayCatalogItem,
} from './types.ts';
import type { Env } from '../db/index.ts';
import { quakeHandler } from './handlers/quakeHandler.ts';
import { populationHandler } from './handlers/populationHandler.ts';

export interface MemoryCacheItem {
  data: any;
  source: string;
  timestamp: string;
  expiresAt: number;
}

/**
 * Computes a deterministic SHA-256 parameter hash based on sorted parameter keys.
 */
export async function computeParamsHash(params: Record<string, any> = {}): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  const sortedObj: Record<string, any> = {};
  for (const key of sortedKeys) {
    if (params[key] !== undefined) {
      sortedObj[key] = params[key];
    }
  }
  const serialized = JSON.stringify(sortedObj);
  const msgBuffer = new TextEncoder().encode(serialized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).slice(0, 16).join('');
}

export class MicroappRegistry {
  private handlers = new Map<string, MicroappHandler>();
  private memoryCache = new Map<string, MemoryCacheItem>();
  private readonly maxMemoryItems = 500;

  register(handler: MicroappHandler): void {
    this.handlers.set(handler.id, handler);
  }

  get(appId: string): MicroappHandler | undefined {
    return this.handlers.get(appId);
  }

  getAll(): MicroappHandler[] {
    return Array.from(this.handlers.values());
  }

  getCatalog(): GatewayCatalogItem[] {
    return this.getAll().map((h) => ({
      id: h.id,
      name: h.name,
      description: h.description,
      cacheTtlSeconds: h.cacheTtlSeconds ?? 300,
    }));
  }

  private setMemoryCache(key: string, item: MemoryCacheItem): void {
    if (this.memoryCache.size >= this.maxMemoryItems) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) {
        this.memoryCache.delete(oldestKey);
      }
    }
    this.memoryCache.set(key, item);
  }

  clearCache(): void {
    this.memoryCache.clear();
  }

  async dispatch(
    appId: string,
    params: Record<string, any> = {},
    env?: Env
  ): Promise<GatewayResponse> {
    const handler = this.get(appId);
    if (!handler) {
      return {
        success: false,
        app: appId,
        source: 'gateway',
        cached: false,
        timestamp: new Date().toISOString(),
        data: null as any,
        error: `Microapp '${appId}' is not registered in the gateway catalog`,
      };
    }

    const paramHash = await computeParamsHash(params);
    const cacheKey = `gateway:${appId}:${paramHash}`;
    const ttlSeconds = handler.cacheTtlSeconds ?? 300;

    // 1. Check Cloudflare KV Cache if available
    if (env?.KURS_CACHE) {
      try {
        const kvCached = await env.KURS_CACHE.get(cacheKey, 'json');
        if (kvCached) {
          const cachedEntry = kvCached as {
            data: any;
            source?: string;
            timestamp?: string;
          };
          return {
            success: true,
            app: appId,
            source: cachedEntry.source || handler.name,
            cached: true,
            timestamp: cachedEntry.timestamp || new Date().toISOString(),
            data: cachedEntry.data !== undefined ? cachedEntry.data : cachedEntry,
          };
        }
      } catch {
        // Non-blocking KV read failure, proceed to handler execution
      }
    } else {
      // 2. Fallback to in-memory LRU/Map if KURS_CACHE is null or undefined
      const memCached = this.memoryCache.get(cacheKey);
      if (memCached && memCached.expiresAt > Date.now()) {
        return {
          success: true,
          app: appId,
          source: memCached.source || handler.name,
          cached: true,
          timestamp: memCached.timestamp,
          data: memCached.data,
        };
      }
    }

    // 3. Cache Miss: Execute handler.handle(params, env)
    try {
      const executionResult = await handler.handle(params, env);
      const nowIso = new Date().toISOString();

      let data = executionResult;
      let source = handler.name;
      if (
        executionResult &&
        typeof executionResult === 'object' &&
        'data' in executionResult &&
        'source' in executionResult &&
        Object.keys(executionResult).length <= 4
      ) {
        data = executionResult.data;
        source = executionResult.source;
      }

      const cachePayload = {
        data,
        source,
        timestamp: nowIso,
      };

      // Write to Cloudflare KV or in-memory fallback
      if (env?.KURS_CACHE) {
        try {
          await env.KURS_CACHE.put(cacheKey, JSON.stringify(cachePayload), {
            expirationTtl: ttlSeconds,
          });
        } catch {
          // Non-blocking KV write failure
        }
      } else {
        this.setMemoryCache(cacheKey, {
          data,
          source,
          timestamp: nowIso,
          expiresAt: Date.now() + ttlSeconds * 1000,
        });
      }

      return {
        success: true,
        app: appId,
        source,
        cached: false,
        timestamp: nowIso,
        data,
      };
    } catch (err: any) {
      return {
        success: false,
        app: appId,
        source: handler.name,
        cached: false,
        timestamp: new Date().toISOString(),
        data: null as any,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async dispatchBatch(
    items: Array<{ app: string; params?: Record<string, any> }>,
    env?: Env
  ): Promise<Record<string, GatewayResponse>> {
    const results: Record<string, GatewayResponse> = {};
    await Promise.all(
      items.map(async (item) => {
        const response = await this.dispatch(item.app, item.params || {}, env);
        results[item.app] = response;
      })
    );
    return results;
  }
}

export const defaultGatewayRegistry = new MicroappRegistry();
defaultGatewayRegistry.register(quakeHandler);
defaultGatewayRegistry.register(populationHandler);
