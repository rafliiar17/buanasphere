/**
 * Authentic Primary National Flag Colors for Global Countries (195+ Countries).
 * Based on official flag vexillological primary colors.
 * Decoupled from hardcoded TypeScript to JSON dataset (ADR 0071).
 */

import countryFlagColorsRaw from './country_flag_colors.json';

export const COUNTRY_FLAG_COLOR_MAP: Record<string, string> = countryFlagColorsRaw as unknown as Record<string, string>;

/**
 * Get authentic national flag color for a given country ISO-3.
 */
export function getCountryFlagColor(iso3: string, isDark: boolean = true): string {
  const hex = COUNTRY_FLAG_COLOR_MAP[iso3.toUpperCase()];
  if (hex) {
    return hex;
  }
  // Fallback deterministic vibrant pastel tone
  const fallback = [
    '#dc2626', '#2563eb', '#15803d', '#d97706', '#7c3aed',
    '#0284c7', '#ea580c', '#0d9488', '#4f46e5', '#16a34a'
  ];
  let hash = 0;
  for (let i = 0; i < iso3.length; i++) {
    hash = (hash * 31 + iso3.charCodeAt(i)) & 0xffffffff;
  }
  return fallback[Math.abs(hash) % fallback.length];
}
