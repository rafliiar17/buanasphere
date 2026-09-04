import type { MicroappHandler } from '../types.ts';
import type { Env } from '../../db/index.ts';

export const ALLOWED_QUAKE_DOMAINS = ['earthquake.usgs.gov', 'data.bmkg.go.id'];

export const USGS_4_5_FEED_URL =
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson';
export const USGS_FDSN_QUERY_URL =
  'https://earthquake.usgs.gov/fdsnws/event/1/query';
export const BMKG_AUTOGEMPA_URL =
  'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json';
export const BMKG_GEMPADIRASAKAN_URL =
  'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json';

export interface QuakeEventRecord {
  id: string;
  lat: number;
  lng: number;
  magnitude: number;
  depthKm: number;
  place: string;
  timestamp: string;
  time: string;
  tsunamiWarning: boolean;
  potensiTsunami?: boolean;
  wilayahPusat?: string;
  dirasakanMmi?: string;
  shakemapUrl?: string;
  seismicRiskTier: 'high' | 'moderate' | 'low';
  countryIso3: string;
  source: string;
}

export interface QuakeIngestionResult {
  events: QuakeEventRecord[];
  latestAutoGempa?: QuakeEventRecord | null;
  totalCount: number;
  source: 'hybrid_live' | 'usgs_live' | 'bmkg_live';
  lastUpdated: string;
}

/**
 * Enforces strict domain allowlist to prevent SSRF vulnerabilities.
 */
export function assertQuakeUrlAllowed(urlStr: string): void {
  const parsed = new URL(urlStr);
  if (!ALLOWED_QUAKE_DOMAINS.includes(parsed.hostname)) {
    throw new Error(
      `SSRF Blocked: Host '${parsed.hostname}' is not in the allowed earthquake ingestion domain list`
    );
  }
}

/**
 * Builds USGS FDSN query URL based on dynamic parameters.
 */
export function buildUsgsFdsnUrl(params: {
  minMagnitude?: number;
  limit?: number;
  orderBy?: string;
}): string {
  const minMag = params.minMagnitude ?? 4.5;
  const limit = params.limit ?? 50;
  const orderBy = params.orderBy ?? 'time';
  return `${USGS_FDSN_QUERY_URL}?format=geojson&minmagnitude=${minMag}&limit=${limit}&orderby=${orderBy}`;
}

/**
 * Parses USGS GeoJSON FeatureCollection into typed QuakeEventRecord array.
 * Note: USGS geometry coordinates are [longitude, latitude, depthKm].
 */
export function parseUsgsGeoJson(geojson: any): QuakeEventRecord[] {
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
    else if (
      placeLower.includes('united states') ||
      placeLower.includes('california') ||
      placeLower.includes('alaska')
    ) {
      countryIso3 = 'USA';
    }

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
export function parseBmkgAutoGempa(payload: any): QuakeEventRecord | null {
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
    (potensiText.toLowerCase().includes('peringatan dini tsunami') ||
      potensiText.toLowerCase().includes('berpotensi tsunami')) &&
    !potensiText.toLowerCase().includes('tidak berpotensi');

  const shakemap = g.Shakemap
    ? `https://data.bmkg.go.id/DataMKG/TEWS/${g.Shakemap}`
    : undefined;

  let seismicRiskTier: 'high' | 'moderate' | 'low' = 'moderate';
  if (mag >= 6.0) seismicRiskTier = 'high';
  else if (mag < 5.0) seismicRiskTier = 'low';

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
    seismicRiskTier,
    countryIso3: 'IDN',
    source: 'BMKG Autogempa',
  };
}

/**
 * Parses BMKG gempadirasakan.json payload.
 */
export function parseBmkgDirasakan(payload: any): QuakeEventRecord[] {
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

    let seismicRiskTier: 'high' | 'moderate' | 'low' = 'moderate';
    if (mag >= 6.0) seismicRiskTier = 'high';
    else if (mag < 5.0) seismicRiskTier = 'low';

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
      seismicRiskTier,
      countryIso3: 'IDN',
      source: 'BMKG Dirasakan',
    };
  });
}

/**
 * Merges USGS and BMKG feeds into a unified hybrid collection.
 * Deduplicates entries within 0.3° lat/lng and 10 minutes timestamp.
 */
export function mergeHybridQuakeEvents(
  usgsEvents: QuakeEventRecord[],
  autoGempa: QuakeEventRecord | null,
  feltEvents: QuakeEventRecord[]
): QuakeEventRecord[] {
  const merged: QuakeEventRecord[] = [];
  const seenPositions: Array<{ lat: number; lng: number; timeMs: number }> = [];

  const isDuplicate = (lat: number, lng: number, timeStr: string): boolean => {
    const timeMs = new Date(timeStr).getTime();
    for (const p of seenPositions) {
      const distLat = Math.abs(p.lat - lat);
      const distLng = Math.abs(p.lng - lng);
      const distTime = Math.abs(p.timeMs - timeMs);
      if (distLat < 0.35 && distLng < 0.35 && distTime < 10 * 60 * 1000) {
        return true;
      }
    }
    return false;
  };

  if (autoGempa) {
    merged.push(autoGempa);
    seenPositions.push({
      lat: autoGempa.lat,
      lng: autoGempa.lng,
      timeMs: new Date(autoGempa.timestamp).getTime(),
    });
  }

  for (const felt of feltEvents) {
    if (!isDuplicate(felt.lat, felt.lng, felt.timestamp)) {
      merged.push(felt);
      seenPositions.push({
        lat: felt.lat,
        lng: felt.lng,
        timeMs: new Date(felt.timestamp).getTime(),
      });
    }
  }

  for (const usgs of usgsEvents) {
    if (!isDuplicate(usgs.lat, usgs.lng, usgs.timestamp)) {
      merged.push(usgs);
      seenPositions.push({
        lat: usgs.lat,
        lng: usgs.lng,
        timeMs: new Date(usgs.timestamp).getTime(),
      });
    }
  }

  // Sort descending by time
  merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return merged;
}

export const quakeHandler: MicroappHandler = {
  id: 'quake',
  name: 'USGS & BMKG Live Seismic Feed',
  description:
    'Real-time earthquake monitoring combining USGS FDSN global events and BMKG Indonesian seismic detection',
  version: '1.0.0',
  cacheTtlSeconds: 180, // 3 minutes cache TTL
  async handle(params: Record<string, any> = {}, _env?: Env): Promise<QuakeIngestionResult> {
    const fetchFn: typeof fetch = params.customFetch || fetch;

    const usgsUrl =
      params.minMagnitude !== undefined || params.limit !== undefined
        ? buildUsgsFdsnUrl({
            minMagnitude: params.minMagnitude ? Number(params.minMagnitude) : 4.5,
            limit: params.limit ? Number(params.limit) : 50,
          })
        : USGS_4_5_FEED_URL;

    assertQuakeUrlAllowed(usgsUrl);
    assertQuakeUrlAllowed(BMKG_AUTOGEMPA_URL);
    assertQuakeUrlAllowed(BMKG_GEMPADIRASAKAN_URL);

    let usgsEvents: QuakeEventRecord[] = [];
    let autoGempa: QuakeEventRecord | null = null;
    let feltEvents: QuakeEventRecord[] = [];

    // Parallel fetch with strict 5s AbortSignal timeout and Promise.allSettled
    const [usgsRes, bmkgAutoRes, bmkgFeltRes] = await Promise.allSettled([
      fetchFn(usgsUrl, {
        signal: AbortSignal.timeout(5000),
        headers: { Accept: 'application/json' },
      }).then((r) => (r.ok ? r.json() : null)),
      fetchFn(BMKG_AUTOGEMPA_URL, {
        signal: AbortSignal.timeout(5000),
        headers: { Accept: 'application/json' },
      }).then((r) => (r.ok ? r.json() : null)),
      fetchFn(BMKG_GEMPADIRASAKAN_URL, {
        signal: AbortSignal.timeout(5000),
        headers: { Accept: 'application/json' },
      }).then((r) => (r.ok ? r.json() : null)),
    ]);

    if (usgsRes.status === 'fulfilled' && usgsRes.value) {
      usgsEvents = parseUsgsGeoJson(usgsRes.value);
    }

    if (bmkgAutoRes.status === 'fulfilled' && bmkgAutoRes.value) {
      autoGempa = parseBmkgAutoGempa(bmkgAutoRes.value);
    }

    if (bmkgFeltRes.status === 'fulfilled' && bmkgFeltRes.value) {
      feltEvents = parseBmkgDirasakan(bmkgFeltRes.value);
    }

    const merged = mergeHybridQuakeEvents(usgsEvents, autoGempa, feltEvents);

    return {
      events: merged,
      latestAutoGempa: autoGempa,
      totalCount: merged.length,
      source: 'hybrid_live',
      lastUpdated: new Date().toISOString(),
    };
  },
};
