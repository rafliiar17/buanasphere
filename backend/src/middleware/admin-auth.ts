import type { Context } from 'elysia';
import type { Env } from '../db/index.ts';

/**
 * Middleware to guard administrative endpoints (/nimda/*).
 * Validates 'X-Admin-Key' header or 'Authorization: Bearer <key>'.
 */
export function validateAdminAuth(headers: Record<string, string | undefined>, env?: Env): boolean {
  const secretKey = env?.ADMIN_SECRET_KEY || 'kw_nimda_secret_key_dev';

  const xAdminKey = headers['x-admin-key'];
  if (xAdminKey && xAdminKey === secretKey) {
    return true;
  }

  const authHeader = headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token === secretKey) {
      return true;
    }
  }

  return false;
}

export function nimdaAuthMiddleware(env?: Env) {
  return (c: Context) => {
    const isAuthorized = validateAdminAuth(c.headers as Record<string, string | undefined>, env);
    if (!isAuthorized) {
      c.set.status = 401;
      return {
        error: 'Unauthorized',
        message: 'Invalid or missing X-Admin-Key header. Access denied to /nimda operator console.',
      };
    }
  };
}
