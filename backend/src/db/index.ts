import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema.ts';

export interface Env {
  DB?: D1Database;
  KURS_CACHE?: KVNamespace;
  ENVIRONMENT?: string;
}

export function getDb(env?: Env) {
  if (env?.DB) {
    return drizzle(env.DB, { schema });
  }
  return null;
}

export * from './schema.ts';
