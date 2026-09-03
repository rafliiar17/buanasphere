/**
 * Globe.gl Camera & Travel Animation Engine
 * 
 * Provides smooth Point-of-View (POV) controls, 2-stage parabolic swoop camera travel,
 * country-scale adaptive focus altitudes, and responsive zoom/reset controls.
 */

import { getCountryCoordinates } from '../data/countrySpatialData';
import type {
  CameraPointOfView,
  CameraTravelOptions,
  GlobeInstance,
  TravelStage,
  TravelTrajectory,
} from './types';

/**
 * Default global overview POV (focused over Southeast Asia & Indo-Pacific).
 */
export const DEFAULT_VIEW_POV: CameraPointOfView = {
  lat: 0.5,
  lng: 115.0,
  altitude: 2.2,
};

/**
 * Country focus altitudes categorized by land area / geographic bounding box.
 * Ensures micro-states are zoomed in tightly while continent-sized nations fit the viewport.
 */
export const COUNTRY_FOCUS_ALTITUDES: Readonly<Record<string, number>> = {
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

  // Medium Nations
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
 * Returns the optimal camera altitude for focusing on a specific ISO-3 country.
 */
export function getCountryFocusAltitude(iso3?: string | null): number {
  if (!iso3) return 0.60;
  return COUNTRY_FOCUS_ALTITUDES[iso3.trim().toUpperCase()] ?? 0.60;
}

/**
 * Calculates great-circle angular distance in degrees between two coordinates on a unit sphere.
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
 * Computes a single-stage direct swoop or two-stage parabolic travel trajectory.
 * 
 * - If angular distance >= thresholdDeg (default 12°):
 *   Stage 1 (Lift-off): Camera pulls back altitude into space while centering toward target.
 *   Stage 2 (Descent): Camera swoops in smoothly to the target altitude over the destination.
 * 
 * - If angular distance < thresholdDeg:
 *   Single smooth direct swoop into destination.
 */
export function getTravelTrajectory(
  from: CameraPointOfView,
  to: Partial<CameraPointOfView> & { lat: number; lng: number },
  options?: CameraTravelOptions
): TravelTrajectory {
  const threshold = options?.thresholdDeg ?? 12;
  const targetAlt = to.altitude ?? options?.targetAltitude ?? 0.60;
  const currentAlt = from.altitude ?? DEFAULT_VIEW_POV.altitude;
  const dist = calculateGreatCircleDistanceDeg(from.lat, from.lng, to.lat, to.lng);

  const isTwoStage = dist >= threshold;

  if (!isTwoStage) {
    const directDuration = options?.directDurationMs ?? 700;
    const singleStage: TravelStage = {
      lat: to.lat,
      lng: to.lng,
      altitude: targetAlt,
      durationMs: directDuration,
    };
    return {
      isTwoStage: false,
      distanceDeg: dist,
      stage1: singleStage,
      stage2: singleStage,
    };
  }

  // Parabolic lift altitude scaled by angular distance
  const liftAltitude = Math.min(2.6, Math.max(currentAlt, 1.8) + (dist / 180) * 0.85);
  const stage1Duration = options?.stage1DurationMs ?? 450;
  const stage2Duration = options?.stage2DurationMs ?? 750;

  const stage1: TravelStage = {
    lat: to.lat,
    lng: to.lng,
    altitude: liftAltitude,
    durationMs: stage1Duration,
  };

  const stage2: TravelStage = {
    lat: to.lat,
    lng: to.lng,
    altitude: targetAlt,
    durationMs: stage2Duration,
  };

  return {
    isTwoStage: true,
    distanceDeg: dist,
    stage1,
    stage2,
  };
}

/**
 * Gets the current camera POV from a globe instance.
 */
export function getPointOfView(globe: GlobeInstance): CameraPointOfView {
  if (!globe || typeof globe.pointOfView !== 'function') {
    return { ...DEFAULT_VIEW_POV };
  }
  const pov = globe.pointOfView();
  return {
    lat: pov?.lat ?? DEFAULT_VIEW_POV.lat,
    lng: pov?.lng ?? DEFAULT_VIEW_POV.lng,
    altitude: pov?.altitude ?? DEFAULT_VIEW_POV.altitude,
  };
}

/**
 * Sets point of view on a globe instance with optional transition duration.
 */
export function setPointOfView(
  globe: GlobeInstance,
  pov: Partial<CameraPointOfView>,
  ms: number = 0
): void {
  if (!globe || typeof globe.pointOfView !== 'function') return;
  globe.pointOfView(pov, ms);
}

/**
 * Resets camera back to default overview.
 */
export function resetView(globe: GlobeInstance, ms: number = 900): void {
  setPointOfView(globe, DEFAULT_VIEW_POV, ms);
}

/**
 * Zooms in by scaling altitude down (clamped to 0.12 min).
 */
export function zoomIn(globe: GlobeInstance, factor: number = 0.7, ms: number = 400): void {
  const current = getPointOfView(globe);
  const targetAltitude = Math.max(0.12, current.altitude * factor);
  setPointOfView(globe, { altitude: targetAltitude }, ms);
}

/**
 * Zooms out by scaling altitude up (clamped to 4.0 max).
 */
export function zoomOut(globe: GlobeInstance, factor: number = 1.4, ms: number = 400): void {
  const current = getPointOfView(globe);
  const targetAltitude = Math.min(4.0, current.altitude * factor);
  setPointOfView(globe, { altitude: targetAltitude }, ms);
}

// Internal reference for ongoing travel cancellation
let activeTravelTimer: any = null;

/**
 * Executes smooth camera travel to a target position using 2-stage swoop or direct swoop.
 */
export function travelTo(
  globe: GlobeInstance,
  target: Partial<CameraPointOfView> & { lat: number; lng: number; iso3?: string },
  options?: CameraTravelOptions
): Promise<void> {
  if (activeTravelTimer) {
    clearTimeout(activeTravelTimer);
    activeTravelTimer = null;
  }

  return new Promise((resolve) => {
    if (!globe || typeof globe.pointOfView !== 'function') {
      resolve();
      return;
    }

    const currentPov = getPointOfView(globe);
    const targetAltitude = target.altitude ?? (target.iso3 ? getCountryFocusAltitude(target.iso3) : 0.60);
    const trajectory = getTravelTrajectory(currentPov, { ...target, altitude: targetAltitude }, options);

    if (!trajectory.isTwoStage) {
      globe.pointOfView(
        { lat: trajectory.stage1.lat, lng: trajectory.stage1.lng, altitude: trajectory.stage1.altitude },
        trajectory.stage1.durationMs
      );
      activeTravelTimer = setTimeout(() => {
        activeTravelTimer = null;
        resolve();
      }, trajectory.stage1.durationMs + 20);
      return;
    }

    // Stage 1: Lift-off
    globe.pointOfView(
      { lat: trajectory.stage1.lat, lng: trajectory.stage1.lng, altitude: trajectory.stage1.altitude },
      trajectory.stage1.durationMs
    );

    activeTravelTimer = setTimeout(() => {
      // Stage 2: Descent
      globe.pointOfView(
        { lat: trajectory.stage2.lat, lng: trajectory.stage2.lng, altitude: trajectory.stage2.altitude },
        trajectory.stage2.durationMs
      );

      activeTravelTimer = setTimeout(() => {
        activeTravelTimer = null;
        resolve();
      }, trajectory.stage2.durationMs + 20);
    }, trajectory.stage1.durationMs);
  });
}

/**
 * Convenience helper to travel directly to a country given its ISO-3 code.
 */
export async function travelToCountry(
  globe: GlobeInstance,
  iso3: string,
  options?: CameraTravelOptions
): Promise<boolean> {
  const coords = getCountryCoordinates(iso3);
  if (!coords) return false;

  const altitude = getCountryFocusAltitude(iso3);
  await travelTo(globe, { lat: coords.lat, lng: coords.lng, altitude, iso3 }, options);
  return true;
}
