/**
 * Live Earthquake Ingestion Service (USGS FDSN Web Services & BMKG Open Data)
 * ADR 0065 & ADR 0073: Connects /quake to real-time seismic public APIs with graceful fallback.
 */

import {
  GLOBAL_EARTHQUAKES,
  type EarthquakeRecord,
} from '$lib/framework/geoglobe/data/earthquakeData';
import type { GeoRing } from '$lib/framework/geoglobe/types';

export const USGS_4_5_FEED_URL =
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson';
export const USGS_FDSN_QUERY_URL =
  'https://earthquake.usgs.gov/fdsnws/event/1/query';

export const BMKG_AUTOGEMPA_URL =
  'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json';
export const BMKG_GEMPATERKINI_URL =
  'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json';
export const BMKG_GEMPADIRASAKAN_URL =
  'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json';

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

export type EnrichedEarthquakeRecord = EarthquakeRecord & {
  time?: string;
  source?: string;
  potensiTsunami?: boolean;
  wilayahPusat?: string;
  dirasakanMmi?: string;
  shakemapUrl?: string;
};

export interface LiveEarthquakeResult {
  events: EnrichedEarthquakeRecord[];
  isLive: boolean;
  source: 'usgs_live' | 'bmkg_live' | 'hybrid_live' | 'fallback_bundled';
  lastUpdated: string;
  totalCount: number;
  latestAutoGempa?: EnrichedEarthquakeRecord | null;
}

let cachedResult: LiveEarthquakeResult | null = null;
let lastCacheTime = 0;

/**
 * Parses USGS GeoJSON FeatureCollection into typed EarthquakeRecord array.
 * Note: USGS geometry coordinates are [longitude, latitude, depthKm].
 */
export function parseUsgsGeoJson(geojson: any): EnrichedEarthquakeRecord[] {
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
 * Parses BMKG autogempa.json payload (real-time latest earthquake).
 */
export function parseBmkgAutoGempa(payload: any): EnrichedEarthquakeRecord | null {
  if (!payload?.Infogempa?.gempa) return null;
  const g = payload.Infogempa.gempa;

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
  const place = g.Wilayah || 'Wilayah Indonesia';
  const timeIso = g.DateTime ? new Date(g.DateTime).toISOString() : new Date().toISOString();
  const potensiText = String(g.Potensi || '');
  const tsunamiWarning =
    potensiText.toLowerCase().includes('peringatan dini tsunami') ||
    potensiText.toLowerCase().includes('berpotensi tsunami') &&
    !potensiText.toLowerCase().includes('tidak berpotensi');

  const shakemap = g.Shakemap ? `https://data.bmkg.go.id/DataMKG/TEWS/${g.Shakemap}` : undefined;

  return {
    id: `bmkg-auto-${g.DateTime || Date.now()}`,
    lat,
    lng,
    magnitude: mag,
    depthKm: depth,
    place,
    timestamp: timeIso,
    time: timeIso,
    tsunamiWarning,
    potensiTsunami: tsunamiWarning,
    wilayahPusat: place,
    dirasakanMmi: g.Dirasakan || undefined,
    shakemapUrl: shakemap,
    seismicRiskTier: mag >= 6.0 ? 'high' : 'moderate',
    countryIso3: 'IDN',
    source: 'BMKG Autogempa',
  };
}

/**
 * Parses BMKG gempadirasakan.json payload.
 */
export function parseBmkgDirasakan(payload: any): EnrichedEarthquakeRecord[] {
  if (!payload?.Infogempa?.gempa) return [];
  const rawList = payload.Infogempa.gempa;
  const list = Array.isArray(rawList) ? rawList : [rawList];

  return list.map((g: any, idx: number) => {
    let lat = 0;
    let lng = 0;
    if (g.Coordinates) {
      const parts = String(g.Coordinates).split(',');
      lat = parseFloat(parts[0]) || 0;
      lng = parseFloat(parts[1]) || 0;
    }

    const mag = parseFloat(g.Magnitude) || 4.0;
    const depthStr = String(g.Kedalaman || '10');
    const depth = parseFloat(depthStr.replace(/[^0-9.]/g, '')) || 10;
    const place = g.Wilayah || 'Indonesia';
    const timeIso = g.DateTime ? new Date(g.DateTime).toISOString() : new Date().toISOString();

    return {
      id: `bmkg-felt-${g.DateTime || idx}`,
      lat,
      lng,
      magnitude: mag,
      depthKm: depth,
      place,
      timestamp: timeIso,
      time: timeIso,
      tsunamiWarning: false,
      dirasakanMmi: g.Dirasakan || undefined,
      seismicRiskTier: mag >= 6.0 ? 'high' : 'moderate',
      countryIso3: 'IDN',
      source: 'BMKG Dirasakan',
    };
  });
}

/**
 * Parses BMKG JSON response (gempaterkini.json)
 */
export function parseBmkgGempa(bmkgJson: any): EnrichedEarthquakeRecord[] {
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
    const tsunamiWarning = Boolean(g.Potensi && g.Potensi.toLowerCase().includes('tsunami') && !g.Potensi.toLowerCase().includes('tidak'));

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
 * Builds USGS FDSN query URL with dynamic parameters.
 */
export function buildUsgsFdsnUrl(options: {
  minMagnitude?: number;
  maxMagnitude?: number;
  limit?: number;
  orderBy?: string;
  startTime?: string;
  endTime?: string;
}): string {
  const params = new URLSearchParams();
  params.set('format', 'geojson');
  if (options.minMagnitude !== undefined) params.set('minmagnitude', String(options.minMagnitude));
  if (options.maxMagnitude !== undefined) params.set('maxmagnitude', String(options.maxMagnitude));
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  if (options.orderBy !== undefined) params.set('orderby', options.orderBy);
  if (options.startTime !== undefined) params.set('starttime', options.startTime);
  if (options.endTime !== undefined) params.set('endtime', options.endTime);

  return `${USGS_FDSN_QUERY_URL}?${params.toString()}`;
}

/**
 * Fetches custom USGS FDSN events with query parameters and offline fallback.
 */
export async function fetchUsgsCustomEvents(options?: {
  minMagnitude?: number;
  limit?: number;
  orderBy?: string;
  startTime?: string;
  endTime?: string;
  customFetch?: typeof fetch;
  timeoutMs?: number;
}): Promise<EnrichedEarthquakeRecord[]> {
  const fetchClient = options?.customFetch || (typeof fetch !== 'undefined' ? fetch : null);
  const timeoutMs = options?.timeoutMs || 5000;

  if (!fetchClient) {
    return GLOBAL_EARTHQUAKES;
  }

  const url = buildUsgsFdsnUrl({
    minMagnitude: options?.minMagnitude ?? 4.5,
    limit: options?.limit ?? 50,
    orderBy: options?.orderBy ?? 'time',
    startTime: options?.startTime,
    endTime: options?.endTime,
  });

  try {
    const res = await fetchClient(url, {
      signal: AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined,
    });
    if (!res.ok) return GLOBAL_EARTHQUAKES;
    const json = await res.json();
    const records = parseUsgsGeoJson(json);
    return records.length > 0 ? records : GLOBAL_EARTHQUAKES;
  } catch (_err) {
    return GLOBAL_EARTHQUAKES;
  }
}

/**
 * Fetches latest real-time BMKG autogempa.
 */
export async function fetchLatestBmkgAutoGempa(options?: {
  customFetch?: typeof fetch;
  timeoutMs?: number;
}): Promise<EnrichedEarthquakeRecord | null> {
  const fetchClient = options?.customFetch || (typeof fetch !== 'undefined' ? fetch : null);
  const timeoutMs = options?.timeoutMs || 5000;
  if (!fetchClient) return null;

  try {
    const res = await fetchClient(BMKG_AUTOGEMPA_URL, {
      signal: AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return parseBmkgAutoGempa(json);
  } catch (_err) {
    return null;
  }
}

/**
 * Generates 3D Globe epicenter pulsing rings scaled by magnitude and depth.
 */
export function getLiveEarthquakeRings(
  events: EnrichedEarthquakeRecord[]
): GeoRing[] {
  return events.map((eq) => {
    let color = '#eab308'; // M < 5 (kuning)
    if (eq.magnitude >= 6.0) {
      color = '#ef4444'; // M >= 6 (merah bahaya)
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
 * Fetches hybrid real-time earthquake feeds with strict timeout and fallback.
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
    const [usgsRes, bmkgAutoRes] = await Promise.allSettled([
      fetchClient(USGS_4_5_FEED_URL, {
        signal: AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined,
      }).then(async (res) => (res.ok ? res.json() : null)),
      fetchLatestBmkgAutoGempa({ customFetch: fetchClient, timeoutMs }),
    ]);

    const usgsData = usgsRes.status === 'fulfilled' ? usgsRes.value : null;
    const latestAuto = bmkgAutoRes.status === 'fulfilled' ? bmkgAutoRes.value : null;

    const usgsEvents = parseUsgsGeoJson(usgsData);

    // Combine events, ensuring latest auto gempa is prepended if available
    let combinedEvents: EnrichedEarthquakeRecord[] = [...usgsEvents];
    if (latestAuto) {
      const alreadyHasIt = combinedEvents.some(
        (e) => Math.abs(e.lat - latestAuto.lat) < 0.2 && Math.abs(e.lng - latestAuto.lng) < 0.2
      );
      if (!alreadyHasIt) {
        combinedEvents = [latestAuto, ...combinedEvents];
      }
    }

    if (combinedEvents.length > 0) {
      const result: LiveEarthquakeResult = {
        events: combinedEvents,
        isLive: true,
        source: latestAuto ? 'hybrid_live' : 'usgs_live',
        lastUpdated: new Date().toISOString(),
        totalCount: combinedEvents.length,
        latestAutoGempa: latestAuto,
      };
      cachedResult = result;
      lastCacheTime = now;
      return result;
    }

    return getFallbackResult(latestAuto);
  } catch (_err) {
    return getFallbackResult();
  }
}

function getFallbackResult(latestAuto?: EnrichedEarthquakeRecord | null): LiveEarthquakeResult {
  return {
    events: latestAuto ? [latestAuto, ...GLOBAL_EARTHQUAKES] : GLOBAL_EARTHQUAKES,
    isLive: false,
    source: 'fallback_bundled',
    lastUpdated: new Date().toISOString(),
    totalCount: GLOBAL_EARTHQUAKES.length,
    latestAutoGempa: latestAuto ?? null,
  };
}
