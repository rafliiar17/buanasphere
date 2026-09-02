<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { MapStateStore } from '../mapState.svelte';
  import type { MapCountryData } from '../map-constants';
  import { REGION_FILTERS } from '../map-constants';
  import { getCountryFlagColor } from '../country-flag-colors';
  import { createProceduralFlagMaterial, disposeProceduralFlagCache } from '../procedural-flags';
  import { formatRupiah, formatPercent } from '$lib/formatters/currency';
  import { t } from '$lib/i18n';
  import type { Theme } from '$lib/theme';

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

  function getPolygonColor(feat: any): string {
    const isDark = currentTheme === 'dark';
    const iso3 = getFeatureIso3(feat);
    const country = mapData.find(d => d.iso3 === iso3);
    const isSelected = mapState.selectedCountryIso3 === iso3;
    const isHovered = mapState.hoveredIso3 === iso3;

    if (isSelected) {
      return '#38bdf8'; // Glowing sky blue highlight
    }
    if (isHovered) {
      return '#34d399'; // Emerald hover
    }

    if (!country) {
      return isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(226, 232, 240, 0.7)';
    }

    if (mapState.activeMetric === 'rate') {
      const r = country.middleRate;
      if (r > 20000) return isDark ? 'rgba(99, 102, 241, 0.75)' : 'rgba(79, 70, 229, 0.75)';
      if (r > 14000) return isDark ? 'rgba(59, 130, 246, 0.75)' : 'rgba(37, 99, 235, 0.75)';
      if (r > 10000) return isDark ? 'rgba(6, 182, 212, 0.75)' : 'rgba(8, 145, 178, 0.75)';
      if (r > 2000)  return isDark ? 'rgba(16, 185, 129, 0.75)' : 'rgba(5, 150, 105, 0.75)';
      if (r > 500)   return isDark ? 'rgba(20, 184, 166, 0.7)' : 'rgba(13, 148, 136, 0.7)';
      return isDark ? 'rgba(15, 118, 110, 0.65)' : 'rgba(45, 212, 191, 0.65)';
    } else if (mapState.activeMetric === 'change') {
      const chg = country.change24h;
      if (chg > 0.25) return isDark ? 'rgba(16, 185, 129, 0.85)' : 'rgba(5, 150, 105, 0.85)';
      if (chg > 0.05) return isDark ? 'rgba(52, 211, 153, 0.75)' : 'rgba(16, 185, 129, 0.75)';
      if (chg < -0.25) return isDark ? 'rgba(239, 68, 68, 0.85)' : 'rgba(220, 38, 38, 0.85)';
      if (chg < -0.05) return isDark ? 'rgba(248, 113, 113, 0.75)' : 'rgba(239, 68, 68, 0.75)';
      return isDark ? 'rgba(51, 65, 85, 0.65)' : 'rgba(203, 213, 225, 0.75)';
    } else {
      return getCountryFlagColor(iso3, isDark);
    }
  }

  function getTooltipHtml(feat: any): string {
    const isDark = currentTheme === 'dark';
    const iso3 = getFeatureIso3(feat);
    const iso2 = getFeatureIso2(feat);
    const country = mapData.find(d => d.iso3 === iso3);
    const name = country?.countryName || feat.properties?.NAME || feat.properties?.ADMIN || iso3;
    const code = country?.currencyCode || '';
    const currName = country?.currencyName || '';
    const midFormatted = country ? formatRupiah(country.middleRate) : '-';
    const buyFormatted = country ? formatRupiah(country.buyRate) : '-';
    const sellFormatted = country ? formatRupiah(country.sellRate) : '-';
    const chgFormatted = country ? formatPercent(country.change24h) : '0.00%';
    const chgColor = country && country.change24h >= 0 ? '#10b981' : '#ef4444';

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

      const displayText = `${rawName} (${curr || iso3})`;

      return {
        iso3,
        country,
        lat,
        lng,
        text: displayText,
        shortText: curr || iso3,
        size: isSelected ? 0.65 : (isHovered ? 0.52 : (isMajor ? 0.36 : 0.28)),
        color: isSelected 
          ? '#38bdf8' 
          : (isHovered 
              ? '#34d399' 
              : (isDark ? 'rgba(241, 245, 249, 0.90)' : 'rgba(15, 23, 42, 0.90)')),
      };
    });
  });

  export function flyTo(lat: number, lng: number, altitude: number, durationMs: number = 1000) {
    if (globeInstance) {
      globeInstance.pointOfView({ lat, lng, altitude }, durationMs);
    }
  }

  export function updateVisuals() {
    if (!globeInstance) return;
    const isDark = currentTheme === 'dark';
    globeInstance
      .backgroundColor(isDark ? '#0B0F19' : '#FAF8F3')
      .atmosphereColor(isDark ? '#06b6d4' : '#38bdf8')
      .polygonCapMaterial((d: any) => {
        if (mapState.activeMetric !== 'flag') return null;
        return createProceduralFlagMaterial(d, isDark);
      })
      .polygonCapColor((d: any) => getPolygonColor(d))
      .polygonAltitude((d: any) => {
        const iso3 = getFeatureIso3(d);
        if (mapState.selectedCountryIso3 === iso3 || mapState.hoveredIso3 === iso3) return 0.018;
        return 0.005;
      })
      .polygonsData([...geoJsonFeatures])
      .labelsData(mapState.showLabels ? globeLabels : [])
      .labelSize((d: any) => d.size)
      .labelColor((d: any) => d.color);
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
    const width = globeContainer.clientWidth || window.innerWidth;
    const height = globeContainer.clientHeight || window.innerHeight;

    globeInstance = GlobeModule()(globeContainer)
      .width(width)
      .height(height)
      .backgroundColor(isDark ? '#0B0F19' : '#FAF8F3')
      .showAtmosphere(true)
      .atmosphereColor(isDark ? '#06b6d4' : '#38bdf8')
      .atmosphereAltitude(0.22)
      .polygonsData(geoJsonFeatures)
      .polygonGeoJsonGeometry((d: any) => d.geometry)
      .polygonCapMaterial((d: any) => {
        if (mapState.activeMetric !== 'flag') return null;
        return createProceduralFlagMaterial(d, isDark);
      })
      .polygonCapColor((d: any) => getPolygonColor(d))
      .polygonSideColor(() => (isDark ? 'rgba(6, 182, 212, 0.18)' : 'rgba(2, 132, 199, 0.22)'))
      .polygonStrokeColor(() => (isDark ? '#334155' : '#94a3b8'))
      .polygonsTransitionDuration(0)
      .polygonAltitude((d: any) => {
        const iso3 = getFeatureIso3(d);
        if (mapState.selectedCountryIso3 === iso3 || mapState.hoveredIso3 === iso3) return 0.018;
        return 0.005;
      })
      .polygonLabel((d: any) => getTooltipHtml(d))
      .onPolygonHover((hoverD: any) => {
        const iso3 = hoverD ? getFeatureIso3(hoverD) : null;
        // Hover deduplication guard: prevent redundant GPU geometry re-evaluations
        if (iso3 === lastHoveredIso3) return;
        lastHoveredIso3 = iso3 ?? '';
        mapState.hoveredIso3 = iso3;
        onCountryHover?.(iso3);
        if (globeInstance) {
          globeInstance.polygonAltitude((d: any) => {
            const featIso3 = getFeatureIso3(d);
            if (mapState.selectedCountryIso3 === featIso3 || mapState.hoveredIso3 === featIso3) return 0.018;
            return 0.005;
          });
          globeInstance.polygonCapColor((d: any) => getPolygonColor(d));
        }
      })
      .onPolygonClick((clickD: any) => {
        if (!clickD) return;
        const iso3 = getFeatureIso3(clickD);
        const country = mapData.find(d => d.iso3 === iso3);
        if (country) {
          onCountryClick?.(country);
        }
      });

    // Enforce WebGL DPR Clamp (max 1.5) to prevent GPU fragment overload on HiDPI / 4K
    const renderer = globeInstance.renderer?.();
    if (renderer && typeof window !== 'undefined') {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      renderer.setPixelRatio(dpr);
    }

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
          updateVisuals();
        });
    }

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

  // React to reactive state changes
  $effect(() => {
    if (!isInitialized || !globeInstance) return;
    // Track dependencies
    const _theme = currentTheme;
    const _metric = mapState.activeMetric;
    const _labels = mapState.showLabels;
    const _selected = mapState.selectedCountryIso3;
    const _hovered = mapState.hoveredIso3;
    updateVisuals();
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

  onMount(() => {
    initGlobe();
  });

  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (globeInstance) {
      try {
        globeInstance._destructor?.();
      } catch {}
      globeInstance = null;
    }
    if (globeContainer) {
      globeContainer.innerHTML = '';
    }
    // Clean up GPU Textures & ShaderMaterials
    disposeProceduralFlagCache();
  });
</script>

<div
  bind:this={globeContainer}
  class="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
  style="z-index: 1;"
></div>
