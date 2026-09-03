/**
 * Globe.gl Label Layer Engine
 * 
 * Handles 3D billboard text pins with Level-of-Detail (LOD) altitude filtering,
 * high-contrast selection elevation, and HiDPI retina canvas resolution.
 */

import type { CountrySpatialMetadata } from '../../data/countrySpatialData';
import { DEFAULT_DARK_THEME } from '../theme';
import type { GlobeInstance, LabelData, LabelLayerConfig } from '../types';

/**
 * High-priority global hub countries displayed at wide overview altitudes (LOD 0).
 */
export const GLOBAL_HUB_ISO3: ReadonlySet<string> = new Set([
  'IDN', 'USA', 'GBR', 'JPN', 'CHN', 'DEU', 'FRA', 'SGP', 'AUS', 'SAU',
  'BRA', 'IND', 'CAN', 'KOR', 'RUS', 'ZAF', 'TUR', 'MEX', 'ARE', 'EGY'
]);

/**
 * Filters label dataset according to current camera altitude and selection state.
 * 
 * - Camera Altitude > 1.8 (Global Overview):
 *   Only shows LOD 0 global hub labels and the currently selected country.
 * 
 * - Camera Altitude 0.8 to 1.8 (Regional View):
 *   Shows LOD 0 and LOD 1 labels and the currently selected country.
 * 
 * - Camera Altitude < 0.8 (Close Inspection):
 *   Shows all available labels (LOD 0, 1, and 2).
 */
export function filterLabelsByLOD(
  labels: LabelData[],
  cameraAltitude: number = 2.2,
  selectedIso3?: string | null
): LabelData[] {
  const normSelected = selectedIso3 ? selectedIso3.toUpperCase() : null;

  return labels.filter((label) => {
    const isSelected = normSelected && label.iso3 && label.iso3.toUpperCase() === normSelected;
    if (isSelected) return true; // Selected country always visible

    const isGlobalHub = label.iso3 ? GLOBAL_HUB_ISO3.has(label.iso3.toUpperCase()) : false;
    const lod = label.lodLevel ?? (isGlobalHub ? 0 : 1);

    if (cameraAltitude > 1.8) {
      return lod === 0;
    }
    if (cameraAltitude > 0.8) {
      return lod <= 1;
    }
    return true; // Full detail when zoomed close
  });
}

/**
 * Creates a standard country 3D pin label from metadata.
 */
export function createCountryPinLabel(
  country: CountrySpatialMetadata,
  options?: {
    spotRate?: string;
    isSelected?: boolean;
    theme?: typeof DEFAULT_DARK_THEME;
  }
): LabelData {
  const isSelected = Boolean(options?.isSelected);
  const theme = options?.theme || DEFAULT_DARK_THEME;
  const isGlobalHub = GLOBAL_HUB_ISO3.has(country.iso3.toUpperCase());

  let labelText = `${country.flagEmoji} ${country.countryName}`;
  if (options?.spotRate) {
    labelText += ` (${options.spotRate})`;
  }

  return {
    id: `label-${country.iso3}`,
    iso3: country.iso3,
    lat: country.lat,
    lng: country.lng,
    text: labelText,
    shortText: `${country.flagEmoji} ${country.iso3}`,
    size: isSelected ? 0.85 : (isGlobalHub ? 0.65 : 0.50),
    dotRadius: isSelected ? 0.25 : (isGlobalHub ? 0.18 : 0.14),
    dotOrientation: 'bottom',
    color: isSelected ? theme.labelSelectedColor : theme.labelColor,
    altitude: isSelected ? 0.038 : 0.015,
    lodLevel: isGlobalHub ? 0 : 1,
  };
}

/**
 * Configures the 3D pin label layer on a globe.gl instance.
 */
export function configureLabelLayer(
  globe: GlobeInstance,
  config: LabelLayerConfig
): void {
  if (!globe || typeof globe.labelsData !== 'function') return;

  const theme = config.theme || DEFAULT_DARK_THEME;
  const selectedIso3 = config.selectedIso3 ? config.selectedIso3.toUpperCase() : null;
  const cameraAltitude = config.cameraAltitude ?? 2.2;

  // Apply LOD filter
  const visibleLabels = filterLabelsByLOD(config.labels || [], cameraAltitude, selectedIso3);

  globe
    .labelsData(visibleLabels)
    .labelLat((d: LabelData) => d.lat)
    .labelLng((d: LabelData) => d.lng)
    .labelText((d: LabelData) => d.text)
    .labelSize((d: LabelData) => {
      const isSelected = selectedIso3 && d.iso3 && d.iso3.toUpperCase() === selectedIso3;
      if (isSelected) return d.size ? Math.max(0.85, d.size) : 0.85;
      return d.size ?? 0.55;
    })
    .labelDotRadius((d: LabelData) => {
      const isSelected = selectedIso3 && d.iso3 && d.iso3.toUpperCase() === selectedIso3;
      if (isSelected) return 0.25;
      return d.dotRadius ?? 0.15;
    })
    .labelDotOrientation((d: LabelData) => d.dotOrientation ?? 'bottom')
    .labelColor((d: LabelData) => {
      const isSelected = selectedIso3 && d.iso3 && d.iso3.toUpperCase() === selectedIso3;
      if (isSelected) return theme.labelSelectedColor;
      return d.color || theme.labelColor;
    })
    .labelAltitude((d: LabelData) => {
      const isSelected = selectedIso3 && d.iso3 && d.iso3.toUpperCase() === selectedIso3;
      // Selected label floats high above raised 3D polygons
      if (isSelected) return 0.038;
      return d.altitude ?? 0.015;
    })
    .labelResolution(config.resolution ?? 3)
    .onLabelHover((label: any, prevLabel: any) => {
      if (config.onHover) {
        config.onHover(label ?? null, prevLabel ?? null);
      }
    })
    .onLabelClick((label: any, event: MouseEvent) => {
      if (config.onClick && label) {
        config.onClick(label, event);
      }
    });
}
