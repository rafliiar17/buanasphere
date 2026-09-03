import type { PathLayerOptions } from '../types';

export function getGlobePaths(options: PathLayerOptions): any[] {
  const { showTimezoneLines, activeApp, currentAppData = {}, activeMetric, currentTheme } = options;

  if (!showTimezoneLines || !activeApp?.getPaths) return [];

  return activeApp.getPaths(
    (currentAppData ?? {}) as any,
    activeMetric,
    currentTheme
  );
}
