import type { Env } from '../db/index.ts';

export interface MicroappHandler {
  id: string;
  name: string;
  description: string;
  version?: string;
  cacheTtlSeconds?: number;
  handle: (params: Record<string, any>, env?: Env) => Promise<any>;
}

export interface GatewayResponse<T = any> {
  success: boolean;
  app: string;
  source: string;
  cached: boolean;
  timestamp: string;
  data: T;
  error?: string;
}

export interface GatewayCatalogItem {
  id: string;
  name: string;
  description: string;
  cacheTtlSeconds: number;
}
