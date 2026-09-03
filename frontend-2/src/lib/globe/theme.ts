/**
 * Globe.gl Theme & Atmospheric Engine
 * 
 * Provides calibrated palette configurations, night lights, bump maps,
 * and atmosphere glow parameters for dark and light UI themes.
 */

import type { GlobeInstance, GlobeTheme, GlobeThemeMode } from './types';

export const DEFAULT_DARK_THEME: GlobeTheme = {
  mode: 'dark',
  backgroundColor: '#030712', // deep cosmic slate-950
  atmosphereColor: '#38bdf8', // radiant cyan atmosphere
  atmosphereAltitude: 0.22,
  globeImageUrl: '//unpkg.com/three-globe/example/img/earth-night.jpg',
  bumpImageUrl: '//unpkg.com/three-globe/example/img/earth-topology.png',
  polygonDefaultColor: 'rgba(30, 41, 59, 0.75)',
  polygonStrokeColor: 'rgba(148, 163, 184, 0.35)',
  polygonHoverColor: 'rgba(56, 189, 248, 0.45)',
  polygonSelectedColor: 'rgba(14, 165, 233, 0.75)',
  arcDefaultColor: ['#38bdf8', '#818cf8'],
  pathDefaultColor: 'rgba(148, 163, 184, 0.4)',
  ringDefaultColor: '#f43f5e',
  labelColor: '#e2e8f0',
  labelSelectedColor: '#ffffff',
};

export const DEFAULT_LIGHT_THEME: GlobeTheme = {
  mode: 'light',
  backgroundColor: '#f8fafc', // crisp daylight slate-50
  atmosphereColor: '#0284c7', // daylight sky blue
  atmosphereAltitude: 0.16,
  globeImageUrl: '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
  bumpImageUrl: '//unpkg.com/three-globe/example/img/earth-topology.png',
  polygonDefaultColor: 'rgba(226, 232, 240, 0.85)',
  polygonStrokeColor: 'rgba(100, 116, 139, 0.45)',
  polygonHoverColor: 'rgba(14, 165, 233, 0.35)',
  polygonSelectedColor: 'rgba(2, 132, 199, 0.65)',
  arcDefaultColor: ['#0284c7', '#4f46e5'],
  pathDefaultColor: 'rgba(100, 116, 139, 0.45)',
  ringDefaultColor: '#e11d48',
  labelColor: '#1e293b',
  labelSelectedColor: '#090d16',
};

/**
 * Returns calibrated theme configuration by mode name ('dark' | 'light').
 */
export function getGlobeTheme(
  mode: GlobeThemeMode | string = 'dark',
  overrides?: Partial<GlobeTheme>
): GlobeTheme {
  const base = mode === 'light' ? DEFAULT_LIGHT_THEME : DEFAULT_DARK_THEME;
  if (!overrides) return base;
  return { ...base, ...overrides };
}

/**
 * Applies theme background, atmosphere, and surface imagery to a globe.gl instance.
 */
export function applyGlobeTheme(globe: GlobeInstance, theme: GlobeTheme): void {
  if (!globe) return;
  globe
    .backgroundColor(theme.backgroundColor)
    .showAtmosphere(true)
    .atmosphereColor(theme.atmosphereColor)
    .atmosphereAltitude(theme.atmosphereAltitude);

  if (theme.globeImageUrl !== undefined) {
    globe.globeImageUrl(theme.globeImageUrl);
  }
  if (theme.bumpImageUrl !== undefined) {
    globe.bumpImageUrl(theme.bumpImageUrl);
  }
}
