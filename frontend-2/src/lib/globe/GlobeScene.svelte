<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { applyGlobeTheme, getGlobeTheme } from './theme';
  import { configurePolygonLayer, getFeatureIso3 } from './layers/polygonLayer';
  import { configureArcLayer } from './layers/arcLayer';
  import { configurePathLayer } from './layers/pathLayer';
  import { configureRingLayer } from './layers/ringLayer';
  import { configureLabelLayer } from './layers/labelLayer';
  import {
    DEFAULT_VIEW_POV,
    getPointOfView,
    resetView,
    setPointOfView,
    travelTo,
    travelToCountry,
    zoomIn,
    zoomOut,
  } from './camera';
  import type {
    ArcData,
    CameraPointOfView,
    CameraTravelOptions,
    GlobeInstance,
    GlobeTheme,
    GlobeThemeMode,
    LabelData,
    PathData,
    RateChoroplethData,
    RingData,
  } from './types';

  interface Props {
    polygons?: any[];
    selectedIso3?: string | null;
    hoveredIso3?: string | null;
    matchedIso3List?: string[];
    rateDataByIso3?: Record<string, RateChoroplethData>;
    activeMetric?: 'rate' | 'change' | 'flag' | 'default';
    arcs?: ArcData[];
    paths?: PathData[];
    rings?: RingData[];
    labels?: LabelData[];
    theme?: GlobeThemeMode | GlobeTheme;
    autoRotate?: boolean;
    autoRotateSpeed?: number;
    initialPov?: CameraPointOfView;
    onCountryClick?: (iso3: string, feat: any, event: MouseEvent) => void;
    onCountryHover?: (iso3: string | null, feat: any | null) => void;
    onArcClick?: (arc: ArcData, event: MouseEvent) => void;
    onLabelClick?: (label: LabelData, event: MouseEvent) => void;
    onReady?: (globe: GlobeInstance) => void;
    class?: string;
  }

  let {
    polygons = [],
    selectedIso3 = null,
    hoveredIso3 = null,
    matchedIso3List = [],
    rateDataByIso3 = {},
    activeMetric = 'default',
    arcs = [],
    paths = [],
    rings = [],
    labels = [],
    theme = 'dark',
    autoRotate = false,
    autoRotateSpeed = 0.5,
    initialPov = DEFAULT_VIEW_POV,
    onCountryClick,
    onCountryHover,
    onArcClick,
    onLabelClick,
    onReady,
    class: className = '',
  }: Props = $props();

  let container = $state<HTMLDivElement | null>(null);
  let globeInstance: GlobeInstance | null = null;
  let isReady = $state(false);
  let resizeObserver: ResizeObserver | null = null;

  // Resolve active theme configuration
  const resolvedTheme: GlobeTheme = $derived(
    typeof theme === 'string' ? getGlobeTheme(theme) : theme
  );

  onMount(async () => {
    if (!container || typeof window === 'undefined') return;

    try {
      const GlobeModule = (await import('globe.gl')).default;
      globeInstance = (GlobeModule as any)()(container);

      if (!globeInstance) return;

      const rect = container.getBoundingClientRect();
      const initialWidth = rect.width || window.innerWidth;
      const initialHeight = rect.height || window.innerHeight;

      globeInstance
        .width(initialWidth)
        .height(initialHeight);

      // Initial camera positioning
      setPointOfView(globeInstance, initialPov, 0);

      // Orbit controls configuration
      const controls = globeInstance.controls();
      if (controls) {
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = autoRotateSpeed;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
      }

      // Responsive canvas resizing
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
      console.error('[GlobeScene] Failed to initialize Globe.gl:', err);
    }
  });

  // Re-apply layers and theme whenever reactive properties change
  $effect(() => {
    if (!isReady || !globeInstance) return;

    // Apply theme
    applyGlobeTheme(globeInstance, resolvedTheme);

    // Update controls auto-rotate
    const controls = globeInstance.controls();
    if (controls) {
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = autoRotateSpeed;
    }

    const currentPov = getPointOfView(globeInstance);

    // Polygons Layer
    configurePolygonLayer(globeInstance, {
      features: polygons,
      selectedIso3,
      hoveredIso3,
      matchedIso3List,
      rateDataByIso3,
      activeMetric,
      theme: resolvedTheme,
      onHover: (feat) => {
        const iso3 = feat ? getFeatureIso3(feat) : null;
        onCountryHover?.(iso3, feat);
      },
      onClick: (feat, event) => {
        const iso3 = getFeatureIso3(feat);
        onCountryClick?.(iso3, feat, event);
      },
    });

    // Arcs Layer
    configureArcLayer(globeInstance, {
      arcs,
      theme: resolvedTheme,
      onClick: (arc, event) => onArcClick?.(arc, event),
    });

    // Paths Layer
    configurePathLayer(globeInstance, {
      paths,
      theme: resolvedTheme,
    });

    // Rings Layer
    configureRingLayer(globeInstance, {
      rings,
      theme: resolvedTheme,
    });

    // Labels Layer
    configureLabelLayer(globeInstance, {
      labels,
      cameraAltitude: currentPov.altitude,
      selectedIso3,
      theme: resolvedTheme,
      onClick: (lbl, event) => onLabelClick?.(lbl, event),
    });
  });

  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    if (globeInstance) {
      try {
        const controls = globeInstance.controls();
        if (controls) {
          controls.autoRotate = false;
        }

        if (typeof globeInstance._destructor === 'function') {
          globeInstance._destructor();
        }

        const renderer = globeInstance.renderer();
        if (renderer && typeof renderer.dispose === 'function') {
          renderer.dispose();
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
  export function flyToCountry(iso3: string, options?: CameraTravelOptions): Promise<boolean> {
    if (!globeInstance) return Promise.resolve(false);
    return travelToCountry(globeInstance, iso3, options);
  }

  export function flyTo(
    target: Partial<CameraPointOfView> & { lat: number; lng: number; iso3?: string },
    options?: CameraTravelOptions
  ): Promise<void> {
    if (!globeInstance) return Promise.resolve();
    return travelTo(globeInstance, target, options);
  }

  export function handleZoomIn(factor?: number): void {
    if (globeInstance) zoomIn(globeInstance, factor);
  }

  export function handleZoomOut(factor?: number): void {
    if (globeInstance) zoomOut(globeInstance, factor);
  }

  export function handleResetView(ms?: number): void {
    if (globeInstance) resetView(globeInstance, ms);
  }

  export function getGlobe(): GlobeInstance | null {
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
