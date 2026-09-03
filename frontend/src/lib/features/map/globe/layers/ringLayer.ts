import { EXTENDED_COUNTRIES_DATA } from '$lib/framework/geoglobe/countrySpatialData';
import type { RingLayerOptions } from '../types';

export function getGlobeRings(options: RingLayerOptions): any[] {
  const { activeApp, currentAppData = {}, selectedIso3 } = options;

  if (!activeApp?.getRingData) return [];

  const selected =
    (selectedIso3 ? EXTENDED_COUNTRIES_DATA.find((c) => c.iso3 === selectedIso3) : null) ??
    EXTENDED_COUNTRIES_DATA.find((c) => c.iso3 === 'IDN') ??
    EXTENDED_COUNTRIES_DATA[0];

  if (!selected) return [];

  return activeApp.getRingData(selected, (currentAppData ?? {}) as any) || [];
}

export function configureRingLayer(globe: any, rings: any[]): void {
  if (!globe || typeof globe.ringsData !== 'function') return;

  globe
    .ringsData(rings || [])
    .ringLat((d: any) => d.lat)
    .ringLng((d: any) => d.lng)
    .ringColor((d: any) => d.color)
    .ringMaxRadius((d: any) => d.maxRadius || 5)
    .ringPropagationSpeed((d: any) => d.propagationSpeed || 2)
    .ringRepeatPeriod((d: any) => d.repeatPeriod || 1500);
}
