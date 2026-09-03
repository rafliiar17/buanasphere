import { getFeatureIso3 } from './polygonLayer';
import { calculateSimulatedDateFromMinutes } from '$lib/framework/geoglobe/geoMath';
import type { LabelLayerOptions } from '../types';

export const MAJOR_LOD_CURRENCIES: ReadonlySet<string> = new Set([
  'IDN', 'USA', 'JPN', 'CHN', 'GBR', 'DEU', 'FRA', 'SGP', 'AUS', 'SAU',
  'MYS', 'THA', 'IND', 'BRA', 'ZAF', 'KOR', 'CAN', 'RUS', 'ITA', 'ESP',
  'TUR', 'EGY', 'ARE', 'CHE'
]);

export interface LabelItem {
  lat: number;
  lng: number;
  text: string;
  size?: number;
  color?: string;
  iso3?: string;
  lodLevel?: number;
  id?: string;
  shortText?: string;
  cityId?: string;
  country?: any;
}

export function filterLabelsByLOD(
  labels: LabelItem[],
  cameraAltitude: number = 2.2,
  selectedIso3?: string | null
): LabelItem[] {
  const normSelected = selectedIso3 ? selectedIso3.toUpperCase() : null;

  return labels.filter((label) => {
    const isSelected = normSelected && label.iso3 && label.iso3.toUpperCase() === normSelected;
    if (isSelected) return true;

    const isGlobalHub = label.iso3 ? MAJOR_LOD_CURRENCIES.has(label.iso3.toUpperCase()) : false;
    const lod = label.lodLevel ?? (isGlobalHub ? 0 : 1);

    if (cameraAltitude > 1.8) {
      return lod === 0;
    }
    if (cameraAltitude > 0.8) {
      return lod <= 1;
    }
    return true;
  });
}

export function getGlobeLabels(options: LabelLayerOptions): LabelItem[] {
  const {
    geoJsonFeatures,
    mapData,
    selectedIso3,
    currentTheme,
    activeMetric,
    cameraAltitude,
    activeApp,
    currentAppData,
    isSimulatingTime,
    simulatedMinutes = 0,
    simulationAnchorZone,
  } = options;

  if (!geoJsonFeatures || geoJsonFeatures.length === 0) return [];

  const isDark = currentTheme === 'dark';
  const selected = selectedIso3 ? selectedIso3.toUpperCase() : null;

  // Check polymorphic custom labels from active app (e.g. World Cities in TimeWorld)
  if (activeApp?.getCustomLabels) {
    const simDate = isSimulatingTime
      ? calculateSimulatedDateFromMinutes(simulatedMinutes, simulationAnchorZone as any)
      : undefined;
    return activeApp.getCustomLabels(
      (currentAppData ?? {}) as any,
      activeMetric,
      currentTheme,
      selected || undefined,
      simDate,
      cameraAltitude
    );
  }

  // Filter features: major currencies OR selected
  const visibleFeatures = geoJsonFeatures.filter((feat: any) => {
    const iso3 = getFeatureIso3(feat);
    if (iso3 === selected) return true;
    return MAJOR_LOD_CURRENCIES.has(iso3);
  });

  return visibleFeatures.map((feat: any) => {
    const p = feat.properties;
    const iso3 = getFeatureIso3(feat);
    const country = mapData.find((d) => d.iso3 === iso3);
    const rawName = country?.countryName || p.NAME || p.ADMIN || iso3;
    const curr = country?.currencyCode || '';
    const lat = Number(p.LABEL_Y) || 0;
    const lng = Number(p.LABEL_X) || 0;
    const isSelected = selected === iso3;

    let text = rawName;
    if (curr && curr !== 'IDR') {
      text = `${rawName} (${curr})`;
    }

    const size = isSelected ? 1.3 : 0.95;
    const color = isSelected
      ? '#38bdf8'
      : isDark
      ? 'rgba(241, 245, 249, 0.90)'
      : 'rgba(15, 23, 42, 0.90)';

    return {
      lat,
      lng,
      text,
      size,
      color,
      iso3,
      lodLevel: MAJOR_LOD_CURRENCIES.has(iso3) ? 0 : 1,
    };
  });
}

/**
 * Sanitizes 3D globe label text to guarantee zero unrendered glyphs ('??', '?')
 * and strips any emojis or arbitrary decorative symbols before rendering to WebGL canvas bitmap.
 */
export function sanitizeLabelText(rawText: string | null | undefined): string {
  if (!rawText) return '';

  let cleaned = String(rawText);

  // 1. Remove unicode emojis, regional indicator flags, pictographs, symbols
  cleaned = cleaned
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\p{Regional_Indicator}/gu, '')
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '');

  // 2. Remove broken replacement artifacts like leading/trailing '?', '??', '???'
  cleaned = cleaned.replace(/^\?+\s*/, '').replace(/\s*\?+$/, '');

  // 3. Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

export function configureLabelLayer(
  globe: any,
  labels: LabelItem[],
  selectedIso3?: string | null,
  callbacks?: {
    onClick?: (label: LabelItem, event?: MouseEvent) => void;
    onHover?: (label: LabelItem | null) => void;
  }
): void {
  if (!globe || typeof globe.labelsData !== 'function') return;

  globe
    .labelsData(labels || [])
    .labelLat((d: any) => d.lat)
    .labelLng((d: any) => d.lng)
    .labelText((d: any) => sanitizeLabelText(d.text))
    .labelSize((d: any) => d.size ?? 0.95)
    .labelDotRadius((d: any) => (d.iso3 === selectedIso3 ? 0.24 : 0.06))
    .labelColor((d: any) => d.color)
    .labelAltitude((d: any) => (d.iso3 === selectedIso3 ? 0.035 : 0.018))
    .labelResolution(3)
    .onLabelClick((d: any) => callbacks?.onClick?.(d))
    .onLabelHover((d: any) => callbacks?.onHover?.(d));
}
