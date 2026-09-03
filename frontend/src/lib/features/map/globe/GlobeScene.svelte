<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { getGlobeThemeConfig } from './theme';
  import { configurePolygonLayer, getFeatureIso3 } from './layers/polygonLayer';
  import { configureArcLayer } from './layers/arcLayer';
  import { configurePathLayer } from './layers/pathLayer';
  import { configureRingLayer } from './layers/ringLayer';
  import { configureLabelLayer } from './layers/labelLayer';
  import {
    flyTo as cameraFlyTo,
    travelToCountry as cameraTravelToCountry,
    zoomIn as cameraZoomIn,
    zoomOut as cameraZoomOut,
    resetView as cameraResetView,
  } from './camera';
  import type { Theme } from '$lib/theme';
  import type { MapCountryData, MetricType } from '../map-constants';
  import type { GeoAppPlugin } from '$lib/framework/geoglobe/types';
  import type { CameraPointOfView } from './types';

  interface Props {
    polygons?: any[];
    mapData?: MapCountryData[];
    selectedIso3?: string | null;
    hoveredIso3?: string | null;
    activeMetric?: MetricType | 'default';
    arcs?: any[];
    paths?: any[];
    rings?: any[];
    labels?: any[];
    theme?: Theme;
    autoRotate?: boolean;
    autoRotateSpeed?: number;
    initialPov?: CameraPointOfView;
    isFilterActive?: boolean;
    isCountryMatched?: (iso3: string) => boolean;
    activeApp?: GeoAppPlugin | null;
    currentAppData?: Record<string, any> | null;
    onCountryClick?: (iso3: string, feat: any, event: MouseEvent) => void;
    onCountryHover?: (iso3: string | null, feat: any | null) => void;
    onPathClick?: (path: any) => void;
    onArcClick?: (arc: any, event: MouseEvent) => void;
    onLabelClick?: (label: any, event?: MouseEvent) => void;
    onReady?: (globe: any) => void;
    class?: string;
  }

  let {
    polygons = [],
    mapData = [],
    selectedIso3 = null,
    hoveredIso3 = null,
    activeMetric = 'rate',
    arcs = [],
    paths = [],
    rings = [],
    labels = [],
    theme = 'dark',
    autoRotate = false,
    autoRotateSpeed = 0.5,
    initialPov = { lat: 10, lng: 110, altitude: 2.2 },
    isFilterActive = false,
    isCountryMatched = () => true,
    activeApp = null,
    currentAppData = null,
    onCountryClick,
    onCountryHover,
    onPathClick,
    onArcClick,
    onLabelClick,
    onReady,
    class: className = '',
  }: Props = $props();

  let container = $state<HTMLDivElement | null>(null);
  let globeInstance: any = null;
  let isReady = $state(false);
  let resizeObserver: ResizeObserver | null = null;

  onMount(async () => {
    if (!container || typeof window === 'undefined') return;

    try {
      const GlobeModule = (await import('globe.gl')).default;
      globeInstance = (GlobeModule as any)()(container);

      if (!globeInstance) return;

      const rect = container.getBoundingClientRect();
      const initialWidth = rect.width || window.innerWidth;
      const initialHeight = rect.height || window.innerHeight;

      const themeConfig = getGlobeThemeConfig(theme);

      globeInstance
        .width(initialWidth)
        .height(initialHeight)
        .backgroundColor(themeConfig.backgroundColor)
        .showAtmosphere(true)
        .atmosphereColor(themeConfig.atmosphereColor)
        .atmosphereAltitude(themeConfig.atmosphereAltitude);

      // Initial point of view
      globeInstance.pointOfView(initialPov, 0);

      // Controls setup
      const controls = globeInstance.controls?.();
      if (controls) {
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = autoRotateSpeed;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 105;
        controls.maxDistance = 550;
      }

      // Responsive observer
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0 && globeInstance) {
            globeInstance.width(width).height(height);
          }
        }
      });
      resizeObserver.observe(container);

      isReady = true;
      if (onReady) {
        onReady(globeInstance);
      }
    } catch (err) {
      console.error('[GlobeScene] Failed to initialize globe.gl:', err);
    }
  });

  // Re-apply layers and theme whenever reactive properties change
  $effect(() => {
    if (!isReady || !globeInstance) return;

    const isDark = theme === 'dark';
    const isFlag = activeMetric === 'flag';
    const themeConfig = getGlobeThemeConfig(theme);

    // Apply Theme
    globeInstance
      .backgroundColor(themeConfig.backgroundColor)
      .atmosphereColor(themeConfig.atmosphereColor)
      .atmosphereAltitude(themeConfig.atmosphereAltitude);

    // Controls Auto-Rotate
    const controls = globeInstance.controls?.();
    if (controls) {
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = autoRotateSpeed;
    }

    // Configure Polygon Layer
    configurePolygonLayer(globeInstance, {
      features: polygons,
      mapData,
      selectedIso3,
      hoveredIso3,
      activeMetric,
      currentTheme: theme,
      isDark,
      isFlag,
      isFilterActive,
      isCountryMatched,
      themeConfig,
      activeApp,
      currentAppData,
      onHover: (feat) => {
        const iso3 = feat ? getFeatureIso3(feat) : null;
        onCountryHover?.(iso3, feat);
      },
      onClick: (feat, event) => {
        const iso3 = getFeatureIso3(feat);
        onCountryClick?.(iso3, feat, event);
      },
    });

    // Configure Arc Layer
    configureArcLayer(globeInstance, arcs, (arc, event) => {
      onArcClick?.(arc, event);
    });

    // Configure Path Layer
    configurePathLayer(globeInstance, paths, (path) => {
      onPathClick?.(path);
    });

    // Configure Ring Layer
    configureRingLayer(globeInstance, rings);

    // Configure Label Layer
    configureLabelLayer(globeInstance, labels, selectedIso3, {
      onClick: (label, event) => onLabelClick?.(label, event),
      onHover: (label) => {
        const iso3 = label ? label.iso3 ?? null : null;
        onCountryHover?.(iso3, label);
      },
    });
  });

  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    if (globeInstance) {
      try {
        const controls = globeInstance.controls?.();
        if (controls) {
          controls.autoRotate = false;
        }

        if (typeof globeInstance._destructor === 'function') {
          globeInstance._destructor();
        }

        const renderer = globeInstance.renderer?.();
        if (renderer && typeof renderer.dispose === 'function') {
          renderer.dispose();
          renderer.forceContextLoss?.();
          renderer.domElement?.remove();
        }

        const scene = globeInstance.scene?.();
        if (scene && typeof scene.clear === 'function') {
          scene.clear();
        }
      } catch (err) {
        console.warn('[GlobeScene] Cleanup warning:', err);
      } finally {
        globeInstance = null;
      }
    }

    if (container) {
      container.innerHTML = '';
    }
  });

  // Exported controller functions for parent components
  export function flyToCountry(iso3: string, options?: { duration?: number; altitude?: number }): void {
    cameraTravelToCountry(globeInstance, iso3, options);
  }

  export function flyTo(lat: number, lng: number, altitude: number, durationMs: number = 1000): void {
    cameraFlyTo(globeInstance, lat, lng, altitude, durationMs);
  }

  export function handleZoomIn(factor?: number): void {
    cameraZoomIn(globeInstance, factor);
  }

  export function handleZoomOut(factor?: number): void {
    cameraZoomOut(globeInstance, factor);
  }

  export function handleResetView(ms?: number): void {
    cameraResetView(globeInstance, ms);
  }

  export function getGlobe(): any {
    return globeInstance;
  }
</script>

<div
  bind:this={container}
  class="relative w-full h-full min-w-full min-h-full overflow-hidden select-none outline-none {className}"
>
  {#if !isReady}
    <div class="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10 transition-opacity">
      <div class="flex flex-col items-center gap-3">
        <div class="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin"></div>
        <span class="text-xs font-medium text-slate-400 tracking-wider uppercase">Memuat Geospatial 3D Globe...</span>
      </div>
    </div>
  {/if}
</div>
