/**
 * Globe.gl Arc Layer Engine
 * 
 * Handles 3D parabolic arcs for remittance flows, capital flight corridors,
 * trade channels, and dynamic dash pulse animations.
 */

import { getCountryCoordinates, getCountryMetadata } from '../../data/countrySpatialData';
import { calculateGreatCircleDistanceDeg } from '../camera';
import { DEFAULT_DARK_THEME } from '../theme';
import type { ArcData, ArcLayerConfig, GlobeInstance, GlobeTheme } from '../types';

/**
 * Calculates adaptive arc peak altitude based on great-circle distance.
 * Longer global routes curve higher into the stratosphere.
 */
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

/**
 * Generates an HTML tooltip for an arc (remittance flow or corridor).
 */
export function createArcTooltipHtml(arc: ArcData, theme: GlobeTheme = DEFAULT_DARK_THEME): string {
  const isDark = theme.mode === 'dark';
  const bg = isDark ? '#090d16' : '#ffffff';
  const border = isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.3)';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';

  const fromMeta = arc.fromIso3 ? getCountryMetadata(arc.fromIso3) : null;
  const toMeta = arc.toIso3 ? getCountryMetadata(arc.toIso3) : null;

  const fromText = fromMeta ? `${fromMeta.flagEmoji} ${fromMeta.countryName}` : (arc.fromIso3 || 'Origin');
  const toText = toMeta ? `${toMeta.flagEmoji} ${toMeta.countryName}` : (arc.toIso3 || 'Destination');

  let details = '';
  if (arc.amount !== undefined) {
    const cur = arc.currency || 'USD';
    details = `
      <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}; display: flex; justify-content: space-between;">
        <span style="font-size: 11px; color: ${textMuted};">Volume Transaksi:</span>
        <span style="font-size: 12px; font-weight: 700; color: #38bdf8; font-family: monospace;">${arc.amount.toLocaleString('id-ID')} ${cur}</span>
      </div>
    `;
  }

  return `
    <div style="
      background: ${bg};
      color: ${textPrimary};
      border: 1px solid ${border};
      padding: 8px 12px;
      border-radius: 8px;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(12px);
      pointer-events: none;
      min-width: 160px;
    ">
      <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #38bdf8; margin-bottom: 4px;">
        ${arc.label || 'Arus Remitansi / Koridor'}
      </div>
      <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600;">
        <span>${fromText}</span>
        <span style="color: ${textMuted};">➔</span>
        <span>${toText}</span>
      </div>
      ${details}
    </div>
  `;
}

/**
 * Creates a remittance flow arc between two countries using their ISO-3 codes.
 */
export function createRemittanceArc(
  fromIso3: string,
  toIso3: string,
  options?: {
    amount?: number;
    currency?: string;
    label?: string;
    color?: string | string[];
    stroke?: number;
    dashAnimateTime?: number;
  }
): ArcData | null {
  const fromCoord = getCountryCoordinates(fromIso3);
  const toCoord = getCountryCoordinates(toIso3);

  if (!fromCoord || !toCoord) return null;

  const alt = calculateArcAltitude(fromCoord.lat, fromCoord.lng, toCoord.lat, toCoord.lng);

  return {
    id: `remittance-${fromIso3}-${toIso3}`,
    fromIso3,
    toIso3,
    startLat: fromCoord.lat,
    startLng: fromCoord.lng,
    endLat: toCoord.lat,
    endLng: toCoord.lng,
    altitude: alt,
    color: options?.color || ['#38bdf8', '#818cf8'],
    stroke: options?.stroke ?? 1.8,
    dashLength: 0.4,
    dashGap: 0.2,
    dashInitialGap: 0,
    dashAnimateTime: options?.dashAnimateTime ?? 2200,
    amount: options?.amount,
    currency: options?.currency,
    label: options?.label || 'Koridor Remitansi',
  };
}

/**
 * Creates a flight corridor arc between two arbitrary coordinates.
 */
export function createFlightArc(
  fromCoord: { lat: number; lng: number },
  toCoord: { lat: number; lng: number },
  options?: Partial<ArcData>
): ArcData {
  const alt = calculateArcAltitude(fromCoord.lat, fromCoord.lng, toCoord.lat, toCoord.lng);

  return {
    id: options?.id || `flight-${fromCoord.lat.toFixed(2)}-${toCoord.lat.toFixed(2)}`,
    startLat: fromCoord.lat,
    startLng: fromCoord.lng,
    endLat: toCoord.lat,
    endLng: toCoord.lng,
    altitude: options?.altitude ?? alt,
    color: options?.color || ['#f59e0b', '#ef4444'],
    stroke: options?.stroke ?? 1.2,
    dashLength: options?.dashLength ?? 0.35,
    dashGap: options?.dashGap ?? 0.25,
    dashInitialGap: options?.dashInitialGap ?? 0,
    dashAnimateTime: options?.dashAnimateTime ?? 1800,
    label: options?.label || 'Koridor Penerbangan',
    ...options,
  };
}

/**
 * Configures the arc layer on a globe.gl instance.
 */
export function configureArcLayer(
  globe: GlobeInstance,
  config: ArcLayerConfig
): void {
  if (!globe || typeof globe.arcsData !== 'function') return;

  const theme = config.theme || DEFAULT_DARK_THEME;

  globe
    .arcsData(config.arcs || [])
    .arcStartLat((d: ArcData) => d.startLat)
    .arcStartLng((d: ArcData) => d.startLng)
    .arcEndLat((d: ArcData) => d.endLat)
    .arcEndLng((d: ArcData) => d.endLng)
    .arcColor((d: ArcData) => d.color || theme.arcDefaultColor)
    .arcAltitude((d: ArcData) => d.altitude ?? calculateArcAltitude(d.startLat, d.startLng, d.endLat, d.endLng))
    .arcStroke((d: ArcData) => d.stroke ?? 1.5)
    .arcDashLength((d: ArcData) => d.dashLength ?? 0.4)
    .arcDashGap((d: ArcData) => d.dashGap ?? 0.2)
    .arcDashInitialGap((d: ArcData) => d.dashInitialGap ?? 0)
    .arcDashAnimateTime((d: ArcData) => d.dashAnimateTime ?? 2000)
    .arcLabel((d: ArcData) => createArcTooltipHtml(d, theme))
    .onArcHover((arc: any, prevArc: any) => {
      if (config.onHover) {
        config.onHover(arc ?? null, prevArc ?? null);
      }
    })
    .onArcClick((arc: any, event: MouseEvent) => {
      if (config.onClick && arc) {
        config.onClick(arc, event);
      }
    });
}
