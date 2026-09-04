/**
 * Natural Earth 110m Populated Places Dataset & Typed Loader (ADR 0072).
 * Sourced from Natural Earth 1:110m Populated Places Cartographic Dataset (Public Domain).
 * Canonical dataset used by globe.gl (Vasturiano) for 3D world city & population visualization.
 */

import populatedPlacesRaw from './ne_110m_populated_places_simple.json';

export interface PopulatedPlace {
  name: string;
  nameascii: string;
  countryIso3: string;
  countryName: string;
  lat: number;
  lng: number;
  popMax: number;
  popMin: number;
  isCapital: boolean;
  isMegacity: boolean;
  scaleRank: number;
  labelRank: number;
  featureClass?: string;
  worldCity?: boolean;
}

interface GeoJsonFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  properties: Record<string, any>;
}

interface GeoJsonFeatureCollection {
  type: string;
  features: GeoJsonFeature[];
}

const geojson = populatedPlacesRaw as unknown as GeoJsonFeatureCollection;

// Map once to clean typed array
const ALL_POPULATED_PLACES: PopulatedPlace[] = (geojson.features || []).map((f) => {
  const props = f.properties || {};
  const coords = f.geometry?.coordinates || [0, 0];
  const popMax = Number(props.pop_max || 0);
  const popMin = Number(props.pop_min || 0);
  const isCapital = props.adm0cap === 1;
  const isMegacity = props.megacity === 1 || popMax >= 10_000_000;

  return {
    name: String(props.name || ''),
    nameascii: String(props.nameascii || props.name || ''),
    countryIso3: String(props.adm0_a3 || props.sov_a3 || '').toUpperCase().trim(),
    countryName: String(props.adm0name || props.sov0name || ''),
    lat: Number(coords[1]),
    lng: Number(coords[0]),
    popMax,
    popMin,
    isCapital,
    isMegacity,
    scaleRank: Number(props.scalerank || 0),
    labelRank: Number(props.labelrank || 0),
    featureClass: props.featurecla,
    worldCity: props.worldcity === 1,
  };
});

export function getAllPopulatedPlaces(): PopulatedPlace[] {
  return ALL_POPULATED_PLACES;
}

export function getMegacities(): PopulatedPlace[] {
  return ALL_POPULATED_PLACES.filter((p) => p.isMegacity || p.popMax >= 10_000_000);
}

export function getCapitals(): PopulatedPlace[] {
  return ALL_POPULATED_PLACES.filter((p) => p.isCapital);
}

export function getPopulatedPlacesByCountry(iso3: string): PopulatedPlace[] {
  const cleanIso3 = (iso3 || '').toUpperCase().trim();
  return ALL_POPULATED_PLACES.filter((p) => p.countryIso3 === cleanIso3);
}

/**
 * Filter populated places adaptively based on camera altitude (ADR 0072 & ADR 0056).
 * Zoomed out (altitude >= 2.0): Top tier major hubs (scaleRank <= 2).
 * Medium orbit (1.2 <= altitude < 2.0): Regional hubs (scaleRank <= 4).
 * Zoomed in (altitude < 1.2): Detailed view (all scale ranks).
 */
export function getPopulatedPlacesByLOD(altitude: number): PopulatedPlace[] {
  if (altitude >= 2.0) {
    return ALL_POPULATED_PLACES.filter((p) => p.scaleRank <= 2 || p.isMegacity);
  }
  if (altitude >= 1.2) {
    return ALL_POPULATED_PLACES.filter((p) => p.scaleRank <= 4 || p.isCapital || p.isMegacity);
  }
  return ALL_POPULATED_PLACES;
}
