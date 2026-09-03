/**
 * Live Earthquake Ingestion Service (USGS GeoJSON & BMKG Live Feed)
 * ADR 0065: Connects /quake to real-time seismic public APIs with graceful fallback.
 */

import {
  GLOBAL_EARTHQUAKES,
  type EarthquakeRecord,
} from '$lib/framework/geoglobe/data/earthquakeData';
import type { GeoRing } from '$lib/framework/geoglobe/types';

export const USGS_4_5_FEED_URL =
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson';
export const BMKG_GEMPATERKINI_URL =
  'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface LiveEarthquakeResult {
  events: EarthquakeRecord[];
  isLive: boolean;
  source: 'usgs_live' | 'bmkg_live' | 'hybrid_live' | 'fallback_bundled';
  lastUpdated: string;
  totalCount: number;
}

let cachedResult: LiveEarthquakeResult | null = null;
let lastCacheTime = 0;

/**
 * Parses USGS GeoJSON FeatureCollection into typed EarthquakeRecord array.
 * Note: USGS geometry coordinates are [longitude, latitude, depthKm].
 */
export function parseUsgsGeoJson(geojson: any): (EarthquakeRecord & { time?: string; source?: string })[] {
  if (!geojson || !Array.isArray(geojson.features)) {
    return [];
  }

  return geojson.features.map((feat: any, idx: number) => {
    const props = feat.properties || {};
    const geom = feat.geometry || {};
    const coords = Array.isArray(geom.coordinates) ? geom.coordinates : [0, 0, 10];
    const lng = Number(coords[0]) || 0;
    const lat = Number(coords[1]) || 0;
    const depth = Number(coords[2]) || 10;
    const mag = Number(props.mag) || 4.5;
    const place = String(props.place || 'Lokasi Samudera Global');
    const timeIso = props.time ? new Date(props.time).toISOString() : new Date().toISOString();
    const tsunamiWarning = Boolean(props.tsunami === 1);

    let seismicRiskTier: 'high' | 'moderate' | 'low' = 'moderate';
    if (mag >= 6.0) seismicRiskTier = 'high';
    else if (mag < 5.0) seismicRiskTier = 'low';

    // Simple heuristic for country matching based on place name string
    let countryIso3 = 'GLOBAL';
    const placeLower = place.toLowerCase();
    if (placeLower.includes('indonesia')) countryIso3 = 'IDN';
    else if (placeLower.includes('japan')) countryIso3 = 'JPN';
    else if (placeLower.includes('china')) countryIso3 = 'CHN';
    else if (placeLower.includes('philippines')) countryIso3 = 'PHL';
    else if (placeLower.includes('chile')) countryIso3 = 'CHL';
    else if (placeLower.includes('turkey') || placeLower.includes('türkiye')) countryIso3 = 'TUR';
    else if (placeLower.includes('papua new guinea')) countryIso3 = 'PNG';
    else if (placeLower.includes('mexico')) countryIso3 = 'MEX';
    else if (placeLower.includes('united states') || placeLower.includes('california') || placeLower.includes('alaska')) countryIso3 = 'USA';

    return {
      id: String(feat.id || `usgs-${idx}`),
      lat,
      lng,
      magnitude: mag,
      depthKm: depth,
      place,
      timestamp: timeIso,
      time: timeIso,
      tsunamiWarning,
      seismicRiskTier,
      countryIso3,
      source: 'USGS',
    };
  });
}

/**
 * Parses BMKG JSON response (gempaterkini.json or autogempa.json)
 */
export function parseBmkgGempa(bmkgJson: any): (EarthquakeRecord & { time?: string; source?: string })[] {
  if (!bmkgJson?.Infogempa) return [];

  const rawGempaList = bmkgJson.Infogempa.gempa;
  const list = Array.isArray(rawGempaList) ? rawGempaList : rawGempaList ? [rawGempaList] : [];

  return list.map((g: any, idx: number) => {
    let lat = 0;
    let lng = 0;

    if (g.Coordinates) {
      const parts = String(g.Coordinates).split(',');
      lat = parseFloat(parts[0]) || 0;
      lng = parseFloat(parts[1]) || 0;
    } else if (g.Lintang && g.Bujur) {
      const latVal = parseFloat(g.Lintang) || 0;
      lat = g.Lintang.includes('LS') ? -Math.abs(latVal) : Math.abs(latVal);
      const lngVal = parseFloat(g.Bujur) || 0;
      lng = g.Bujur.includes('BB') ? -Math.abs(lngVal) : Math.abs(lngVal);
    }

    const mag = parseFloat(g.Magnitude) || 5.0;
    const depthStr = String(g.Kedalaman || '10');
    const depth = parseFloat(depthStr.replace(/[^0-9.]/g, '')) || 10;
    const place = g.Wilayah || 'Kepulauan Indonesia';
    const timeIso = g.DateTime ? new Date(g.DateTime).toISOString() : new Date().toISOString();
    const tsunamiWarning = Boolean(g.Potensi && g.Potensi.toLowerCase().includes('tsunami'));

    return {
      id: `bmkg-${g.DateTime || idx}`,
      lat,
      lng,
      magnitude: mag,
      depthKm: depth,
      place,
      timestamp: timeIso,
      time: timeIso,
      tsunamiWarning,
      seismicRiskTier: mag >= 6.0 ? 'high' : 'moderate',
      countryIso3: 'IDN',
      source: 'BMKG',
    };
  });
}

/**
 * Generates 3D Globe epicenter pulsing rings scaled by magnitude
 */
export function getLiveEarthquakeRings(
  events: (EarthquakeRecord & { time?: string; source?: string })[]
): GeoRing[] {
  return events.map((eq) => {
    let color = '#eab308'; // M < 5 (kuning)
    if (eq.magnitude >= 6.0) {
      color = '#ef4444'; // M >= 6 (merah)
    } else if (eq.magnitude >= 5.0) {
      color = '#f97316'; // M >= 5 (oranye)
    }

    return {
      lat: eq.lat,
      lng: eq.lng,
      maxRadius: Math.max(1.5, eq.magnitude * 1.5),
      propagationSpeed: 2.5,
      repeatPeriod: 1800,
      color,
    };
  });
}

export function clearLiveEarthquakeCache(): void {
  cachedResult = null;
  lastCacheTime = 0;
}

/**
 * Fetches real-time earthquake feeds with strict timeout and fallback
 */
export async function fetchLiveEarthquakes(options?: {
  customFetch?: typeof fetch;
  forceRefresh?: boolean;
  timeoutMs?: number;
}): Promise<LiveEarthquakeResult> {
  const now = Date.now();
  if (
    !options?.forceRefresh &&
    !options?.customFetch &&
    cachedResult &&
    now - lastCacheTime < CACHE_TTL_MS
  ) {
    return cachedResult;
  }

  const fetchClient = options?.customFetch || (typeof fetch !== 'undefined' ? fetch : null);
  const timeoutMs = options?.timeoutMs || 5000;

  if (!fetchClient) {
    return getFallbackResult();
  }

  try {
    const usgsPromise = fetchClient(USGS_4_5_FEED_URL, {
      signal: AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined,
    }).then(async (res) => (res.ok ? res.json() : null));

    const usgsData = await usgsPromise;
    const usgsEvents = parseUsgsGeoJson(usgsData);

    if (usgsEvents.length > 0) {
      const result: LiveEarthquakeResult = {
        events: usgsEvents,
        isLive: true,
        source: 'usgs_live',
        lastUpdated: new Date().toISOString(),
        totalCount: usgsEvents.length,
      };
      cachedResult = result;
      lastCacheTime = now;
      return result;
    }

    return getFallbackResult();
  } catch (_err) {
    return getFallbackResult();
  }
}

function getFallbackResult(): LiveEarthquakeResult {
  return {
    events: GLOBAL_EARTHQUAKES,
    isLive: false,
    source: 'fallback_bundled',
    lastUpdated: new Date().toISOString(),
    totalCount: GLOBAL_EARTHQUAKES.length,
  };
}
