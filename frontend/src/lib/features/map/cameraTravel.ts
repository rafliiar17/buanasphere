/**
 * Spatial Camera Travel Engine for 3D WebGL Globe (ADR 0049)
 * 
 * Provides great-circle angular distance calculation, adaptive focus altitudes
 * based on country spatial dimensions, and two-stage parabolic travel trajectories.
 */

import { EXTENDED_COUNTRIES_DATA } from '$lib/framework/geoglobe/countrySpatialData';

export interface CameraCoordinates {
  lat: number;
  lng: number;
  altitude?: number;
}

export interface TravelStage {
  lat: number;
  lng: number;
  altitude: number;
  durationMs: number;
}

export interface TravelTrajectory {
  isTwoStage: boolean;
  distanceDeg: number;
  stage1: TravelStage;
  stage2: TravelStage;
}

/**
 * Calculates the great-circle angular distance in degrees between two geographic coordinates
 * using the Haversine formula on a unit sphere.
 */
export function calculateGreatCircleDistanceDeg(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const rad = Math.PI / 180;
  const phi1 = lat1 * rad;
  const phi2 = lat2 * rad;
  const dPhi = (lat2 - lat1) * rad;
  const dLam = (lng2 - lng1) * rad;

  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLam / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(Math.max(0, a)), Math.sqrt(Math.max(0, 1 - a)));

  return c * (180 / Math.PI);
}

/**
 * Country focus altitudes categorized by land area / geographic bounding box.
 * Ensures smaller nations are zoomed tightly while continent-sized nations fit the screen.
 */
const COUNTRY_FOCUS_ALTITUDES: Record<string, number> = {
  // Giant / Continent-scale Nations
  RUS: 1.15,
  CAN: 1.15,
  USA: 1.15,
  CHN: 1.15,
  BRA: 1.15,
  AUS: 1.15,

  // Large Nations
  IDN: 0.85,
  IND: 0.85,
  ARG: 0.85,
  KAZ: 0.85,
  DZA: 0.85,
  COD: 0.85,
  SAU: 0.85,
  MEX: 0.85,

  // Medium Nations (including Malaysia)
  MYS: 0.55,
  THA: 0.55,
  VNM: 0.55,
  PHL: 0.55,
  JPN: 0.55,
  KOR: 0.55,
  GBR: 0.55,
  DEU: 0.55,
  FRA: 0.55,
  ESP: 0.55,
  ITA: 0.55,
  TUR: 0.55,
  EGY: 0.55,
  ZAF: 0.55,
  COL: 0.55,
  PER: 0.55,
  CHL: 0.55,
  POL: 0.55,
  UKR: 0.55,
  SWE: 0.55,
  NOR: 0.55,
  FIN: 0.55,
  NZL: 0.55,

  // Compact / Micro Nations & City States
  SGP: 0.30,
  BHR: 0.30,
  MLT: 0.30,
  MDV: 0.30,
  BRN: 0.30,
  QAT: 0.30,
  KWT: 0.30,
  LUX: 0.30,
  CYP: 0.30,
  MUS: 0.30,
  SYC: 0.30,
  FJI: 0.30,
  WSM: 0.30,
  TON: 0.30,
  AND: 0.30,
  MCO: 0.30,
  LIE: 0.30,
  SMR: 0.30,
  VAT: 0.30,
};

/**
 * Returns the optimal camera altitude when focusing on a country.
 */
export function getCountryFocusAltitude(iso3: string): number {
  if (!iso3) return 0.60;
  return COUNTRY_FOCUS_ALTITUDES[iso3.toUpperCase()] ?? 0.60;
}

/**
 * Finds the geographic coordinates (lat, lng) for an ISO-3 country.
 */
export function getCountryCoordinates(iso3: string): { lat: number; lng: number } | null {
  if (!iso3) return null;
  const match = EXTENDED_COUNTRIES_DATA.find((c) => c.iso3 === iso3.toUpperCase());
  if (match) {
    return { lat: match.lat, lng: match.lng };
  }
  return null;
}

/**
 * Calculates a two-stage or single-stage travel trajectory.
 * 
 * - If angular distance is >= 12°:
 *   Stage 1 (Lift-off): Camera eases altitude upward (zoom-out) while rotating toward target.
 *   Stage 2 (Descent): Camera swoops down to target altitude over destination.
 * 
 * - If angular distance is < 12°:
 *   Single smooth swoop directly into destination.
 */
export function getTravelTrajectory(
  from: CameraCoordinates,
  to: CameraCoordinates,
  options?: { targetAltitude?: number }
): TravelTrajectory {
  const currentAlt = from.altitude || 2.2;
  const targetAlt = options?.targetAltitude ?? getCountryFocusAltitude('');
  const dist = calculateGreatCircleDistanceDeg(from.lat, from.lng, to.lat, to.lng);

  const isTwoStage = dist >= 12;

  if (!isTwoStage) {
    // Direct smooth swoop
    const singleStage: TravelStage = {
      lat: to.lat,
      lng: to.lng,
      altitude: targetAlt,
      durationMs: 700,
    };
    return {
      isTwoStage: false,
      distanceDeg: dist,
      stage1: singleStage,
      stage2: singleStage,
    };
  }

  // Parabolic Arc: lift off altitude calculation
  // Scaled with angular distance so larger travels pull back higher into space
  const liftAltitude = Math.min(2.6, Math.max(currentAlt, 1.8) + (dist / 180) * 0.85);

  const stage1: TravelStage = {
    lat: to.lat,
    lng: to.lng,
    altitude: liftAltitude,
    durationMs: 450,
  };

  const stage2: TravelStage = {
    lat: to.lat,
    lng: to.lng,
    altitude: targetAlt,
    durationMs: 750,
  };

  return {
    isTwoStage: true,
    distanceDeg: dist,
    stage1,
    stage2,
  };
}
