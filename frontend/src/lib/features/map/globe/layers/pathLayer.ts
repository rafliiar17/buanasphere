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

export function configurePathLayer(
  globe: any,
  paths: any[],
  onPathClick?: (path: any) => void
): void {
  if (!globe || typeof globe.pathsData !== 'function') return;

  globe
    .pathsData(paths || [])
    .pathPoints((d: any) => d.coords)
    .pathColor((d: any) => d.color)
    .pathStroke((d: any) => d.stroke || 1.2)
    .pathPointAlt(() => 0.003)
    .pathDashLength((d: any) => d.dashLength || 0.1)
    .pathDashGap((d: any) => d.dashGap || 0.02)
    .pathDashAnimateTime((d: any) => d.animateTime || 0)
    .pathLabel((d: any) => d.tooltipHtml || d.label)
    .onPathClick((path: any) => onPathClick?.(path));
}
