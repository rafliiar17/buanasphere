/**
 * Curated World Cities Dataset with Accurate Geographic Coordinates & Timezone Offsets (ADR 0052, ADR 0054 & ADR 0071)
 * Decoupled from hardcoded TypeScript to JSON dataset.
 */

import worldCitiesTimeRaw from './world_cities_time_dataset.json';

export interface WorldCityTimeInfo {
  id: string;
  cityName: string;
  countryIso3: string;
  countryName: string;
  flagEmoji: string;
  lat: number;
  lng: number;
  utcOffset: number;
  timezoneAbbr: string;
  timezoneName: string;
  isMajorHub: boolean;
  regionGroup?: 'indonesia' | 'asia_pacific' | 'europe_me' | 'americas' | 'africa';
  populationRank?: number;
  population?: number;
}

export const WORLD_CITIES_TIME: readonly WorldCityTimeInfo[] = worldCitiesTimeRaw as unknown as readonly WorldCityTimeInfo[];

/**
 * Find city by unique ID
 */
export function getWorldCityById(id: string): WorldCityTimeInfo | undefined {
  return WORLD_CITIES_TIME.find((c) => c.id === id);
}

/**
 * Filter cities belonging to a specific country ISO3 (e.g. 'IDN')
 */
export function findCitiesByCountry(iso3: string): WorldCityTimeInfo[] {
  const query = iso3.toUpperCase();
  return WORLD_CITIES_TIME.filter((c) => c.countryIso3 === query);
}

/**
 * Filter cities belonging to a specific timezone abbreviation (e.g. 'WIB', 'WITA', 'WIT')
 */
export function findCitiesByTimezoneAbbr(abbr: string): WorldCityTimeInfo[] {
  const query = abbr.toUpperCase();
  return WORLD_CITIES_TIME.filter((c) => c.timezoneAbbr === query);
}

/**
 * Search cities by query (matches city name, country name, ISO3, or timezone abbreviation)
 */
export function searchWorldCities(query: string, limit: number = 8): WorldCityTimeInfo[] {
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase().trim();

  return WORLD_CITIES_TIME.filter(
    (c) =>
      c.cityName.toLowerCase().includes(q) ||
      c.countryName.toLowerCase().includes(q) ||
      c.countryIso3.toLowerCase() === q ||
      c.timezoneAbbr.toLowerCase() === q
  ).slice(0, limit);
}
