<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Loader2, X, Plus, Minus, RotateCcw, BarChart3 } from 'lucide-svelte';
  import type { MapStateStore } from '../mapState.svelte';
  import type { MapCountryData } from '../map-constants';
  import { REGION_FILTERS } from '../map-constants';
  import { createProceduralFlagMaterial, disposeProceduralFlagCache } from '../procedural-flags';
  import type { Theme } from '$lib/theme';
  import { geoStore } from '$lib/framework/geoglobe/geoStore.svelte';
  import { EXTENDED_COUNTRIES_DATA } from '$lib/framework/geoglobe/countrySpatialData';
  import { GLOBAL_FINANCIAL_HUBS, type FinancialHubData } from '../globe/data/financialHubsData';
  import type { HexBinPointData } from '../globe/layers/hexBinLayer';
  import { calculateSimulatedDateFromMinutes } from '$lib/framework/geoglobe/geoMath';
  import * as THREE from 'three';
  import {
    buildCountryIdMapping,
    createPaletteLutBuffer,
    updatePaletteLutSlot,
    hexOrRgbaToRgbaArray,
    pickCountryFromUv,
    renderEquirectangularIdTexture,
    type CountryIdMapping
  } from '../shader-lut/countryLutEngine';
  import { GLOBE_LUT_VERTEX_SHADER, GLOBE_LUT_FRAGMENT_SHADER } from '../shader-lut/globeShaders';

  // Declarative GlobeScene & Modular Layers (ADR 0061 & ADR 0062)
  import GlobeScene from '../globe/GlobeScene.svelte';
  import {
    getFeatureIso3,
    getCountryColor,
    getPolygonAltitude,
    getTooltipHtml,
    getDimmedCapMaterial,
  } from '../globe/layers/polygonLayer';
  import { getGlobeArcs } from '../globe/layers/arcLayer';
  import { getGlobePaths } from '../globe/layers/pathLayer';
  import { getGlobeRings } from '../globe/layers/ringLayer';
  import { MAJOR_LOD_CURRENCIES } from '../globe/layers/labelLayer';
  import { getGlobeThemeConfig } from '../globe/theme';
  import {
    calculateGreatCircleDistanceDeg,
    getCountryFocusAltitude,
    getCountryCoordinates,
    getTravelTrajectory,
  } from '../globe/camera';

  interface Props {
    geoJsonFeatures: any[];
    mapData: MapCountryData[];
    mapState: MapStateStore;
    currentTheme: Theme;
    onCountryClick?: (country: MapCountryData) => void;
    onCountryHover?: (iso3: string | null) => void;
    onReady?: () => void;
  }

  let {
    geoJsonFeatures,
    mapData,
    mapState,
    currentTheme,
    onCountryClick,
    onCountryHover,
    onReady,
  }: Props = $props();

  let globeSceneRef = $state<any>(null);
  let globeContainer = $state<HTMLDivElement | null>(null);
  let globeInstance: any = null;
  let GlobeModule: any = null;
  let resizeObserver: ResizeObserver | null = null;
  let isInitialized = $state(false);
  let travelTimeoutId: any = null;

  // Option C: Shader-LUT Engine State (ADR 0038)
  let lutSphereMesh: THREE.Mesh | null = null;
  let lutShaderMaterial: THREE.ShaderMaterial | null = null;
  let lutPaletteTexture: THREE.DataTexture | null = null;
  let lutPaletteBuffer: Uint8Array | null = null;
  let countryIdTexture: THREE.CanvasTexture | null = null;
  let countryMapping: CountryIdMapping | null = null;
  let idBuffer: Uint8Array | null = null;
  const idTextureWidth = 2048;
  const idTextureHeight = 1024;
  let lutRaycaster: THREE.Raycaster | null = null;
  let lutMouseVec: THREE.Vector2 | null = null;
  let mouseScreenX = $state(0);
  let mouseScreenY = $state(0);
  let isHoveringLutGlobe = $state(false);
  let hoveredCountryIso3 = $state<string | null>(null);

  // Holographic Lazy-Loading & Transition State (ADR 0032)
  let isSwitchingMetric = $state(false);
  let transitionLabel = $state('Mengalibrasi Tampilan Globe...');
  let previousMetric = '';

  function getTransitionMessage(metric: string): string {
    if (metric === 'flag') return '🎨 Memuat & Memetakan Tekstur Bendera 195+ Negara...';
    if (metric === 'rate') return '🪙 Mengalibrasi Shader Spot Rate Rupiah...';
    if (metric === 'change') return '📈 Mengalibrasi Indikator Performa 24 Jam...';
    return '⚡ Memperbarui Tampilan Globe...';
  }

  function isFilterCurrentlyActive(): boolean {
    return (
      geoStore.timeFilter !== 'all' ||
      geoStore.flightCorridorFilter !== 'all' ||
      geoStore.passportVisaFilter !== 'all' ||
      (geoStore.customFilter !== 'all' && geoStore.customFilter !== undefined) ||
      geoStore.activeRegion !== 'all'
    );
  }

  function getPolygonColorForFeature(feat: any): string {
    const iso3 = getFeatureIso3(feat);
    const isMatched = geoStore.isCountryMatched(iso3);
    const isFilterActive = isFilterCurrentlyActive();

    return getCountryColor(iso3, {
      mapData,
      selectedIso3: mapState.selectedCountryIso3,
      hoveredIso3: mapState.hoveredIso3,
      currentTheme,
      activeMetric: mapState.activeMetric,
      isMatched,
      isFilterActive,
      activeApp: geoStore.activeApp,
      currentAppData: geoStore.currentAppData,
    });
  }

  function getTooltipHtmlForFeature(feat: any): string {
    const iso3 = getFeatureIso3(feat);
    return getTooltipHtml(iso3, {
      mapData,
      currentTheme,
      activeMetric: mapState.activeMetric,
      activeApp: geoStore.activeApp,
      currentAppData: geoStore.currentAppData,
    });
  }

  function getTooltipHtmlByIso3(iso3: string): string {
    return getTooltipHtml(iso3, {
      mapData,
      currentTheme,
      activeMetric: mapState.activeMetric,
      activeApp: geoStore.activeApp,
      currentAppData: geoStore.currentAppData,
    });
  }

  function updatePaletteLut() {
    if (!lutPaletteBuffer || !lutPaletteTexture || !countryMapping) return;
    const isDark = currentTheme === 'dark';

    const oceanRgba = hexOrRgbaToRgbaArray(isDark ? '#0B0F19' : '#FAF8F3');
    updatePaletteLutSlot(lutPaletteBuffer, 0, oceanRgba);

    const isFilterActive = isFilterCurrentlyActive();

    for (const country of EXTENDED_COUNTRIES_DATA) {
      const countryId = countryMapping.iso3ToId[country.iso3];
      if (!countryId) continue;
      const isMatched = geoStore.isCountryMatched(country.iso3);
      const colorStr = getCountryColor(country.iso3, {
        mapData,
        selectedIso3: mapState.selectedCountryIso3,
        hoveredIso3: mapState.hoveredIso3,
        currentTheme,
        activeMetric: mapState.activeMetric,
        isMatched,
        isFilterActive,
        activeApp: geoStore.activeApp,
        currentAppData: geoStore.currentAppData,
      });
      const rgba = hexOrRgbaToRgbaArray(colorStr);
      updatePaletteLutSlot(lutPaletteBuffer, countryId, rgba);
    }

    lutPaletteTexture.needsUpdate = true;

    if (lutShaderMaterial) {
      const selectedId = mapState.selectedCountryIso3 && countryMapping.iso3ToId[mapState.selectedCountryIso3]
        ? countryMapping.iso3ToId[mapState.selectedCountryIso3]
        : 0;
      const hoveredId = mapState.hoveredIso3 && countryMapping.iso3ToId[mapState.hoveredIso3]
        ? countryMapping.iso3ToId[mapState.hoveredIso3]
        : 0;
      lutShaderMaterial.uniforms.uSelectedId.value = selectedId;
      lutShaderMaterial.uniforms.uHoveredId.value = hoveredId;
      lutShaderMaterial.uniforms.uOceanColor.value.set(
        oceanRgba[0] / 255,
        oceanRgba[1] / 255,
        oceanRgba[2] / 255,
        oceanRgba[3] / 255
      );
    }
  }

  let lastHoveredIso3 = '';
  let cameraAltitude = $state(2.2);

  // Country 3D Pin Labels with LOD filtering & WorldCapitals support (ADR 0046, ADR 0050, ADR 0056)
  const globeLabels = $derived.by(() => {
    if (!geoJsonFeatures || geoJsonFeatures.length === 0 || !mapState.showLabels) return [];
    const isDark = currentTheme === 'dark';
    const selected = mapState.selectedCountryIso3;

    // Check polymorphic custom labels from active app (e.g. World Cities in TimeWorld)
    if (geoStore.activeApp?.getCustomLabels) {
      const simDate = geoStore.isSimulatingTime
        ? calculateSimulatedDateFromMinutes(geoStore.simulatedMinutes, geoStore.simulationAnchorZone)
        : undefined;
      return geoStore.activeApp.getCustomLabels(
        geoStore.currentAppData,
        mapState.activeMetric,
        currentTheme,
        selected,
        simDate,
        cameraAltitude
      );
    }

    // Filter features: major currencies OR selected
    const visibleFeatures = geoJsonFeatures.filter((feat: any) => {
      const iso3 = getFeatureIso3(feat);
      if (iso3 === selected) return true;
      return MAJOR_LOD_CURRENCIES.has(iso3);
    });

    return visibleFeatures.map((feat: any) => {
      const p = feat.properties;
      const iso3 = getFeatureIso3(feat);
      const country = mapData.find(d => d.iso3 === iso3);
      const spatial = EXTENDED_COUNTRIES_DATA.find(d => d.iso3 === iso3);
      const pinLabel = (geoStore.activeApp as any)?.getPinLabel?.(
        spatial,
        geoStore.currentAppData?.[iso3] ?? country,
        mapState.activeMetric,
        currentTheme
      );

      const rawName = country?.countryName || p.NAME || p.ADMIN || iso3;
      const curr = country?.currencyCode || '';
      const lat = pinLabel?.lat ?? Number(p.LABEL_Y) ?? spatial?.lat ?? 0;
      const lng = pinLabel?.lng ?? Number(p.LABEL_X) ?? spatial?.lng ?? 0;
      const isSelected = selected === iso3;

      let text = pinLabel?.text;
      if (!text) {
        text = rawName;
        if (curr && curr !== 'IDR') {
          text = `${text} (${curr})`;
        }
      }

      const defaultColor = isSelected ? '#ffffff' : (isDark ? 'rgba(241, 245, 249, 0.90)' : 'rgba(15, 23, 42, 0.90)');
      const size = isSelected ? 0.85 : 0.65;

      return {
        lat,
        lng,
        text,
        size: pinLabel?.size ?? size,
        color: pinLabel?.color ?? defaultColor,
        dotRadius: pinLabel?.dotRadius,
        iso3,
        country,
      };
    });
  });

  // Dynamic 3D Arcs for Remittance / Flights (ADR 0038 & ADR 0061)
  const remittanceArcs = $derived.by(() => {
    return getGlobeArcs({
      activeApp: geoStore.activeApp,
      currentAppData: geoStore.currentAppData,
      flightCorridorFilter: geoStore.flightCorridorFilter,
      isCountryMatched: (iso3) => geoStore.isCountryMatched(iso3),
    });
  });

  // 3D Paths for Meridians / Custom App Curves (ADR 0041 & ADR 0042)
  const globePaths = $derived.by(() => {
    const show = mapState.showTimezoneLines && geoStore.showTimezoneLines;
    return getGlobePaths({
      showTimezoneLines: show,
      activeApp: geoStore.activeApp,
      currentAppData: geoStore.currentAppData,
      activeMetric: mapState.activeMetric,
      currentTheme,
    });
  });

  // 3D Epicenter Pulsing Rings for Earthquake / Disaster Tracker (ADR 0044)
  const globeRings = $derived.by(() => {
    return getGlobeRings({
      activeApp: geoStore.activeApp,
      currentAppData: geoStore.currentAppData,
      selectedIso3: mapState.selectedCountryIso3,
    });
  });

  // 3D Hexagonal Binning Pillars for Global Financial FX Volume (ADR 0063)
  let showHexBins = $state(true);

  const hexBinPoints = $derived.by<HexBinPointData[]>(() => {
    if (!showHexBins) return [];
    return GLOBAL_FINANCIAL_HUBS.map((hub) => ({
      lat: hub.lat,
      lng: hub.lng,
      weight: hub.dailyTurnoverBillionUsd,
      hub,
    }));
  });

  const rateMapByCurrency = $derived.by<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const d of mapData) {
      if (d.currencyCode) {
        map[d.currencyCode] = d.middleRate;
      }
    }
    return map;
  });

  function handleHexClick(hub: FinancialHubData) {
    travelToCountry(hub.iso3);
    const country = mapData.find((d) => d.iso3 === hub.iso3);
    if (country) {
      onCountryClick?.(country);
    } else {
      geoStore.selectCountry(hub.iso3);
      mapState.selectCountry(hub.iso3);
    }
  }

  // Exported Camera Navigation Controller Methods (ADR 0043 & ADR 0049)
  export function flyTo(lat: number, lng: number, altitude: number, durationMs: number = 1000) {
    if (globeSceneRef) {
      globeSceneRef.flyTo(lat, lng, altitude, durationMs);
    } else if (globeInstance) {
      globeInstance.pointOfView({ lat, lng, altitude }, durationMs);
    }
  }

  export function travelToCountry(
    iso3: string,
    options?: { duration?: number; altitude?: number }
  ) {
    const targetCoords = getCountryCoordinates(iso3);
    if (!targetCoords) return;

    if (travelTimeoutId) {
      clearTimeout(travelTimeoutId);
      travelTimeoutId = null;
    }

    const currentGlobe = globeSceneRef?.getGlobe() || globeInstance;
    const curPov = currentGlobe?.pointOfView() || { lat: 0, lng: 0, altitude: 2.2 };
    const targetAltitude = options?.altitude ?? getCountryFocusAltitude(iso3);

    const trajectory = getTravelTrajectory(
      { lat: curPov.lat ?? 0, lng: curPov.lng ?? 0, altitude: curPov.altitude ?? 2.2 },
      targetCoords,
      { targetAltitude }
    );

    if (!trajectory.isTwoStage) {
      if (globeSceneRef) {
        globeSceneRef.flyTo(trajectory.stage1.lat, trajectory.stage1.lng, trajectory.stage1.altitude, options?.duration ?? trajectory.stage1.durationMs);
      } else if (globeInstance) {
        globeInstance.pointOfView(
          { lat: trajectory.stage1.lat, lng: trajectory.stage1.lng, altitude: trajectory.stage1.altitude },
          options?.duration ?? trajectory.stage1.durationMs
        );
      }
    } else {
      if (globeSceneRef) {
        globeSceneRef.flyTo(trajectory.stage1.lat, trajectory.stage1.lng, trajectory.stage1.altitude, trajectory.stage1.durationMs);
      } else if (globeInstance) {
        globeInstance.pointOfView(
          { lat: trajectory.stage1.lat, lng: trajectory.stage1.lng, altitude: trajectory.stage1.altitude },
          trajectory.stage1.durationMs
        );
      }

      travelTimeoutId = setTimeout(() => {
        if (globeSceneRef) {
          globeSceneRef.flyTo(trajectory.stage2.lat, trajectory.stage2.lng, trajectory.stage2.altitude, trajectory.stage2.durationMs);
        } else if (globeInstance) {
          globeInstance.pointOfView(
            { lat: trajectory.stage2.lat, lng: trajectory.stage2.lng, altitude: trajectory.stage2.altitude },
            trajectory.stage2.durationMs
          );
        }
        travelTimeoutId = null;
      }, trajectory.stage1.durationMs - 20);
    }
  }

  export function zoomIn(factor: number = 0.7, durationMs: number = 300) {
    if (globeSceneRef) {
      globeSceneRef.handleZoomIn(factor);
    } else if (globeInstance) {
      const pov = globeInstance.pointOfView();
      const currentAlt = pov?.altitude || 2.2;
      const nextAlt = Math.max(0.15, currentAlt * factor);
      globeInstance.pointOfView({ ...pov, altitude: nextAlt }, durationMs);
    }
  }

  export function zoomOut(factor: number = 1.4, durationMs: number = 300) {
    if (globeSceneRef) {
      globeSceneRef.handleZoomOut(factor);
    } else if (globeInstance) {
      const pov = globeInstance.pointOfView();
      const currentAlt = pov?.altitude || 2.2;
      const nextAlt = Math.min(6.0, currentAlt * factor);
      globeInstance.pointOfView({ ...pov, altitude: nextAlt }, durationMs);
    }
  }

  export function resetView(durationMs: number = 600) {
    if (globeSceneRef) {
      globeSceneRef.flyTo(10, 110, 2.2, durationMs);
    } else if (globeInstance) {
      globeInstance.pointOfView({ lat: 10, lng: 110, altitude: 2.2 }, durationMs);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (typeof window === 'undefined') return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      zoomIn();
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      zoomOut();
    } else if (e.key === '0') {
      e.preventDefault();
      resetView();
    }
  }

  function applyOptimalDpr() {
    const currentGlobe = globeSceneRef?.getGlobe() || globeInstance;
    if (!currentGlobe || typeof window === 'undefined') return;
    const renderer = currentGlobe.renderer?.();
    if (!renderer) return;
    const isTurbo = mapState.performanceMode === 'turbo' || geoStore.performanceMode === 'turbo';
    const dpr = isTurbo ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.35);
    renderer.setPixelRatio(dpr);
  }

  function updateVisuals() {
    const currentGlobe = globeSceneRef?.getGlobe() || globeInstance;
    if (!currentGlobe) return;
    const isDark = currentTheme === 'dark';
    const isFlag = (mapState.activeMetric === 'flag' || geoStore.activeMetricId === 'flag' || mapState.showFlags || geoStore.showFlags);
    const isTurbo = mapState.performanceMode === 'turbo' || geoStore.performanceMode === 'turbo';
    const themeConfig = getGlobeThemeConfig(currentTheme, isTurbo);

    applyOptimalDpr();

    if (isTurbo && lutSphereMesh) {
      lutSphereMesh.visible = true;
      updatePaletteLut();
      currentGlobe
        .showGlobe(false)
        .polygonAltitude(-10.0)
        .polygonLabel(() => '');
    } else {
      if (lutSphereMesh) lutSphereMesh.visible = false;
      currentGlobe
        .showGlobe(true)
        .polygonLabel((d: any) => getTooltipHtmlForFeature(d));

      if (!isFlag) {
        currentGlobe.polygonCapMaterial(null);
      } else {
        currentGlobe.polygonCapMaterial((d: any) => {
          const iso3 = getFeatureIso3(d);
          const isFilterActive = isFilterCurrentlyActive();
          if (isFilterActive && !geoStore.isCountryMatched(iso3)) {
            return getDimmedCapMaterial(isDark);
          }
          return createProceduralFlagMaterial(d, isDark);
        });
      }

      currentGlobe
        .polygonSideColor(() => themeConfig.polygonSideColor)
        .polygonStrokeColor(() => themeConfig.polygonStrokeColor)
        .polygonCapColor((d: any) => getPolygonColorForFeature(d))
        .polygonAltitude((d: any) => {
          const iso3 = getFeatureIso3(d);
          const isFilterActive = isFilterCurrentlyActive();
          const isMatched = geoStore.isCountryMatched(iso3);

          return getPolygonAltitude(iso3, {
            selectedIso3: mapState.selectedCountryIso3,
            hoveredIso3: mapState.hoveredIso3,
            isMatched,
            isFilterActive,
            isFlag,
          });
        });
    }

    currentGlobe
      .backgroundColor(themeConfig.backgroundColor)
      .atmosphereColor(themeConfig.atmosphereColor)
      .atmosphereAltitude(themeConfig.atmosphereAltitude)
      .labelsData(mapState.showLabels ? globeLabels : [])
      .labelSize((d: any) => d.size)
      .labelColor((d: any) => d.color)
      .labelDotRadius((d: any) => (d.iso3 === mapState.selectedCountryIso3 ? 0.24 : 0.06))
      .labelAltitude((d: any) => (d.iso3 === mapState.selectedCountryIso3 ? 0.035 : 0.018))
      .labelResolution(3)
      .arcsData(remittanceArcs)
      .arcColor((d: any) => d.color || ['#10b981', '#38bdf8'])
      .arcAltitude((d: any) => d.altitude || 0.35)
      .arcStroke((d: any) => d.stroke || 1.8)
      .arcDashLength((d: any) => d.dashLength || 0.4)
      .arcDashGap((d: any) => d.dashGap || 0.2)
      .arcDashAnimateTime((d: any) => d.dashAnimateTime || 2000)
      .pathsData(globePaths)
      .pathPoints((d: any) => d.coords)
      .pathColor((d: any) => d.color)
      .pathStroke((d: any) => d.stroke || 1.2)
      .pathPointAlt(() => 0.003)
      .pathDashLength((d: any) => d.dashLength || 0.1)
      .pathDashGap((d: any) => d.dashGap || 0.02)
      .pathDashAnimateTime((d: any) => d.animateTime || 0)
      .pathLabel((d: any) => d.tooltipHtml || d.label)
      .onPathClick((path: any) => {
        if (path?.utcOffset !== undefined) {
          mapState.setSelectedMeridian(path);
        }
      })
      .ringsData(globeRings)
      .ringLat((d: any) => d.lat)
      .ringLng((d: any) => d.lng)
      .ringColor((d: any) => d.color)
      .ringMaxRadius((d: any) => d.maxRadius || 5)
      .ringPropagationSpeed((d: any) => d.propagationSpeed || 2)
      .ringRepeatPeriod((d: any) => d.repeatPeriod || 1500);
  }

  async function initGlobe() {
    if (!globeContainer || geoJsonFeatures.length === 0) return;

    if (!GlobeModule) {
      const globePkg = await import('globe.gl');
      GlobeModule = globePkg.default || globePkg;
    }

    if (globeContainer.firstChild) {
      globeContainer.innerHTML = '';
    }

    const isTurbo = mapState.performanceMode === 'turbo' || geoStore.performanceMode === 'turbo';
    const width = globeContainer.clientWidth || window.innerWidth;
    const height = globeContainer.clientHeight || window.innerHeight;
    const isFlag = (mapState.activeMetric === 'flag' || geoStore.activeMetricId === 'flag' || mapState.showFlags || geoStore.showFlags);
    const themeConfig = getGlobeThemeConfig(currentTheme, isTurbo);
    const isDark = currentTheme === 'dark';

    globeInstance = GlobeModule()(globeContainer)
      .width(width)
      .height(height)
      .backgroundColor(themeConfig.backgroundColor)
      .showAtmosphere(true)
      .atmosphereColor(themeConfig.atmosphereColor)
      .atmosphereAltitude(themeConfig.atmosphereAltitude)
      .showGlobe(!isTurbo)
      .polygonsData(geoJsonFeatures)
      .polygonGeoJsonGeometry((d: any) => d.geometry)
      .polygonCapColor((feat: any) => getPolygonColorForFeature(feat))
      .polygonSideColor(() => themeConfig.polygonSideColor)
      .polygonStrokeColor(() => themeConfig.polygonStrokeColor)
      .polygonAltitude((feat: any) => {
        const iso3 = getFeatureIso3(feat);
        const isFilterActive = isFilterCurrentlyActive();
        const isMatched = geoStore.isCountryMatched(iso3);

        return getPolygonAltitude(iso3, {
          selectedIso3: mapState.selectedCountryIso3,
          hoveredIso3: mapState.hoveredIso3,
          isMatched,
          isFilterActive,
          isFlag,
        });
      })
      .polygonCapMaterial((feat: any) => {
        if (!isFlag) return null;
        const iso3 = getFeatureIso3(feat);
        const isFilterActive = isFilterCurrentlyActive();
        if (isFilterActive && !geoStore.isCountryMatched(iso3)) {
          return getDimmedCapMaterial(isDark);
        }
        return createProceduralFlagMaterial(feat, isDark);
      })
      .polygonLabel((feat: any) => (isTurbo ? '' : getTooltipHtmlForFeature(feat)))
      .onPolygonHover((hoverD: any) => {
        if (isTurbo) return;
        const iso3 = hoverD ? getFeatureIso3(hoverD) : null;
        if (iso3 === lastHoveredIso3) return;
        lastHoveredIso3 = iso3 ?? '';
        mapState.hoveredIso3 = iso3;
        onCountryHover?.(iso3);

        if (globeInstance) {
          globeInstance.polygonAltitude((feat: any) => {
            const featIso3 = getFeatureIso3(feat);
            const isFilterActive = isFilterCurrentlyActive();
            const isMatched = geoStore.isCountryMatched(featIso3);

            return getPolygonAltitude(featIso3, {
              selectedIso3: mapState.selectedCountryIso3,
              hoveredIso3: mapState.hoveredIso3,
              isMatched,
              isFilterActive,
              isFlag,
            });
          });
          globeInstance.polygonCapColor((feat: any) => getPolygonColorForFeature(feat));
        }
      })
      .onPolygonClick((clickD: any) => {
        if (!clickD) return;
        const featIso3 = getFeatureIso3(clickD);
        if (featIso3) {
          travelToCountry(featIso3);
        }
        const country = mapData.find((d) => d.iso3 === featIso3);
        if (country) {
          onCountryClick?.(country);
        } else if (featIso3) {
          geoStore.selectCountry(featIso3);
          mapState.selectCountry(featIso3);
        }
      });

    applyOptimalDpr();

    if (mapState.showLabels && globeLabels.length > 0) {
      globeInstance
        .labelsData(globeLabels)
        .labelLat((d: any) => d.lat)
        .labelLng((d: any) => d.lng)
        .labelText((d: any) => d.text)
        .labelSize((d: any) => d.size)
        .labelDotRadius((d: any) => (d.iso3 === mapState.selectedCountryIso3 ? 0.24 : 0.06))
        .labelColor((d: any) => d.color)
        .labelAltitude((d: any) => (d.iso3 === mapState.selectedCountryIso3 ? 0.035 : 0.018))
        .labelResolution(3)
        .onLabelClick((d: any) => {
          if (d?.iso3) {
            travelToCountry(d.iso3);
          }
          if (d.country) {
            onCountryClick?.(d.country);
          } else if (d?.iso3) {
            geoStore.selectCountry(d.iso3);
            mapState.selectCountry(d.iso3);
          }
        })
        .onLabelHover((d: any) => {
          const iso3 = d ? d.iso3 : null;
          if (iso3 === lastHoveredIso3) return;
          lastHoveredIso3 = iso3 ?? '';
          mapState.hoveredIso3 = iso3;
          onCountryHover?.(iso3);
          if (globeInstance) {
            requestAnimationFrame(() => {
              if (globeInstance) {
                globeInstance.polygonAltitude((feat: any) => {
                  const featIso3 = getFeatureIso3(feat);
                  const isFilterActive = isFilterCurrentlyActive();
                  const isMatched = geoStore.isCountryMatched(featIso3);

                  return getPolygonAltitude(featIso3, {
                    selectedIso3: mapState.selectedCountryIso3,
                    hoveredIso3: mapState.hoveredIso3,
                    isMatched,
                    isFilterActive,
                    isFlag,
                  });
                });
                globeInstance.polygonCapColor((feat: any) => getPolygonColorForFeature(feat));
              }
            });
          }
        });
    }

    if (globePaths.length > 0) {
      globeInstance
        .pathsData(globePaths)
        .pathPoints((d: any) => d.coords)
        .pathColor((d: any) => d.color)
        .pathStroke((d: any) => d.stroke || 1.2)
        .pathPointAlt(() => 0.003)
        .pathDashLength((d: any) => d.dashLength || 0.1)
        .pathDashGap((d: any) => d.dashGap || 0.02)
        .pathDashAnimateTime((d: any) => d.animateTime || 0)
        .pathLabel((d: any) => d.tooltipHtml || d.label)
        .onPathClick((path: any) => {
          if (path?.utcOffset !== undefined) {
            mapState.setSelectedMeridian(path);
          }
        });
    }

    globeInstance
      .ringsData(globeRings)
      .ringLat((d: any) => d.lat)
      .ringLng((d: any) => d.lng)
      .ringColor((d: any) => d.color)
      .ringMaxRadius((d: any) => d.maxRadius || 5)
      .ringPropagationSpeed((d: any) => d.propagationSpeed || 2)
      .ringRepeatPeriod((d: any) => d.repeatPeriod || 1500);

    const controls = globeInstance.controls();
    if (controls) {
      controls.autoRotate = false;
      controls.autoRotateSpeed = 0.5;
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.minDistance = 105;
      controls.maxDistance = 550;

      controls.addEventListener('change', () => {
        const pov = globeInstance.pointOfView();
        if (pov && typeof pov.altitude === 'number') {
          if (Math.abs(pov.altitude - cameraAltitude) > 0.12) {
            cameraAltitude = pov.altitude;
          }
        }
      });
    }

    globeInstance.pointOfView({ lat: 10, lng: 110, altitude: 2.2 }, 800);

    countryMapping = buildCountryIdMapping(EXTENDED_COUNTRIES_DATA);
    const { canvas: idCanvas, buffer: rawIdBuffer } = renderEquirectangularIdTexture(
      geoJsonFeatures,
      countryMapping,
      idTextureWidth,
      idTextureHeight
    );
    idBuffer = rawIdBuffer;

    countryIdTexture = new THREE.CanvasTexture(idCanvas);
    countryIdTexture.minFilter = THREE.NearestFilter;
    countryIdTexture.magFilter = THREE.NearestFilter;
    countryIdTexture.wrapS = THREE.ClampToEdgeWrapping;
    countryIdTexture.wrapT = THREE.ClampToEdgeWrapping;

    lutPaletteBuffer = createPaletteLutBuffer(isDark ? '#0B0F19' : '#FAF8F3');
    lutPaletteTexture = new THREE.DataTexture(
      lutPaletteBuffer,
      256,
      1,
      THREE.RGBAFormat,
      THREE.UnsignedByteType
    );
    lutPaletteTexture.minFilter = THREE.NearestFilter;
    lutPaletteTexture.magFilter = THREE.NearestFilter;
    lutPaletteTexture.needsUpdate = true;

    lutShaderMaterial = new THREE.ShaderMaterial({
      vertexShader: GLOBE_LUT_VERTEX_SHADER,
      fragmentShader: GLOBE_LUT_FRAGMENT_SHADER,
      uniforms: {
        uCountryIdMap: { value: countryIdTexture },
        uPaletteLut: { value: lutPaletteTexture },
        uHoveredId: { value: 0 },
        uSelectedId: { value: 0 },
        uHoverColor: { value: new THREE.Color('#34d399') },
        uSelectColor: { value: new THREE.Color('#38bdf8') },
        uOceanColor: { value: new THREE.Vector4(isDark ? 11/255 : 250/255, isDark ? 15/255 : 248/255, isDark ? 25/255 : 243/255, 1.0) },
        uAtmosphereGlow: { value: isTurbo ? 0.6 : 1.0 },
      },
      transparent: false,
      depthWrite: true,
    });

    const sphereGeo = new THREE.SphereGeometry(100.0, 96, 96);
    lutSphereMesh = new THREE.Mesh(sphereGeo, lutShaderMaterial);
    lutSphereMesh.rotation.y = -Math.PI / 2;
    lutSphereMesh.visible = isTurbo;

    const scene = globeInstance.scene?.();
    if (scene) {
      scene.add(lutSphereMesh);
    }

    lutRaycaster = new THREE.Raycaster();
    lutMouseVec = new THREE.Vector2();

    updatePaletteLut();

    isInitialized = true;
    onReady?.();

    if (globeContainer && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (globeInstance && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            globeInstance.width(entry.contentRect.width).height(entry.contentRect.height);
          }
        }
      });
      resizeObserver.observe(globeContainer);
    }
  }

  function handleContainerPointerMove(e: MouseEvent) {
    const isTurbo = mapState.performanceMode === 'turbo' || geoStore.performanceMode === 'turbo';
    if (!isTurbo || !lutSphereMesh || !globeInstance || !idBuffer || !countryMapping || !globeContainer) return;

    const rect = globeContainer.getBoundingClientRect();
    mouseScreenX = e.clientX - rect.left;
    mouseScreenY = e.clientY - rect.top;

    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (!lutRaycaster) lutRaycaster = new THREE.Raycaster();
    if (!lutMouseVec) lutMouseVec = new THREE.Vector2();
    lutMouseVec.set(x, y);

    const camera = globeInstance.camera?.();
    if (!camera) return;

    lutRaycaster.setFromCamera(lutMouseVec, camera);
    const intersects = lutRaycaster.intersectObject(lutSphereMesh);

    if (intersects.length > 0 && intersects[0].uv) {
      const uv = intersects[0].uv;
      const { countryId, iso3 } = pickCountryFromUv(
        uv.x,
        uv.y,
        idBuffer,
        idTextureWidth,
        idTextureHeight,
        countryMapping
      );

      if (iso3) {
        isHoveringLutGlobe = true;
        hoveredCountryIso3 = iso3;
        if (iso3 !== lastHoveredIso3) {
          lastHoveredIso3 = iso3;
          mapState.hoveredIso3 = iso3;
          onCountryHover?.(iso3);
          if (lutShaderMaterial) {
            lutShaderMaterial.uniforms.uHoveredId.value = countryId;
          }
        }
      } else {
        clearLutHover();
      }
    } else {
      clearLutHover();
    }
  }

  function clearLutHover() {
    isHoveringLutGlobe = false;
    hoveredCountryIso3 = null;
    if (lastHoveredIso3 !== '') {
      lastHoveredIso3 = '';
      mapState.hoveredIso3 = null;
      onCountryHover?.(null);
      if (lutShaderMaterial) {
        lutShaderMaterial.uniforms.uHoveredId.value = 0;
      }
    }
  }

  function handleContainerClick() {
    const isTurbo = mapState.performanceMode === 'turbo' || geoStore.performanceMode === 'turbo';
    if (!isTurbo || !hoveredCountryIso3) return;
    const country = mapData.find((d) => d.iso3 === hoveredCountryIso3);
    if (country) {
      onCountryClick?.(country);
    }
  }

  function handleCountryClickFromScene(iso3: string) {
    if (iso3) {
      travelToCountry(iso3);
    }
    const country = mapData.find((d) => d.iso3 === iso3);
    if (country) {
      onCountryClick?.(country);
    } else if (iso3) {
      geoStore.selectCountry(iso3);
      mapState.selectCountry(iso3);
    }
  }

  function handleCountryHoverFromScene(iso3: string | null) {
    mapState.hoveredIso3 = iso3;
    onCountryHover?.(iso3);
  }

  function handlePathClickFromScene(path: any) {
    if (path?.utcOffset !== undefined) {
      mapState.setSelectedMeridian(path);
    }
  }

  function handleGlobeSceneReady(globe: any) {
    globeInstance = globe;
    isInitialized = true;
    const controls = globe?.controls?.();
    if (controls) {
      controls.addEventListener('change', () => {
        const pov = globe?.pointOfView?.();
        if (pov && typeof pov.altitude === 'number') {
          if (Math.abs(pov.altitude - cameraAltitude) > 0.12) {
            cameraAltitude = pov.altitude;
          }
        }
      });
    }
    onReady?.();
  }

  // React to reactive state changes with non-blocking lazy-loading transition
  $effect(() => {
    if (!isInitialized) return;
    const _app = geoStore.activeAppId;
    const _timeFilter = geoStore.timeFilter;
    const _flightFilter = geoStore.flightCorridorFilter;
    const _passportFilter = geoStore.passportVisaFilter;
    const _theme = currentTheme;
    const currentMetric = geoStore.activeMetricId ?? mapState.activeMetric;
    const _flags = mapState.showFlags || geoStore.showFlags;
    const _labels = mapState.showLabels;
    const _geoLabels = geoStore.showLabels;
    const _selected = mapState.selectedCountryIso3;
    const _data = mapData;
    const _perfMap = mapState.performanceMode;
    const _perfGeo = geoStore.performanceMode;
    const _rings = globeRings;
    const _appData = geoStore.currentAppData;

    if (previousMetric && previousMetric !== currentMetric) {
      isSwitchingMetric = true;
      transitionLabel = getTransitionMessage(currentMetric);
      previousMetric = currentMetric;

      requestAnimationFrame(() => {
        setTimeout(() => {
          updateVisuals();
          setTimeout(() => {
            isSwitchingMetric = false;
          }, 180);
        }, 20);
      });
    } else {
      previousMetric = currentMetric;
      updateVisuals();
    }
  });

  // React to region changes
  $effect(() => {
    if (!isInitialized) return;
    const regionId = mapState.activeRegion;
    const regionObj = REGION_FILTERS.find((r) => r.id === regionId);
    if (regionObj) {
      const altitude = regionId === 'all' ? 2.2 : (regionObj.zoom ? Math.max(0.6, 2.5 / regionObj.zoom) : 1.5);
      if (globeSceneRef) {
        globeSceneRef.flyTo(regionObj.lat, regionObj.lon, altitude, 1000);
      } else if (globeInstance) {
        globeInstance.pointOfView({ lat: regionObj.lat, lng: regionObj.lon, altitude }, 1000);
      }
    }
  });

  // React to auto-rotate state changes (ADR 0052)
  $effect(() => {
    if (!isInitialized || !globeInstance) return;
    const isRotating = Boolean(mapState.autoRotate || geoStore.autoRotate);
    const controls = globeInstance.controls?.();
    if (controls) {
      controls.autoRotate = isRotating;
    }
  });

  // React to dynamic camera presets for active app (ADR 0038)
  $effect(() => {
    if (!isInitialized) return;
    const presets = (geoStore.activeApp as any)?.cameraPresets;
    if (!presets) return;

    const filterKey = (
      (geoStore.activeApp?.getArcs || geoStore.activeApp?.getArcData)
        ? geoStore.flightCorridorFilter
        : (geoStore.timeFilter !== 'all' ? geoStore.timeFilter :
           geoStore.passportVisaFilter !== 'all' ? geoStore.passportVisaFilter :
           geoStore.natureFilter !== 'all' ? geoStore.natureFilter :
           mapState.activeRegion !== 'all' ? mapState.activeRegion : 'all')
    );

    const preset = presets[filterKey];
    if (preset) {
      if (globeSceneRef) {
        globeSceneRef.flyTo(preset.lat, preset.lng, preset.altitude, 1000);
      } else if (globeInstance) {
        globeInstance.pointOfView(preset, 1000);
      }
    }
  });

  // React to reactive country travel signals from geoStore or mapState (ADR 0049)
  let lastTravelTimestamp = 0;
  $effect(() => {
    if (!isInitialized) return;
    const storeSignal = geoStore.cameraTravelSignal;
    const mapSignal = mapState.cameraTravelSignal;
    const latestSignal = (storeSignal?.timestamp ?? 0) >= (mapSignal?.timestamp ?? 0)
      ? storeSignal
      : mapSignal;

    if (latestSignal && latestSignal.timestamp > lastTravelTimestamp) {
      lastTravelTimestamp = latestSignal.timestamp;
      travelToCountry(latestSignal.iso3);
    }
  });

  onMount(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeydown);
    }
  });

  onDestroy(() => {
    if (travelTimeoutId) {
      clearTimeout(travelTimeoutId);
      travelTimeoutId = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeydown);
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (globeInstance) {
      const renderer = globeInstance.renderer?.();
      if (renderer) {
        renderer.dispose?.();
        renderer.forceContextLoss?.();
        renderer.domElement?.remove();
      }
      const scene = globeInstance.scene?.();
      if (scene) {
        scene.clear?.();
      }
      try {
        globeInstance._destructor?.();
      } catch {}
      globeInstance = null;
    }
    if (globeContainer) {
      globeContainer.innerHTML = '';
    }
    if (lutSphereMesh) {
      lutSphereMesh.geometry?.dispose();
      lutSphereMesh = null;
    }
    if (lutShaderMaterial) {
      lutShaderMaterial.dispose();
      lutShaderMaterial = null;
    }
    if (countryIdTexture) {
      countryIdTexture.dispose();
      countryIdTexture = null;
    }
    if (lutPaletteTexture) {
      lutPaletteTexture.dispose();
      lutPaletteTexture = null;
    }
    disposeProceduralFlagCache();
  });
</script>

<div class="relative w-full h-full min-h-[500px] overflow-hidden select-none">
  <!-- Declarative Globe Canvas Scene from fe-2 (ADR 0062) -->
  <GlobeScene
    bind:this={globeSceneRef}
    polygons={geoJsonFeatures}
    {mapData}
    selectedIso3={mapState.selectedCountryIso3}
    hoveredIso3={mapState.hoveredIso3}
    activeMetric={mapState.activeMetric}
    arcs={remittanceArcs}
    paths={globePaths}
    rings={globeRings}
    labels={globeLabels}
    {hexBinPoints}
    {rateMapByCurrency}
    onHexClick={handleHexClick}
    theme={currentTheme}
    autoRotate={Boolean(mapState.autoRotate || geoStore.autoRotate)}
    isFilterActive={isFilterCurrentlyActive()}
    isCountryMatched={(iso3) => geoStore.isCountryMatched(iso3)}
    activeApp={geoStore.activeApp}
    currentAppData={geoStore.currentAppData}
    onCountryClick={handleCountryClickFromScene}
    onCountryHover={handleCountryHoverFromScene}
    onPathClick={handlePathClickFromScene}
    onReady={handleGlobeSceneReady}
  />

  <!-- Interactive Timezone Meridian Inspector Card (ADR 0042) -->
  {#if mapState.selectedMeridian}
    {@const m = mapState.selectedMeridian}
    <div
      class="absolute top-20 left-6 z-40 w-80 max-w-[calc(100vw-3rem)] rounded-2xl border border-sky-500/30 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
    >
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30">
            🌐
          </div>
          <div>
            <h4 class="text-sm font-black text-white">{m.label || m.gmtLabel}</h4>
            <span class="inline-block text-[11px] font-bold text-sky-400 font-mono">{m.gmtLabel}</span>
          </div>
        </div>
        <button
          type="button"
          onclick={() => mapState.setSelectedMeridian(null)}
          class="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          title="Tutup Detail Meridian"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="rounded-xl bg-slate-900/80 border border-slate-800 p-3 mb-3">
        <div class="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1">Jam Lokal di Meridian Ini</div>
        <div class="text-2xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
          <span>{m.localTime}</span>
          <span class="text-xs font-bold text-emerald-400 font-sans">{m.diffWib}</span>
        </div>
      </div>

      {#if m.keyRegions && m.keyRegions.length > 0}
        <div>
          <div class="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">Wilayah / Kota Utama Dilintasi:</div>
          <div class="flex flex-wrap gap-1.5">
            {#each m.keyRegions as reg}
              <span class="rounded-lg bg-slate-800/80 border border-slate-700/60 px-2 py-1 text-[11px] text-slate-200 font-medium">
                {reg}
              </span>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Option C: Instant Zero-Overhead Tooltip in Turbo Mode (ADR 0038) -->
  {#if (mapState.performanceMode === 'turbo' || geoStore.performanceMode === 'turbo') && isHoveringLutGlobe && hoveredCountryIso3}
    <div
      class="pointer-events-none absolute z-40 transition-opacity duration-75"
      style="left: {Math.min(mouseScreenX + 16, (globeContainer?.clientWidth || 800) - 250)}px; top: {Math.min(mouseScreenY + 16, (globeContainer?.clientHeight || 600) - 180)}px;"
    >
      {@html getTooltipHtmlByIso3(hoveredCountryIso3)}
    </div>
  {/if}

  <!-- Holographic Metric Transition / Lazy-Loading HUD -->
  {#if isSwitchingMetric}
    <div
      class="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900/90 border border-cyan-500/40 text-cyan-300 text-xs font-semibold backdrop-blur-xl shadow-2xl shadow-cyan-500/10 animate-in fade-in zoom-in-95 duration-200"
    >
      <Loader2 class="w-4 h-4 animate-spin text-cyan-400" />
      <span>{transitionLabel}</span>
    </div>
  {/if}

  <!-- Floating 3D Navigation Controls (Zoom In, Zoom Out, Reset View - ADR 0043) -->
  <div
    class="absolute bottom-24 sm:bottom-28 right-4 sm:right-6 z-30 flex flex-col gap-1 rounded-2xl border border-slate-700/80 bg-slate-950/90 p-1.5 shadow-2xl backdrop-blur-xl"
    role="toolbar"
    aria-label="Kontrol Navigasi Peta"
  >
    <button
      type="button"
      onclick={() => zoomIn()}
      class="flex h-8 w-8 items-center justify-center rounded-xl text-slate-300 transition hover:bg-sky-500/20 hover:text-sky-300 active:scale-95 cursor-pointer"
      title="Perbesar Tampilan (Zoom In) [+]"
      aria-label="Perbesar Tampilan (Zoom In)"
    >
      <Plus class="w-4 h-4" />
    </button>

    <button
      type="button"
      onclick={() => zoomOut()}
      class="flex h-8 w-8 items-center justify-center rounded-xl text-slate-300 transition hover:bg-sky-500/20 hover:text-sky-300 active:scale-95 cursor-pointer"
      title="Perkecil Tampilan (Zoom Out) [-]"
      aria-label="Perkecil Tampilan (Zoom Out)"
    >
      <Minus class="w-4 h-4" />
    </button>

    <div class="my-0.5 h-px w-full bg-slate-800"></div>

    <button
      type="button"
      onclick={() => (showHexBins = !showHexBins)}
      class="flex h-8 w-8 items-center justify-center rounded-xl transition cursor-pointer {showHexBins ? 'bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30 shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-white active:scale-95'}"
      title={showHexBins ? 'Sembunyikan Pilar Volume Valas (BIS)' : 'Tampilkan Pilar 3D Volume Pasar Valas (BIS)'}
      aria-label="Toggle Pilar Volume Valas"
    >
      <BarChart3 class="w-3.5 h-3.5" />
    </button>

    <button
      type="button"
      onclick={() => resetView()}
      class="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-800 hover:text-white active:scale-95 cursor-pointer"
      title="Reset Sudut Pandang [0]"
      aria-label="Reset Sudut Pandang"
    >
      <RotateCcw class="w-3.5 h-3.5" />
    </button>
  </div>
</div>
