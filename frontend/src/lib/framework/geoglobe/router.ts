/**
 * Kurs World / GeoGlobe — Path-Based Micro-App Router Constants & Resolution (ADR 0028 & ADR 0034).
 */

export const APP_PATH_MAP: Record<string, string> = {
  '/': 'fx-rates',
  '/kurs': 'fx-rates',
  '/time': 'world-time',
  '/flight': 'remittance-flow',
  '/flow': 'remittance-flow',
  '/passport': 'passport-power',
  '/nature': 'flora-fauna',
  '/flora-fauna': 'flora-fauna',
  '/flora': 'flora-fauna',
  '/fauna': 'flora-fauna',
  '/wildlife': 'flora-fauna',
  '/biodiversity': 'flora-fauna',
};

export const CANONICAL_APP_PATHS: Record<string, string> = {
  'fx-rates': '/kurs',
  'world-time': '/time',
  'remittance-flow': '/flight',
  'passport-power': '/passport',
  'flora-fauna': '/nature',
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

/**
 * Detects whether the given URL pathname is the root landing page.
 */
export function isLandingPath(pathname: string): boolean {
  if (!pathname || pathname === '') return true;

  const normalized = pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;

  return normalized === '/' || normalized === '' || normalized === '/index.html';
}
