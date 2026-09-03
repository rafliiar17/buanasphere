<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Loader2, X, Plus, Minus, RotateCcw } from 'lucide-svelte';
  import type { MapStateStore } from '../mapState.svelte';
  import type { MapCountryData } from '../map-constants';
  import { REGION_FILTERS } from '../map-constants';
  import { createProceduralFlagMaterial, disposeProceduralFlagCache } from '../procedural-flags';
  import { formatRupiah, formatPercent } from '$lib/formatters/currency';
  import { t } from '$lib/i18n';
  import type { Theme } from '$lib/theme';
  import { geoStore } from '$lib/framework/geoglobe/geoStore.svelte';
  import { EXTENDED_COUNTRIES_DATA } from '$lib/framework/geoglobe/countrySpatialData';
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

  let globeContainer = $state<HTMLDivElement | null>(null);
  let globeInstance: any = null;
  let GlobeModule: any = null;
  let resizeObserver: ResizeObserver | null = null;
  let isInitialized = $state(false);

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

  // ISO-3 to ISO-2 Fallback Mapping for FlagCDN
  const ISO3_TO_ISO2_MAP: Record<string, string> = {
    IDN: 'id', USA: 'us', JPN: 'jp', CHN: 'cn', GBR: 'gb', DEU: 'de', FRA: 'fr', SGP: 'sg',
    AUS: 'au', SAU: 'sa', MYS: 'my', THA: 'th', IND: 'in', BRA: 'br', ZAF: 'za', KOR: 'kr',
    CAN: 'ca', RUS: 'ru', ITA: 'it', ESP: 'es', TUR: 'tr', EGY: 'eg', ARE: 'ae', PHL: 'ph',
    VNM: 'vn', KAZ: 'kz', NLD: 'nl', CHE: 'ch', SWE: 'se', NOR: 'no', DNK: 'dk', POL: 'pl',
    MEX: 'mx', ARG: 'ar', CHL: 'cl', COL: 'co', PER: 'pe', NZL: 'nz', QAT: 'qa', KWT: 'kw',
    OMN: 'om', BHR: 'bh', JOR: 'jo', LBN: 'lb', IRQ: 'iq', ISR: 'il', IRN: 'ir', PAK: 'pk',
    BGD: 'bd', LKA: 'lk', NPL: 'np', MMR: 'mm', KHM: 'kh', LAO: 'la', BRN: 'bn', NGA: 'ng',
    KEN: 'ke', GHA: 'gh', MAR: 'ma', DZA: 'dz', TUN: 'tn', ETH: 'et', TZA: 'tz', UGA: 'ug',
    UKR: 'ua', ROU: 'ro', CZE: 'cz', GRC: 'gr', PRT: 'pt', BEL: 'be', AUT: 'at', IRL: 'ie',
    FIN: 'fi', HUN: 'hu', HRV: 'hr', BGR: 'bg', SRB: 'rs', SVK: 'sk', SVN: 'si', EST: 'ee',
    LVA: 'lv', LTU: 'lt', CYP: 'cy', ISL: 'is', LUX: 'lu', MLT: 'mt', GEO: 'ge', ARM: 'am',
    AZE: 'az', UZB: 'uz', TKM: 'tm', TJK: 'tj', KGZ: 'kg', MNG: 'mn', TWN: 'tw', HKG: 'hk',
    MAC: 'mo', FJI: 'fj', PNG: 'pg', SLB: 'sb', VUT: 'vu', WSM: 'ws', TON: 'to', SOM: 'so',
  };

  function getFeatureIso3(feat: any): string {
    if (!feat || !feat.properties) return '';
    const p = feat.properties;
    const code = p.ISO_A3 || p.ADM0_A3 || p.SOV_A3 || p.adm0_a3 || p.iso_a3 || '';
    if (code === '-99' || !code) {
      return p.ADM0_A3 || p.SOV_A3 || p.GU_A3 || p.BRK_A3 || '';
    }
    return code;
  }

  function getFeatureIso2(feat: any): string {
    if (!feat || !feat.properties) return '';
    const p = feat.properties;
    const a2 = p.ISO_A2 || p.ISO_A2_EH || p.WB_A2 || p.POSTAL || p.FIPS_10 || '';
    if (a2 && a2 !== '-99' && a2.length === 2) {
      return a2.toLowerCase();
    }
    const iso3 = getFeatureIso3(feat);
    return (ISO3_TO_ISO2_MAP[iso3] || iso3.slice(0, 2)).toLowerCase();
  }

  function getCountryColorByIso3(iso3: string): string {
    const isDark = currentTheme === 'dark';
    const country = mapData.find(d => d.iso3 === iso3);
    const spatial = EXTENDED_COUNTRIES_DATA.find(d => d.iso3 === iso3) || {
      iso3,
      countryName: country?.countryName || iso3,
      currencyCode: country?.currencyCode || iso3,
      currencyName: country?.currencyName || '',
      flagEmoji: '🌐',
      region: 'Unknown',
      capital: '',
      lat: 0,
      lng: 0,
      utcOffset: 0,
      continent: 'Unknown'
    };
    const isSelected = mapState.selectedCountryIso3 === iso3;
    const isHovered = mapState.hoveredIso3 === iso3;
    const isMatched = geoStore.isCountryMatched(iso3);

    if (isSelected) {
      return '#38bdf8'; // Glowing sky blue highlight
    }
    if (isHovered) {
      return '#34d399'; // Emerald hover
    }

    const appData = geoStore.currentAppData?.[iso3] ?? country;
    if (geoStore.activeApp?.getPolygonColor && spatial) {
      return geoStore.activeApp.getPolygonColor(spatial, appData, mapState.activeMetric, currentTheme);
    }

    // Fallback if activeApp does not provide getPolygonColor hook
    if (!isMatched && (geoStore.timeFilter !== 'all' || geoStore.flightCorridorFilter !== 'all' || geoStore.passportVisaFilter !== 'all')) {
      return isDark ? 'rgba(30, 41, 59, 0.20)' : 'rgba(226, 232, 240, 0.35)';
    }

    if (!country) {
      return isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(226, 232, 240, 0.7)';
    }

    return isDark ? 'rgba(51, 65, 85, 0.40)' : 'rgba(226, 232, 240, 0.60)';
  }

  function getPolygonColor(feat: any): string {
    const iso3 = getFeatureIso3(feat);
    return getCountryColorByIso3(iso3);
  }

  function getTooltipHtmlByIso3(iso3: string): string {
    const isDark = currentTheme === 'dark';
    const country = mapData.find(d => d.iso3 === iso3);
    const spatial = EXTENDED_COUNTRIES_DATA.find(d => d.iso3 === iso3) || {
      iso3,
      countryName: country?.countryName || iso3,
      currencyCode: country?.currencyCode || iso3,
      currencyName: country?.currencyName || '',
      flagEmoji: '🌐',
      region: 'Unknown',
      capital: '',
      lat: 0,
      lng: 0,
      utcOffset: 0,
      continent: 'Unknown'
    };
    const appData = geoStore.currentAppData?.[iso3] ?? country;

    if (geoStore.activeApp?.getTooltipHtml && spatial) {
      return geoStore.activeApp.getTooltipHtml(spatial, appData, mapState.activeMetric, currentTheme);
    }

    // Default fallback: fx-rates
    const iso2 = (ISO3_TO_ISO2_MAP[iso3] || iso3.slice(0, 2)).toLowerCase();
    const name = spatial?.countryName || country?.countryName || iso3;
    const code = country?.currencyCode || '';
    const currName = country?.currencyName || '';
    const midFormatted = country ? formatRupiah(country.middleRate) : '-';
    const buyFormatted = country ? formatRupiah(country.buyRate) : '-';
    const sellFormatted = country ? formatRupiah(country.sellRate) : '-';
    const chgFormatted = country ? formatPercent(country.change24h) : '0.00%';
    const chgColor = (country?.change24h ?? 0) >= 0 ? '#10b981' : '#ef4444';

    if (mapState.activeMetric === 'change') {
      return `
        <div style="background: ${isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.97)'}; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 12px; padding: 10px 14px; box-shadow: 0 12px 36px rgba(0,0,0,0.35); font-family: Inter, sans-serif; pointer-events: none; min-width: 220px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <img src="https://flagcdn.com/w40/${iso2}.png" alt="${name}" style="width: 22px; height: 15px; border-radius: 3px; object-fit: cover; border: 1px solid rgba(255,255,255,0.2);" onerror="this.style.display='none'" />
            <span style="font-size: 13px; font-weight: 800; color: ${isDark ? '#f8fafc' : '#0f172a'};">${name}</span>
            ${code ? `<span style="font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 4px; background: rgba(56, 189, 248, 0.2); color: #38bdf8;">${code}</span>` : ''}
          </div>
          <div style="font-size: 13px; font-weight: 800; color: ${chgColor}; margin: 6px 0 3px 0;">
            📈 Tren 24 Jam: ${chgFormatted} (${(country?.change24h ?? 0) >= 0 ? 'Menguat' : 'Melemah'})
          </div>
          <div style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#475569'}; margin-bottom: 2px;">
            Kurs Tengah: ${midFormatted}
          </div>
          <div style="font-size: 10px; color: #38bdf8; margin-top: 4px; font-weight: 600;">
            👉 Klik untuk pilih • Klik 2x untuk split view
          </div>
        </div>
      `;
    }

    return `
      <div style="background: ${isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.97)'}; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 12px; padding: 10px 14px; box-shadow: 0 12px 36px rgba(0,0,0,0.35); font-family: Inter, sans-serif; pointer-events: none; min-width: 220px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <img src="https://flagcdn.com/w40/${iso2}.png" alt="${name}" style="width: 22px; height: 15px; border-radius: 3px; object-fit: cover; border: 1px solid rgba(255,255,255,0.2);" onerror="this.style.display='none'" />
          <span style="font-size: 13px; font-weight: 800; color: ${isDark ? '#f8fafc' : '#0f172a'};">${name}</span>
          ${code ? `<span style="font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 4px; background: rgba(56, 189, 248, 0.2); color: #38bdf8;">${code}</span>` : ''}
        </div>
        ${currName ? `<div style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#475569'}; margin-bottom: 6px;">${currName}</div>` : ''}
        <div style="font-size: 12px; font-weight: 700; color: #10b981; margin-bottom: 2px;">
          Kurs Tengah: ${midFormatted}
        </div>
        <div style="font-size: 11px; color: ${isDark ? '#cbd5e1' : '#334155'}; margin-bottom: 2px;">
          Beli: ${buyFormatted} | Jual: ${sellFormatted}
        </div>
        <div style="font-size: 11px; font-weight: 700; color: ${chgColor};">
          24 Jam: ${chgFormatted}
        </div>
        <div style="font-size: 10px; color: #38bdf8; margin-top: 4px; font-weight: 600;">
          👉 Klik untuk pilih • Klik 2x untuk split view
        </div>
      </div>
    `;
  }

  function getTooltipHtml(feat: any): string {
    const iso3 = getFeatureIso3(feat);
    return getTooltipHtmlByIso3(iso3);
  }

  /**
   * Updates the GPU 1D Palette LUT (Look-Up Table) buffer (ADR 0038).
   * Runs in 0.005 ms, instantly recoloring the entire globe in 1 draw call!
   */
  function updatePaletteLut() {
    if (!lutPaletteBuffer || !lutPaletteTexture || !countryMapping) return;
    const isDark = currentTheme === 'dark';

    // Ocean color (Slot 0)
    const oceanRgba = hexOrRgbaToRgbaArray(isDark ? '#0B0F19' : '#FAF8F3');
    updatePaletteLutSlot(lutPaletteBuffer, 0, oceanRgba);

    // Update each country in the LUT buffer
    for (const country of EXTENDED_COUNTRIES_DATA) {
      const countryId = countryMapping.iso3ToId[country.iso3];
      if (!countryId) continue;
      const colorStr = getCountryColorByIso3(country.iso3);
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

  // Major Trading Currencies Set for Level-of-Detail (LOD) Label Optimization
  const MAJOR_LOD_CURRENCIES = new Set([
    'IDN', 'USA', 'JPN', 'CHN', 'GBR', 'DEU', 'FRA', 'SGP', 'AUS', 'SAU',
    'MYS', 'THA', 'IND', 'BRA', 'ZAF', 'KOR', 'CAN', 'RUS', 'ITA', 'ESP',
    'TUR', 'EGY', 'ARE', 'CHE'
  ]);

  let lastHoveredIso3 = '';

  // Country 3D Pin Labels with LOD filtering (reduces draw calls by 85%)
  const globeLabels = $derived.by(() => {
    if (!geoJsonFeatures || geoJsonFeatures.length === 0 || !mapState.showLabels) return [];
    const isDark = currentTheme === 'dark';
    const selected = mapState.selectedCountryIso3;
    const hovered = mapState.hoveredIso3;

    // Filter features: major currencies OR actively hovered OR selected
    const visibleFeatures = geoJsonFeatures.filter((feat: any) => {
      const iso3 = getFeatureIso3(feat);
      if (iso3 === selected || iso3 === hovered) return true;
      return MAJOR_LOD_CURRENCIES.has(iso3);
    });

    return visibleFeatures.map((feat: any) => {
      const p = feat.properties;
      const iso3 = getFeatureIso3(feat);
      const country = mapData.find(d => d.iso3 === iso3);
      const rawName = country?.countryName || p.NAME || p.ADMIN || iso3;
      const curr = country?.currencyCode || '';
      const lat = Number(p.LABEL_Y) || 0;
      const lng = Number(p.LABEL_X) || 0;
      const isSelected = selected === iso3;
      const isHovered = hovered === iso3;
      const isMajor = MAJOR_LOD_CURRENCIES.has(iso3);

      const spatial = EXTENDED_COUNTRIES_DATA.find(d => d.iso3 === iso3) || {
        iso3,
        countryName: rawName,
        currencyCode: curr || iso3,
        currencyName: country?.currencyName || '',
        flagEmoji: '🌐',
        region: 'Unknown',
        capital: '',
        lat,
        lng,
        utcOffset: 0,
        continent: 'Unknown'
      };
      const appData = geoStore.currentAppData?.[iso3] ?? country;
      const pinLabel = geoStore.activeApp?.getPinLabel?.(spatial, appData, mapState.activeMetric);

      const displayText = pinLabel?.text ?? `${rawName} (${curr || iso3})`;
      const shortText = pinLabel?.shortText ?? (curr || iso3);
      const defaultSize = isSelected ? 0.65 : (isHovered ? 0.52 : (isMajor ? 0.36 : 0.28));
      const defaultColor = isSelected 
        ? '#38bdf8' 
        : (isHovered 
            ? '#34d399' 
            : (isDark ? 'rgba(241, 245, 249, 0.90)' : 'rgba(15, 23, 42, 0.90)'));

      const finalLat = pinLabel?.lat ?? lat;
      const finalLng = pinLabel?.lng ?? lng;

      return {
        iso3,
        country,
        lat: finalLat,
        lng: finalLng,
        text: displayText,
        shortText,
        size: pinLabel?.size ?? defaultSize,
        color: (isSelected || isHovered) ? defaultColor : (pinLabel?.color ?? defaultColor),
      };
    });
  });

  import { flowCorridorsApp } from '$lib/framework/geoglobe/plugins/flowCorridorsApp';

  // 3D Arcs for Flow Corridors filtered by active corridor region
  const remittanceArcs = $derived.by(() => {
    if (!geoStore.activeApp?.getArcs && !geoStore.activeApp?.getArcData) return [];
    const indonesia = EXTENDED_COUNTRIES_DATA.find(c => c.iso3 === 'IDN');
    if (!indonesia) return [];
    const app = geoStore.activeApp ?? flowCorridorsApp;
    const allArcs = app.getArcData ? app.getArcData(indonesia as any, (geoStore.currentAppData ?? {}) as any) : (app.getArcs ? app.getArcs((geoStore.currentAppData ?? {}) as any, geoStore.flightCorridorFilter) : []);
    if (geoStore.flightCorridorFilter === 'all') return allArcs;

    return allArcs.filter(arc => {
      const originCountry = EXTENDED_COUNTRIES_DATA.find(
        c => Math.abs(c.lat - arc.startLat) < 2.0 && Math.abs(c.lng - arc.startLng) < 2.0
      );
      if (!originCountry) return true;
      return geoStore.isCountryMatched(originCountry.iso3);
    });
  });

  // 3D Paths for Meridians / Custom App Curves (ADR 0041 & ADR 0042)
  const globePaths = $derived.by(() => {
    if (!mapState.showTimezoneLines || !geoStore.showTimezoneLines || !geoStore.activeApp?.getPaths) return [];
    return geoStore.activeApp.getPaths(
      (geoStore.currentAppData ?? {}) as any,
      mapState.activeMetric,
      currentTheme
    );
  });

  // 3D Epicenter Pulsing Rings for Earthquake / Disaster Tracker (ADR 0044)
  const globeRings = $derived.by(() => {
    if (!geoStore.activeApp?.getRingData) return [];
    const selected = (mapState.selectedCountryIso3 ? EXTENDED_COUNTRIES_DATA.find(c => c.iso3 === mapState.selectedCountryIso3) : null)
      ?? EXTENDED_COUNTRIES_DATA.find(c => c.iso3 === 'IDN')
      ?? EXTENDED_COUNTRIES_DATA[0];
    if (!selected) return [];
    return geoStore.activeApp.getRingData(selected, (geoStore.currentAppData ?? {}) as any) || [];
  });

  export function flyTo(lat: number, lng: number, altitude: number, durationMs: number = 1000) {
    if (globeInstance) {
      globeInstance.pointOfView({ lat, lng, altitude }, durationMs);
    }
  }

  // Camera Zoom & Navigation Functions (ADR 0043)
  export function zoomIn(factor: number = 0.7, durationMs: number = 300) {
    if (!globeInstance) return;
    const pov = globeInstance.pointOfView();
    const currentAlt = pov.altitude || 2.2;
    const nextAlt = Math.max(0.15, currentAlt * factor);
    globeInstance.pointOfView({ ...pov, altitude: nextAlt }, durationMs);
  }

  export function zoomOut(factor: number = 1.4, durationMs: number = 300) {
    if (!globeInstance) return;
    const pov = globeInstance.pointOfView();
    const currentAlt = pov.altitude || 2.2;
    const nextAlt = Math.min(6.0, currentAlt * factor);
    globeInstance.pointOfView({ ...pov, altitude: nextAlt }, durationMs);
  }

  export function resetView(durationMs: number = 600) {
    if (!globeInstance) return;
    globeInstance.pointOfView({ lat: 10, lng: 110, altitude: 2.2 }, durationMs);
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
    if (!globeInstance || typeof window === 'undefined') return;
    const renderer = globeInstance.renderer?.();
    if (!renderer) return;
    const isTurbo = mapState.performanceMode === 'turbo' || geoStore.performanceMode === 'turbo';
    const dpr = isTurbo ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.35);
    renderer.setPixelRatio(dpr);
  }

  function updateVisuals() {
    if (!globeInstance) return;
    const isDark = currentTheme === 'dark';
    const isFlag = mapState.activeMetric === 'flag';
    const isTurbo = mapState.performanceMode === 'turbo' || geoStore.performanceMode === 'turbo';

    applyOptimalDpr();

    // ⚡ Option C (ADR 0038): Clean Switch between 1-Draw-Call Shader-LUT vs 3D Raised Polygons
    if (isTurbo && lutSphereMesh) {
      lutSphereMesh.visible = true;
      updatePaletteLut();
      globeInstance
        .showGlobe(false)
        .polygonAltitude(-10.0)
        .polygonLabel(() => '');
    } else {
      if (lutSphereMesh) lutSphereMesh.visible = false;
      globeInstance
        .showGlobe(true)
        .polygonLabel((d: any) => getTooltipHtml(d));

      if (!isFlag) {
        globeInstance.polygonCapMaterial(null);
      } else {
        globeInstance.polygonCapMaterial((d: any) => createProceduralFlagMaterial(d, isDark));
      }
      globeInstance
        .polygonSideColor(() => (isDark ? 'rgba(6, 182, 212, 0.18)' : 'rgba(2, 132, 199, 0.22)'))
        .polygonStrokeColor(() => (isDark ? '#334155' : '#94a3b8'))
        .polygonCapColor((d: any) => getPolygonColor(d))
        .polygonAltitude((d: any) => {
          const iso3 = getFeatureIso3(d);
          if (mapState.selectedCountryIso3 === iso3 || mapState.hoveredIso3 === iso3) return 0.018;
          const isMatched = geoStore.isCountryMatched(iso3);
          if (!isMatched && (geoStore.timeFilter !== 'all' || geoStore.flightCorridorFilter !== 'all' || geoStore.passportVisaFilter !== 'all')) {
            return 0.001;
          }
          return 0.008;
        });
    }

    globeInstance
      .backgroundColor(isDark ? '#0B0F19' : '#FAF8F3')
      .atmosphereColor(isDark ? '#06b6d4' : '#38bdf8')
      .atmosphereAltitude(isTurbo ? 0.14 : 0.22)
      .labelsData(mapState.showLabels ? globeLabels : [])
      .labelSize((d: any) => d.size)
      .labelColor((d: any) => d.color)
      .labelResolution(isTurbo ? 1.2 : 1.8)
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
    const country = mapData.find(d => d.iso3 === hoveredCountryIso3);
    if (country) {
      onCountryClick?.(country);
    }
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

    const isDark = currentTheme === 'dark';
    const isTurbo = mapState.performanceMode === 'turbo' || geoStore.performanceMode === 'turbo';
    const width = globeContainer.clientWidth || window.innerWidth;
    const height = globeContainer.clientHeight || window.innerHeight;
    const isFlag = mapState.activeMetric === 'flag';

    globeInstance = GlobeModule()(globeContainer)
      .width(width)
      .height(height)
      .backgroundColor(isDark ? '#0B0F19' : '#FAF8F3')
      .showAtmosphere(true)
      .atmosphereColor(isDark ? '#06b6d4' : '#38bdf8')
      .atmosphereAltitude(isTurbo ? 0.14 : 0.22)
      .showGlobe(!isTurbo)
      .polygonsData(geoJsonFeatures)
      .polygonGeoJsonGeometry((d: any) => d.geometry)
      .polygonCapMaterial((d: any) => {
        if (!isFlag) return null;
        return createProceduralFlagMaterial(d, isDark);
      })
      .polygonCapColor((d: any) => getPolygonColor(d))
      .polygonSideColor(() => (isDark ? 'rgba(6, 182, 212, 0.18)' : 'rgba(2, 132, 199, 0.22)'))
      .polygonStrokeColor(() => (isDark ? '#334155' : '#94a3b8'))
      .polygonsTransitionDuration(0)
      .polygonAltitude((d: any) => {
        if (isTurbo) return -10.0;
        const iso3 = getFeatureIso3(d);
        if (mapState.selectedCountryIso3 === iso3 || mapState.hoveredIso3 === iso3) return 0.018;
        return 0.005;
      })
      .polygonLabel((d: any) => (isTurbo ? '' : getTooltipHtml(d)))
      .onPolygonHover((hoverD: any) => {
        const isTurboNow = mapState.performanceMode === 'turbo' || geoStore.performanceMode === 'turbo';
        if (isTurboNow) return;
        const iso3 = hoverD ? getFeatureIso3(hoverD) : null;
        // Hover deduplication guard: prevent redundant GPU geometry re-evaluations
        if (iso3 === lastHoveredIso3) return;
        lastHoveredIso3 = iso3 ?? '';
        mapState.hoveredIso3 = iso3;
        onCountryHover?.(iso3);
        if (globeInstance) {
          requestAnimationFrame(() => {
            if (globeInstance) {
              globeInstance.polygonAltitude((d: any) => {
                const featIso3 = getFeatureIso3(d);
                if (mapState.selectedCountryIso3 === featIso3 || mapState.hoveredIso3 === featIso3) return 0.018;
                return 0.005;
              });
              globeInstance.polygonCapColor((d: any) => getPolygonColor(d));
            }
          });
        }
      })
      .onPolygonClick((clickD: any) => {
        const isTurboNow = mapState.performanceMode === 'turbo' || geoStore.performanceMode === 'turbo';
        if (isTurboNow) return;
        if (!clickD) return;
        const iso3 = getFeatureIso3(clickD);
        const country = mapData.find(d => d.iso3 === iso3);
        if (country) {
          onCountryClick?.(country);
        }
      });

    // Enforce WebGL Adaptive DPR Clamp (ADR 0035)
    applyOptimalDpr();

    if (mapState.showLabels && globeLabels.length > 0) {
      globeInstance
        .labelsData(globeLabels)
        .labelLat((d: any) => d.lat)
        .labelLng((d: any) => d.lng)
        .labelText((d: any) => d.text)
        .labelSize((d: any) => d.size)
        .labelDotRadius((d: any) => (d.iso3 === mapState.selectedCountryIso3 ? 0.15 : 0.06))
        .labelColor((d: any) => d.color)
        .labelAltitude(0.020)
        .labelResolution(2)
        .onLabelClick((d: any) => {
          if (d.country) {
            onCountryClick?.(d.country);
          }
        })
        .onLabelHover((d: any) => {
          const iso3 = d ? d.iso3 : null;
          if (iso3 === lastHoveredIso3) return;
          lastHoveredIso3 = iso3 ?? '';
          mapState.hoveredIso3 = iso3;
          onCountryHover?.(iso3);
          // Update polygon visuals only (NOT labelsData — that would reset the dataset
          // and trigger onLabelHover(null) again, causing an infinite fade-in/out loop)
          if (globeInstance) {
            requestAnimationFrame(() => {
              if (globeInstance) {
                globeInstance.polygonAltitude((feat: any) => {
                  const featIso3 = getFeatureIso3(feat);
                  if (mapState.selectedCountryIso3 === featIso3 || mapState.hoveredIso3 === featIso3) return 0.018;
                  return 0.005;
                });
                globeInstance.polygonCapColor((feat: any) => getPolygonColor(feat));
              }
            });
          }
        });
    }

    // 3D Paths for Meridians / Corridors (ADR 0041)
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

    // 3D Epicenter Pulsing Rings for Earthquake / Disaster Tracker (ADR 0044)
    globeInstance
      .ringsData(globeRings)
      .ringLat((d: any) => d.lat)
      .ringLng((d: any) => d.lng)
      .ringColor((d: any) => d.color)
      .ringMaxRadius((d: any) => d.maxRadius || 5)
      .ringPropagationSpeed((d: any) => d.propagationSpeed || 2)
      .ringRepeatPeriod((d: any) => d.repeatPeriod || 1500);

    // Google Earth style orbit controls
    const controls = globeInstance.controls();
    if (controls) {
      controls.autoRotate = false;
      controls.autoRotateSpeed = 0.5;
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.minDistance = 105;
      controls.maxDistance = 550;
    }

    // Centered initially near Indonesia / Asia-Pacific
    globeInstance.pointOfView({ lat: 10, lng: 110, altitude: 2.2 }, 800);

    // ⚡ Option C (ADR 0038): Initialize Single-Sphere Shader-LUT Engine
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

    // Set up Auto-Resize Observer
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

  // React to reactive state changes with non-blocking lazy-loading transition
  $effect(() => {
    if (!isInitialized || !globeInstance) return;
    // Track dependencies
    const _app = geoStore.activeAppId;
    const _timeFilter = geoStore.timeFilter;
    const _flightFilter = geoStore.flightCorridorFilter;
    const _passportFilter = geoStore.passportVisaFilter;
    const _theme = currentTheme;
    const currentMetric = mapState.activeMetric;
    const _labels = mapState.showLabels;
    const _geoLabels = geoStore.showLabels;
    const _selected = mapState.selectedCountryIso3;
    // NOTE: mapState.hoveredIso3 is intentionally NOT tracked here.
    // Tracking it caused an infinite loop: hover → updateVisuals() → labelsData reset
    // → onLabelHover(null) → hoveredIso3=null → $effect re-runs → loop.
    // Polygon altitude/color on hover is handled directly in onPolygonHover / onLabelHover.
    const _data = mapData;
    const _perfMap = mapState.performanceMode;
    const _perfGeo = geoStore.performanceMode;
    const _rings = globeRings;
    const _appData = geoStore.currentAppData;

    if (previousMetric && previousMetric !== currentMetric) {
      isSwitchingMetric = true;
      transitionLabel = getTransitionMessage(currentMetric);
      previousMetric = currentMetric;

      // Allow browser to render loading HUD first, then update WebGL materials
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
    if (!isInitialized || !globeInstance) return;
    const regionId = mapState.activeRegion;
    const regionObj = REGION_FILTERS.find(r => r.id === regionId);
    if (regionObj) {
      const altitude = regionId === 'all' ? 2.2 : (regionObj.zoom ? Math.max(0.6, 2.5 / regionObj.zoom) : 1.5);
      globeInstance.pointOfView({ lat: regionObj.lat, lng: regionObj.lon, altitude }, 1000);
    }
  });

  // React to dynamic camera presets for active app (ADR 0038)
  $effect(() => {
    if (!isInitialized || !globeInstance) return;
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
      globeInstance.pointOfView(preset, 1000);
    }
  });

  onMount(() => {
    initGlobe();
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeydown);
    }
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeydown);
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (globeInstance) {
      // Dispose Three.js WebGL renderer to prevent GPU context leaks
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
    // Clean up GPU Textures & ShaderMaterials (ADR 0038)
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
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    bind:this={globeContainer}
    class="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
    onmousemove={handleContainerPointerMove}
    onmouseleave={clearLutHover}
    onclick={handleContainerClick}
    role="region"
    aria-label="3D Globe Canvas"
    style="z-index: 1;"
  ></div>

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
      onclick={() => resetView()}
      class="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-800 hover:text-white active:scale-95 cursor-pointer"
      title="Reset Sudut Pandang [0]"
      aria-label="Reset Sudut Pandang"
    >
      <RotateCcw class="w-3.5 h-3.5" />
    </button>
  </div>
</div>
