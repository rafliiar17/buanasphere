import {
  calculateGreatCircleDistanceDeg,
  getCountryFocusAltitude,
  getCountryCoordinates,
  getTravelTrajectory,
  type CameraCoordinates,
  type TravelStage,
  type TravelTrajectory,
} from '../cameraTravel';

export {
  calculateGreatCircleDistanceDeg,
  getCountryFocusAltitude,
  getCountryCoordinates,
  getTravelTrajectory,
  type CameraCoordinates,
  type TravelStage,
  type TravelTrajectory,
};

export function flyTo(
  globe: any,
  lat: number,
  lng: number,
  altitude: number,
  durationMs: number = 1000
): void {
  if (globe && typeof globe.pointOfView === 'function') {
    globe.pointOfView({ lat, lng, altitude }, durationMs);
  }
}

export function travelToCountry(
  globe: any,
  iso3: string,
  options?: { duration?: number; altitude?: number }
): { timeoutId: any } | null {
  if (!globe || !iso3 || typeof globe.pointOfView !== 'function') return null;
  const targetCoords = getCountryCoordinates(iso3);
  if (!targetCoords) return null;

  const curPov = globe.pointOfView() || { lat: 0, lng: 0, altitude: 2.2 };
  const targetAltitude = options?.altitude ?? getCountryFocusAltitude(iso3);

  const trajectory = getTravelTrajectory(
    { lat: curPov.lat ?? 0, lng: curPov.lng ?? 0, altitude: curPov.altitude ?? 2.2 },
    targetCoords,
    { targetAltitude }
  );

  if (!trajectory.isTwoStage) {
    globe.pointOfView(
      { lat: trajectory.stage1.lat, lng: trajectory.stage1.lng, altitude: trajectory.stage1.altitude },
      options?.duration ?? trajectory.stage1.durationMs
    );
    return null;
  } else {
    // Stage 1: Lift-off zoom-out arc & rotation
    globe.pointOfView(
      { lat: trajectory.stage1.lat, lng: trajectory.stage1.lng, altitude: trajectory.stage1.altitude },
      trajectory.stage1.durationMs
    );

    // Stage 2: Swoop down & zoom-in
    const timeoutId = setTimeout(() => {
      if (globe && typeof globe.pointOfView === 'function') {
        globe.pointOfView(
          { lat: trajectory.stage2.lat, lng: trajectory.stage2.lng, altitude: trajectory.stage2.altitude },
          trajectory.stage2.durationMs
        );
      }
    }, trajectory.stage1.durationMs - 20);

    return { timeoutId };
  }
}

export function zoomIn(globe: any, factor: number = 0.7, durationMs: number = 300): void {
  if (!globe || typeof globe.pointOfView !== 'function') return;
  const pov = globe.pointOfView();
  const currentAlt = pov.altitude || 2.2;
  const nextAlt = Math.max(0.15, currentAlt * factor);
  globe.pointOfView({ ...pov, altitude: nextAlt }, durationMs);
}

export function zoomOut(globe: any, factor: number = 1.4, durationMs: number = 300): void {
  if (!globe || typeof globe.pointOfView !== 'function') return;
  const pov = globe.pointOfView();
  const currentAlt = pov.altitude || 2.2;
  const nextAlt = Math.min(6.0, currentAlt * factor);
  globe.pointOfView({ ...pov, altitude: nextAlt }, durationMs);
}

export function resetView(globe: any, durationMs: number = 600): void {
  if (!globe || typeof globe.pointOfView !== 'function') return;
  globe.pointOfView({ lat: 10, lng: 110, altitude: 2.2 }, durationMs);
}
