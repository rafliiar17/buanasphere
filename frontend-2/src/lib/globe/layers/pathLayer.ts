/**
 * Globe.gl Path Layer Engine
 * 
 * Handles 3D geometric paths including longitude meridians, UTC timezone boundaries,
 * Equator, Tropics, and custom navigational routes.
 */

import { DEFAULT_DARK_THEME } from '../theme';
import type { GlobeInstance, GlobeTheme, PathData, PathLayerConfig } from '../types';

/**
 * Generates longitude meridian paths at set degree intervals (default 15° for standard 1-hour timezones).
 */
export function generateMeridianPaths(
  intervalDeg: number = 15,
  theme: GlobeTheme = DEFAULT_DARK_THEME
): PathData[] {
  const isDark = theme.mode === 'dark';
  const defaultColor = isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(100, 116, 139, 0.25)';
  const primeColor = isDark ? 'rgba(56, 189, 248, 0.65)' : 'rgba(2, 132, 199, 0.65)';

  const paths: PathData[] = [];
  const latSteps = 35; // Step resolution along the meridian
  const minLat = -85;
  const maxLat = 85;

  for (let lng = -180; lng < 180; lng += intervalDeg) {
    const isPrime = lng === 0;
    const isDateLine = lng === -180 || lng === 180;
    const coords: Array<[number, number, number?]> = [];

    for (let i = 0; i <= latSteps; i++) {
      const lat = minLat + (i / latSteps) * (maxLat - minLat);
      coords.push([lat, lng, 0.002]);
    }

    const offsetHours = lng / 15;
    const sign = offsetHours >= 0 ? '+' : '';
    const gmtLabel = `UTC${sign}${offsetHours}`;

    paths.push({
      id: `meridian-${lng}`,
      coords,
      color: isPrime ? primeColor : defaultColor,
      stroke: isPrime ? 1.5 : 0.8,
      isMeridian: true,
      label: isPrime ? 'Prime Meridian (Greenwich 0°)' : `Meridian ${lng}° (${gmtLabel})`,
      tooltipHtml: `
        <div style="background: ${isDark ? '#0f172a' : '#ffffff'}; color: ${isDark ? '#f8fafc' : '#0f172a'}; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};">
          ${isPrime ? '🌐 Prime Meridian (0°)' : `🕒 Meridian ${lng}° • ${gmtLabel}`}
        </div>
      `,
    });
  }

  return paths;
}

/**
 * Generates Equator (0°), Tropic of Cancer (+23.4°), and Tropic of Capricorn (-23.4°).
 */
export function generateEquatorAndTropicsPaths(
  theme: GlobeTheme = DEFAULT_DARK_THEME
): PathData[] {
  const isDark = theme.mode === 'dark';
  const equatorColor = isDark ? 'rgba(245, 158, 11, 0.65)' : 'rgba(217, 119, 6, 0.65)';
  const tropicColor = isDark ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.3)';

  const parallels = [
    { id: 'equator', lat: 0, label: 'Khatulistiwa (Equator 0°)', color: equatorColor, stroke: 1.5, isEquator: true },
    { id: 'tropic-cancer', lat: 23.4365, label: 'Tropic of Cancer (+23.4° N)', color: tropicColor, stroke: 1.0, isTropic: true },
    { id: 'tropic-capricorn', lat: -23.4365, label: 'Tropic of Capricorn (-23.4° S)', color: tropicColor, stroke: 1.0, isTropic: true },
  ];

  const paths: PathData[] = [];
  const lngSteps = 72; // 5 degree steps around circumference

  for (const p of parallels) {
    const coords: Array<[number, number, number?]> = [];
    for (let i = 0; i <= lngSteps; i++) {
      const lng = -180 + (i / lngSteps) * 360;
      coords.push([p.lat, lng, 0.002]);
    }

    paths.push({
      id: p.id,
      coords,
      color: p.color,
      stroke: p.stroke,
      label: p.label,
      isEquator: p.isEquator,
      isTropic: p.isTropic,
      dashLength: p.isTropic ? 0.3 : 1,
      dashGap: p.isTropic ? 0.15 : 0,
      tooltipHtml: `
        <div style="background: ${isDark ? '#0f172a' : '#ffffff'}; color: ${isDark ? '#f8fafc' : '#0f172a'}; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};">
          🧭 ${p.label}
        </div>
      `,
    });
  }

  return paths;
}

/**
 * Creates a custom timezone path feature.
 */
export function createTimezonePath(
  tzInfo: {
    id: string;
    utcOffset: number;
    gmtLabel: string;
    keyRegions?: string[];
  },
  coords: Array<[number, number]>,
  theme: GlobeTheme = DEFAULT_DARK_THEME
): PathData {
  const isDark = theme.mode === 'dark';
  return {
    id: `tz-${tzInfo.id}`,
    coords: coords.map(([lat, lng]) => [lat, lng, 0.003]),
    color: isDark ? '#38bdf8' : '#0284c7',
    stroke: 1.6,
    label: `${tzInfo.gmtLabel} ${tzInfo.keyRegions?.join(', ') || ''}`,
    tooltipHtml: `
      <div style="background: ${isDark ? '#0f172a' : '#ffffff'}; color: ${isDark ? '#f8fafc' : '#0f172a'}; padding: 8px 12px; border-radius: 8px; font-size: 11px; font-family: system-ui, sans-serif;">
        <div style="font-weight: 700; color: #38bdf8;">🕒 Zona Waktu: ${tzInfo.gmtLabel}</div>
        ${tzInfo.keyRegions ? `<div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Wilayah: ${tzInfo.keyRegions.join(', ')}</div>` : ''}
      </div>
    `,
  };
}

/**
 * Configures the path layer on a globe.gl instance.
 */
export function configurePathLayer(
  globe: GlobeInstance,
  config: PathLayerConfig
): void {
  if (!globe || typeof globe.pathsData !== 'function') return;

  const theme = config.theme || DEFAULT_DARK_THEME;

  globe
    .pathsData(config.paths || [])
    .pathPoints((d: PathData) => d.coords)
    .pathPointLat((p: any) => p[0])
    .pathPointLng((p: any) => p[1])
    .pathPointAlt((p: any) => p[2] ?? 0.002)
    .pathColor((d: PathData) => d.color || theme.pathDefaultColor)
    .pathStroke((d: PathData) => d.stroke ?? 1.2)
    .pathDashLength((d: PathData) => d.dashLength ?? 1)
    .pathDashGap((d: PathData) => d.dashGap ?? 0)
    .pathDashAnimateTime((d: PathData) => d.dashAnimateTime ?? 0)
    .pathLabel((d: PathData) => d.tooltipHtml || d.label || '')
    .onPathHover((path: any, prevPath: any) => {
      if (config.onHover) {
        config.onHover(path ?? null, prevPath ?? null);
      }
    })
    .onPathClick((path: any, event: MouseEvent) => {
      if (config.onClick && path) {
        config.onClick(path, event);
      }
    });
}
