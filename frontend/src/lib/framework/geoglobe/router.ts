/**
 * Kurs World / GeoGlobe — Path-Based Micro-App Router Constants & Resolution (ADR 0028).
 */

export const APP_PATH_MAP: Record<string, string> = {
  '/': 'fx-rates',
  '/kurs': 'fx-rates',
  '/time': 'world-time',
  '/flight': 'remittance-flow',
  '/flow': 'remittance-flow',
  '/passport': 'passport-power',
};

export const CANONICAL_APP_PATHS: Record<string, string> = {
  'fx-rates': '/kurs',
  'world-time': '/time',
  'remittance-flow': '/flight',
  'passport-power': '/passport',
};

/**
 * Resolves a URL pathname to the corresponding micro-app ID.
 */
export function resolvePathToAppId(pathname: string): string {
  if (!pathname || pathname === '') return 'fx-rates';

  // Normalize path (strip trailing slash)
  const normalized = pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;

  return APP_PATH_MAP[normalized] ?? 'fx-rates';
}

/**
 * Resolves a micro-app ID to its canonical URL pathname.
 */
export function resolveAppIdToPath(appId: string): string {
  return CANONICAL_APP_PATHS[appId] ?? '/kurs';
}
