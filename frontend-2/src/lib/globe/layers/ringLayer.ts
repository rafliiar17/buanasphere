/**
 * Globe.gl Ring Layer Engine
 * 
 * Handles expanding and fading pulse rings for seismic tremors, high-frequency currency transactions,
 * and geospatial event pings.
 */

import { DEFAULT_DARK_THEME } from '../theme';
import type { GlobeInstance, RingData, RingLayerConfig } from '../types';

/**
 * Generates dynamic fading color function based on ring expansion progress (t: 0..1).
 */
export function createFadingRingColor(
  baseHexOrRgb: string,
  progress: number
): string {
  const alpha = Math.max(0, Math.min(1, 1 - progress));

  if (baseHexOrRgb.startsWith('#')) {
    let hex = baseHexOrRgb.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
  }

  if (baseHexOrRgb.startsWith('rgb')) {
    const match = baseHexOrRgb.match(/\d+/g);
    if (match && match.length >= 3) {
      return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${alpha.toFixed(3)})`;
    }
  }

  return `rgba(244, 63, 94, ${alpha.toFixed(3)})`;
}

/**
 * Creates a generic pulsing ring at geographic coordinates.
 */
export function createPulsingRing(
  lat: number,
  lng: number,
  options?: Partial<RingData>
): RingData {
  return {
    id: options?.id || `ring-${lat.toFixed(3)}-${lng.toFixed(3)}`,
    lat,
    lng,
    altitude: options?.altitude ?? 0.003,
    maxRadius: options?.maxRadius ?? 8,
    propagationSpeed: options?.propagationSpeed ?? 2.5,
    repeatPeriod: options?.repeatPeriod ?? 1200,
    color: options?.color || '#f43f5e',
    label: options?.label || 'Pulse Ring',
    ...options,
  };
}

/**
 * Creates a seismic tremor ring whose dimensions scale with earthquake magnitude.
 */
export function createSeismicRing(
  lat: number,
  lng: number,
  magnitude: number,
  label?: string
): RingData {
  // Scale radius and speed proportionally with earthquake magnitude
  const maxRadius = Math.max(4, Math.min(20, (magnitude - 3) * 3.5));
  const propagationSpeed = Math.max(1.5, Math.min(5.0, magnitude * 0.5));
  const repeatPeriod = Math.max(800, Math.min(2200, 2000 - magnitude * 150));

  let color = '#f59e0b'; // Amber for moderate (< 5.0)
  if (magnitude >= 6.0 && magnitude < 7.0) {
    color = '#f97316'; // Orange (6.0 - 6.9)
  } else if (magnitude >= 7.0) {
    color = '#ef4444'; // Red for severe (>= 7.0)
  }

  return {
    id: `quake-${lat}-${lng}-m${magnitude}`,
    lat,
    lng,
    altitude: 0.004,
    maxRadius,
    propagationSpeed,
    repeatPeriod,
    color,
    magnitude,
    label: label || `Gempa Bumi M${magnitude.toFixed(1)}`,
  };
}

/**
 * Configures the ring layer on a globe.gl instance.
 */
export function configureRingLayer(
  globe: GlobeInstance,
  config: RingLayerConfig
): void {
  if (!globe || typeof globe.ringsData !== 'function') return;

  const theme = config.theme || DEFAULT_DARK_THEME;

  globe
    .ringsData(config.rings || [])
    .ringLat((d: RingData) => d.lat)
    .ringLng((d: RingData) => d.lng)
    .ringAltitude((d: RingData) => d.altitude ?? 0.003)
    .ringColor((d: RingData) => {
      if (typeof d.color === 'function') {
        return d.color;
      }
      const baseColor = d.color || theme.ringDefaultColor;
      return (t: number) => createFadingRingColor(baseColor, t);
    })
    .ringMaxRadius((d: RingData) => d.maxRadius ?? 8)
    .ringPropagationSpeed((d: RingData) => d.propagationSpeed ?? 2.5)
    .ringRepeatPeriod((d: RingData) => d.repeatPeriod ?? 1200);
}
