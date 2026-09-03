import { EXTENDED_COUNTRIES_DATA } from '$lib/framework/geoglobe/countrySpatialData';
import { calculateGreatCircleDistanceDeg } from '../camera';
import type { ArcFilterOptions } from '../types';

export function calculateArcAltitude(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dist = calculateGreatCircleDistanceDeg(lat1, lng1, lat2, lng2);
  const normalized = Math.min(1, Math.max(0, dist / 180));
  return 0.08 + normalized * 0.32;
}

export function getGlobeArcs(options: ArcFilterOptions): any[] {
  const { activeApp, currentAppData = {}, flightCorridorFilter, isCountryMatched } = options;

  if (!activeApp) return [];

  const indonesia = EXTENDED_COUNTRIES_DATA.find((c) => c.iso3 === 'IDN') ?? EXTENDED_COUNTRIES_DATA[0];

  const allArcs = activeApp.getArcData
    ? activeApp.getArcData(indonesia as any, (currentAppData ?? {}) as any)
    : activeApp.getArcs
    ? activeApp.getArcs((currentAppData ?? {}) as any, flightCorridorFilter)
    : [];

  if (flightCorridorFilter === 'all') return allArcs;

  return allArcs.filter((arc: any) => {
    const originCountry = EXTENDED_COUNTRIES_DATA.find(
      (c) => Math.abs(c.lat - arc.startLat) < 2.0 && Math.abs(c.lng - arc.startLng) < 2.0
    );
    if (!originCountry) return true;
    return isCountryMatched(originCountry.iso3);
  });
}

export function configureArcLayer(
  globe: any,
  arcs: any[],
  onClick?: (arc: any, event: MouseEvent) => void
): void {
  if (!globe || typeof globe.arcsData !== 'function') return;

  globe
    .arcsData(arcs || [])
    .arcColor((d: any) => d.color || ['#10b981', '#38bdf8'])
    .arcAltitude((d: any) => d.altitude || 0.35)
    .arcStroke((d: any) => d.stroke || 1.8)
    .arcDashLength((d: any) => d.dashLength || 0.4)
    .arcDashGap((d: any) => d.dashGap || 0.2)
    .arcDashAnimateTime((d: any) => d.dashAnimateTime || 2000)
    .onArcClick((arc: any, event: MouseEvent) => onClick?.(arc, event));
}
