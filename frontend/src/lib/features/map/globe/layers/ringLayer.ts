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
