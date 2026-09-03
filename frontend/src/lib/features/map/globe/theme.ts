import type { Theme } from '$lib/theme';

export interface GlobeThemeConfig {
  backgroundColor: string;
  atmosphereColor: string;
  atmosphereAltitude: number;
  polygonSideColor: string;
  polygonStrokeColor: string;
}

export function getGlobeThemeConfig(currentTheme: Theme, isTurbo: boolean = false): GlobeThemeConfig {
  const isDark = currentTheme === 'dark';

  return {
    backgroundColor: isDark ? '#0B0F19' : '#FAF8F3',
    atmosphereColor: isDark ? '#06b6d4' : '#38bdf8',
    atmosphereAltitude: isTurbo ? 0.14 : 0.22,
    polygonSideColor: isDark ? 'rgba(6, 182, 212, 0.18)' : 'rgba(2, 132, 199, 0.22)',
    polygonStrokeColor: isDark ? '#334155' : '#94a3b8',
  };
}
