import type { Theme } from '$lib/theme';

export interface GlobeThemeConfig {
  mode: 'dark' | 'light';
  backgroundColor: string;
  atmosphereColor: string;
  atmosphereAltitude: number;
  globeImageUrl?: string;
  bumpImageUrl?: string;
  polygonDefaultColor: string;
  polygonStrokeColor: string;
  polygonHoverColor: string;
  polygonSelectedColor: string;
  polygonSideColor: string;
  arcDefaultColor: string[];
  ringDefaultColor: string;
}

export function getGlobeThemeConfig(currentTheme: Theme, isTurbo: boolean = false): GlobeThemeConfig {
  const isDark = currentTheme === 'dark';

  return {
    mode: isDark ? 'dark' : 'light',
    backgroundColor: isDark ? '#030712' : '#f8fafc',
    atmosphereColor: isDark ? '#38bdf8' : '#0284c7',
    atmosphereAltitude: isTurbo ? 0.14 : 0.22,
    globeImageUrl: isDark
      ? '//unpkg.com/three-globe/example/img/earth-night.jpg'
      : '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    bumpImageUrl: '//unpkg.com/three-globe/example/img/earth-topology.png',
    polygonDefaultColor: isDark ? 'rgba(30, 41, 59, 0.70)' : 'rgba(226, 232, 240, 0.85)',
    polygonStrokeColor: isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(100, 116, 139, 0.45)',
    polygonHoverColor: isDark ? 'rgba(56, 189, 248, 0.45)' : 'rgba(14, 165, 233, 0.35)',
    polygonSelectedColor: isDark ? 'rgba(14, 165, 233, 0.75)' : 'rgba(2, 132, 199, 0.65)',
    polygonSideColor: isDark ? 'rgba(15, 23, 42, 0.45)' : 'rgba(203, 213, 225, 0.5)',
    arcDefaultColor: isDark ? ['#38bdf8', '#818cf8'] : ['#0284c7', '#4f46e5'],
    ringDefaultColor: '#f43f5e',
  };
}
