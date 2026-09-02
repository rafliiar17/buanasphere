<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { 
    Globe, 
    TrendingUp, 
    TrendingDown, 
    Sparkles, 
    ArrowRightLeft, 
    RotateCcw, 
    Check, 
    Info, 
    Coins, 
    Layers, 
    ShieldCheck, 
    ExternalLink,
    Building2,
    Calculator,
    Search,
    Compass,
    Activity,
    ArrowUpRight,
    Landmark,
    Maximize2,
    X,
    ChevronRight,
    MapPin,
    BarChart3,
    Clock,
    SlidersHorizontal,
    ChevronDown,
    ChevronUp,
    Flag
  } from 'lucide-svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import MapSkeleton from '$lib/components/skeletons/MapSkeleton.svelte';
  import GoogleRateChart from '../chart/GoogleRateChart.svelte';
  import { apiClient, SUPPORTED_CURRENCIES } from '$lib/api/client';
  import type { RateItem, RateMatrixResponse } from '$lib/api/types';
  import { formatRupiah, formatPercent, formatDateTimeIndo, formatCurrency } from '$lib/formatters/currency';
  import { t } from '$lib/i18n';
  import { getTheme, subscribeTheme, type Theme } from '$lib/theme';
  import { 
    type MetricType, 
    type RegionId, 
    type RegionFilter, 
    type MapCountryData, 
    REGION_FILTERS, 
    COUNTRY_CURRENCY_MAP,
    PRESET_AMOUNTS 
  } from './map-constants';

  // Component Props (Svelte 5 Runes)
  interface Props {
    onSelectCurrency?: (currencyCode: string) => void;
    class?: string;
  }

  let { onSelectCurrency, class: className = '' }: Props = $props();

  // Svelte 5 States
  let projectionMode = $state<'globe' | 'flat'>('globe');
  let activeMetric = $state<MetricType>('rate');
  let activeRegion = $state<RegionId>('all');
  let selectedCurrencyCode = $state<string>('USD');
  let selectedCountryIso3 = $state<string>('USA');
  let isInspectorOpen = $state(false);
  let isSearchDropdownOpen = $state(false);
  let isControlsCollapsed = $state(false);
  let searchQuery = $state('');
  let highlightedIndex = $state(0);
  let isLoading = $state(true);
  let liveRates = $state<RateItem[]>([]);
  let bankMatrix = $state<RateMatrixResponse | null>(null);
  let isMatrixLoading = $state(false);
  let hoveredIso3 = $state<string | null>(null);
  let showLabels = $state(true);

  // Quick Convert Mini State
  let convertAmount = $state<number>(100);
  let convertDirection = $state<'foreign_to_idr' | 'idr_to_foreign'>('foreign_to_idr');

  let currentTheme = $state<Theme>(getTheme());
  let globeContainer = $state<HTMLDivElement | null>(null);
  let flatMapContainer = $state<HTMLDivElement | null>(null);
  let searchInputRef = $state<HTMLInputElement | null>(null);
  let searchContainerRef = $state<HTMLDivElement | null>(null);
  let regionContainerRef = $state<HTMLDivElement | null>(null);
  let isRegionDropdownOpen = $state<boolean>(false);

  let globeInstance: any = null;
  let plotlyModule: any = null;
  let GlobeModule: any = null;
  let geoJsonFeatures: any[] = [];
  let resizeObserver: ResizeObserver | null = null;

  // Three.js Texture Loader & Flag Material Cache
  const textureLoader = new THREE.TextureLoader();
  const flagMaterialsCache = new Map<string, THREE.Material>();

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

  // Helper to extract ISO3 from geojson feature
  function getFeatureIso3(feat: any): string {
    if (!feat || !feat.properties) return '';
    const p = feat.properties;
    const code = p.ISO_A3 || p.ADM0_A3 || p.SOV_A3 || p.adm0_a3 || p.iso_a3 || '';
    if (code === '-99' || !code) {
      return p.ADM0_A3 || p.SOV_A3 || p.GU_A3 || p.BRK_A3 || '';
    }
    return code;
  }

  // Helper to extract ISO2 code for FlagCDN
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

  // Generate Flag Material with FlagCDN Texture for Country Polygons
  function getFlagMaterial(iso2: string): THREE.Material {
    const key = iso2.toLowerCase();
    if (flagMaterialsCache.has(key)) {
      return flagMaterialsCache.get(key)!;
    }
    const url = `https://flagcdn.com/w320/${key}.png`;
    const texture = textureLoader.load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const mat = new THREE.MeshLambertMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: false,
    });
    flagMaterialsCache.set(key, mat);
    return mat;
  }

  // Derived country map records combining API live rates & fallback
  const mapData = $derived.by<MapCountryData[]>(() => {
    return COUNTRY_CURRENCY_MAP.map(item => {
      const live = liveRates.find(r => r.targetCurrency === item.currencyCode);
      const buyRate = live?.buyRate ?? item.defaultRate.buy;
      const sellRate = live?.sellRate ?? item.defaultRate.sell;
      const middleRate = live?.middleRate ?? item.defaultRate.mid;
      const spread = live?.spread ?? (sellRate - buyRate);
      const spreadPercent = live?.spreadPercent ?? ((spread / (middleRate || 1)) * 100);
      const change24h = live?.change24h ?? item.defaultRate.change;

      return {
        iso3: item.iso3,
        countryName: item.countryName,
        currencyCode: item.currencyCode,
        currencyName: item.currencyName,
        flag: item.flag,
        regionId: item.regionId,
        regionLabel: item.regionLabel,
        buyRate,
        sellRate,
        middleRate,
        spread,
        spreadPercent,
        change24h,
      };
    });
  });

  // Country 3D Pin Labels with Compact Cartographic Scaling (Prevents crowding in dense regions like Europe)
  const globeLabels = $derived.by(() => {
    if (!geoJsonFeatures || geoJsonFeatures.length === 0 || !showLabels) return [];
    const isDark = currentTheme === 'dark';

    // Concise name aliases for dense clusters (e.g. Europe & Balkans)
    const conciseNames: Record<string, string> = {
      BIH: 'Bosnia',
      MKD: 'Makedonia',
      LUX: 'Luksemburg',
      MNE: 'Montenegro',
      MDA: 'Moldova',
      SVN: 'Slovenia',
      SVK: 'Slowakia',
      CZE: 'Ceko',
      AUT: 'Austria',
      CHE: 'Swiss',
      BEL: 'Belgia',
      NLD: 'Belanda',
      PRT: 'Portugal',
      HRV: 'Kroasia',
      CYP: 'Siprus',
      ARE: 'UEA',
      DOM: 'Dominika',
      TTO: 'Trinidad',
    };

    return geoJsonFeatures.map((feat: any) => {
      const p = feat.properties;
      const iso3 = getFeatureIso3(feat);
      const country = mapData.find(d => d.iso3 === iso3);
      const rawName = country?.countryName || p.NAME || p.ADMIN || iso3;
      const shortName = conciseNames[iso3] || rawName;
      const curr = country?.currencyCode || '';
      const lat = Number(p.LABEL_Y) || 0;
      const lng = Number(p.LABEL_X) || 0;
      const isSelected = selectedCountryIso3 === iso3;
      const isHovered = hoveredIso3 === iso3;
      const isMajor = ['IDN', 'USA', 'JPN', 'CHN', 'GBR', 'DEU', 'FRA', 'SGP', 'AUS', 'SAU', 'MYS', 'THA', 'IND', 'BRA', 'ZAF', 'KOR', 'CAN', 'RUS', 'ITA', 'ESP', 'TUR', 'EGY', 'ARE'].includes(iso3);

      // Compact display: short name by default, full name + currency code when hovered or selected
      const displayText = isSelected || isHovered 
        ? `${rawName} (${curr})` 
        : shortName;

      return {
        iso3,
        country,
        lat,
        lng,
        text: displayText,
        shortText: curr || iso3,
        size: isSelected ? 0.72 : (isHovered ? 0.58 : (isMajor ? 0.40 : 0.30)),
        color: isSelected 
          ? '#38bdf8' 
          : (isHovered 
              ? '#34d399' 
              : (isDark ? 'rgba(241, 245, 249, 0.88)' : 'rgba(15, 23, 42, 0.88)')),
      };
    });
  });

  // Autocomplete search suggestions with live reactive filtering
  const searchResults = $derived.by<MapCountryData[]>(() => {
    const raw = searchQuery.trim().toLowerCase();
    if (!raw) {
      return mapData.slice(0, 8);
    }
    return mapData.filter(d => 
      d.countryName.toLowerCase().includes(raw) ||
      d.currencyCode.toLowerCase().includes(raw) ||
      d.currencyName.toLowerCase().includes(raw) ||
      d.iso3.toLowerCase().includes(raw) ||
      d.regionLabel.toLowerCase().includes(raw)
    );
  });

  // Active Region Filter Object
  const currentRegionObj = $derived.by(() => {
    return REGION_FILTERS.find(r => r.id === activeRegion) || REGION_FILTERS[0];
  });

  // Selected Country details
  const selectedCountry = $derived.by<MapCountryData>(() => {
    if (selectedCountryIso3) {
      const byIso = mapData.find(d => d.iso3 === selectedCountryIso3);
      if (byIso) return byIso;
    }
    const found = mapData.find(d => d.currencyCode === selectedCurrencyCode);
    return found || mapData[0];
  });

  // Quick converted result
  const calculatedConvertResult = $derived.by<{ value: number; formatted: string }>(() => {
    if (!selectedCountry) return { value: 0, formatted: '0' };
    const amt = Number(convertAmount) || 0;
    if (convertDirection === 'foreign_to_idr') {
      const val = amt * selectedCountry.middleRate;
      return { value: val, formatted: formatRupiah(val, { showFraction: true }) };
    } else {
      const val = selectedCountry.middleRate > 0 ? amt / selectedCountry.middleRate : 0;
      return { 
        value: val, 
        formatted: `${formatCurrency(val, selectedCountry.currencyCode, { maxDecimals: 4 })} ${selectedCountry.currencyCode}` 
      };
    }
  });

  // Color generator for 3D Globe polygons (used in 'rate' and 'change' modes)
  function getPolygonColor(feat: any): string {
    const isDark = currentTheme === 'dark';
    const iso3 = getFeatureIso3(feat);
    const country = mapData.find(d => d.iso3 === iso3);
    const isSelected = selectedCountryIso3 === iso3;
    const isHovered = hoveredIso3 === iso3;

    if (isSelected) {
      return '#38bdf8'; // Bright sky blue glowing highlight
    }
    if (isHovered) {
      return '#34d399'; // Bright emerald hover
    }

    if (!country) {
      return isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(226, 232, 240, 0.7)';
    }

    if (activeMetric === 'rate') {
      const r = country.middleRate;
      if (r > 20000) return isDark ? 'rgba(99, 102, 241, 0.75)' : 'rgba(79, 70, 229, 0.75)'; // Indigo
      if (r > 14000) return isDark ? 'rgba(59, 130, 246, 0.75)' : 'rgba(37, 99, 235, 0.75)'; // Blue
      if (r > 10000) return isDark ? 'rgba(6, 182, 212, 0.75)' : 'rgba(8, 145, 178, 0.75)'; // Cyan
      if (r > 2000)  return isDark ? 'rgba(16, 185, 129, 0.75)' : 'rgba(5, 150, 105, 0.75)'; // Emerald
      if (r > 500)   return isDark ? 'rgba(20, 184, 166, 0.7)' : 'rgba(13, 148, 136, 0.7)'; // Teal
      return isDark ? 'rgba(15, 118, 110, 0.65)' : 'rgba(45, 212, 191, 0.65)';
    } else if (activeMetric === 'change') {
      const chg = country.change24h;
      if (chg > 0.25) return isDark ? 'rgba(16, 185, 129, 0.85)' : 'rgba(5, 150, 105, 0.85)';
      if (chg > 0.05) return isDark ? 'rgba(52, 211, 153, 0.75)' : 'rgba(16, 185, 129, 0.75)';
      if (chg < -0.25) return isDark ? 'rgba(239, 68, 68, 0.85)' : 'rgba(220, 38, 38, 0.85)';
      if (chg < -0.05) return isDark ? 'rgba(248, 113, 113, 0.75)' : 'rgba(239, 68, 68, 0.75)';
      return isDark ? 'rgba(51, 65, 85, 0.65)' : 'rgba(203, 213, 225, 0.75)';
    } else {
      // In Flag / Political mode: distinct sovereign country colors
      const palette = isDark ? [
        'rgba(225, 29, 72, 0.80)',   // Rose
        'rgba(37, 99, 235, 0.80)',   // Royal Blue
        'rgba(5, 150, 105, 0.80)',   // Emerald
        'rgba(217, 119, 6, 0.80)',   // Amber
        'rgba(147, 51, 234, 0.80)',  // Purple
        'rgba(6, 182, 212, 0.80)',   // Cyan
        'rgba(234, 88, 12, 0.80)',   // Orange
        'rgba(13, 148, 136, 0.80)',  // Teal
        'rgba(79, 70, 229, 0.80)',   // Indigo
        'rgba(22, 163, 74, 0.80)',   // Green
      ] : [
        'rgba(244, 63, 94, 0.75)',   // Rose
        'rgba(59, 130, 246, 0.75)',  // Blue
        'rgba(16, 185, 129, 0.75)',  // Emerald
        'rgba(245, 158, 11, 0.75)',  // Amber
        'rgba(168, 85, 247, 0.75)',  // Purple
        'rgba(14, 165, 233, 0.75)',  // Sky
        'rgba(249, 115, 22, 0.75)',  // Orange
        'rgba(20, 184, 166, 0.75)',  // Teal
        'rgba(99, 102, 241, 0.75)',  // Indigo
        'rgba(34, 197, 94, 0.75)',   // Green
      ];
      let hash = 0;
      for (let i = 0; i < iso3.length; i++) {
        hash = (hash * 31 + iso3.charCodeAt(i)) & 0xffffffff;
      }
      return palette[Math.abs(hash) % palette.length];
    }
  }

  function getTooltipHtml(feat: any): string {
    const isDark = currentTheme === 'dark';
    const iso3 = getFeatureIso3(feat);
    const iso2 = getFeatureIso2(feat);
    const country = mapData.find(d => d.iso3 === iso3);
    const name = country?.countryName || feat.properties?.NAME || feat.properties?.ADMIN || iso3;
    const flag = country?.flag || '🌐';
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

  // Fetch bank matrix quotes for inspector
  async function loadBankMatrixForSelectedCurrency(code: string) {
    if (!code || code === 'IDR') {
      bankMatrix = null;
      return;
    }
    isMatrixLoading = true;
    try {
      bankMatrix = await apiClient.getRateMatrix(code);
    } catch (err) {
      console.error('Error fetching bank matrix for currency:', code, err);
    } finally {
      isMatrixLoading = false;
    }
  }

  // Load GeoJSON and dependencies
  async function loadDataAndInit() {
    isLoading = true;
    try {
      const [rates, geoRes, globePkg, plotlyPkg] = await Promise.all([
        apiClient.getLiveRates('IDR'),
        fetch('/data/world-countries.geojson').then(r => r.json()),
        import('globe.gl'),
        import('plotly.js-dist-min'),
      ]);

      liveRates = rates;
      geoJsonFeatures = geoRes?.features || [];
      GlobeModule = globePkg.default || globePkg;
      plotlyModule = plotlyPkg.default || plotlyPkg;
    } catch (err) {
      console.error('Error loading 3D Globe dependencies:', err);
    } finally {
      isLoading = false;
      setTimeout(() => {
        if (projectionMode === 'globe') {
          initGlobeGl();
        } else {
          initPlotlyFlat();
        }
        loadBankMatrixForSelectedCurrency(selectedCurrencyCode);
      }, 60);
    }
  }

  // Initialize True WebGL 3D Globe (Google Earth Style with OrbitControls)
  function initGlobeGl() {
    if (!globeContainer || !GlobeModule || geoJsonFeatures.length === 0) return;

    if (globeInstance) {
      try {
        if (globeContainer.firstChild) {
          globeContainer.innerHTML = '';
        }
      } catch {}
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
      .polygonCapColor((d: any) => getPolygonColor(d))
      .polygonSideColor(() => (isDark ? 'rgba(6, 182, 212, 0.18)' : 'rgba(2, 132, 199, 0.22)'))
      .polygonStrokeColor(() => (isDark ? '#334155' : '#94a3b8'))
      .polygonAltitude((d: any) => {
        const iso3 = getFeatureIso3(d);
        if (selectedCountryIso3 === iso3 || hoveredIso3 === iso3) return 0.055;
        return 0.008;
      })
      .polygonLabel((d: any) => getTooltipHtml(d))
      .onPolygonHover((hoverD: any) => {
        hoveredIso3 = hoverD ? getFeatureIso3(hoverD) : null;
        if (globeInstance) {
          globeInstance.polygonAltitude((d: any) => {
            const iso3 = getFeatureIso3(d);
            if (selectedCountryIso3 === iso3 || hoveredIso3 === iso3) return 0.055;
            return 0.008;
          });
          globeInstance.polygonCapColor((d: any) => getPolygonColor(d));
        }
      })
      .onPolygonClick((clickD: any) => {
        if (!clickD) return;
        const iso3 = getFeatureIso3(clickD);
        const country = mapData.find(d => d.iso3 === iso3);
        if (country) {
          handleSelectFromSearch(country);
        }
      });

    // Configure country flag and name labels in 3D
    if (showLabels && globeLabels.length > 0) {
      globeInstance
        .labelsData(globeLabels)
        .labelLat((d: any) => d.lat)
        .labelLng((d: any) => d.lng)
        .labelText((d: any) => d.text)
        .labelSize((d: any) => d.size)
        .labelDotRadius((d: any) => (d.iso3 === selectedCountryIso3 ? 0.15 : 0.06))
        .labelColor((d: any) => d.color)
        .labelAltitude(0.012)
        .labelResolution(3)
        .onLabelClick((d: any) => {
          if (d.country) {
            handleSelectFromSearch(d.country);
          }
        })
        .onLabelHover((d: any) => {
          hoveredIso3 = d ? d.iso3 : null;
          updateGlobeVisuals();
        });
    }

    // Configure smooth Google Earth 3D camera controls
    const controls = globeInstance.controls();
    if (controls) {
      controls.autoRotate = false;
      controls.autoRotateSpeed = 0.5;
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.minDistance = 105;
      controls.maxDistance = 550;
    }

    // Default initial viewpoint (Centered near Indonesia / Asia-Pacific)
    globeInstance.pointOfView({ lat: 10, lng: 110, altitude: 2.2 }, 800);
  }

  function updateGlobeVisuals() {
    if (!globeInstance) return;
    const isDark = currentTheme === 'dark';
    globeInstance
      .backgroundColor(isDark ? '#0B0F19' : '#FAF8F3')
      .atmosphereColor(isDark ? '#06b6d4' : '#38bdf8')
      .polygonCapColor((d: any) => getPolygonColor(d))
      .polygonAltitude((d: any) => {
        const iso3 = getFeatureIso3(d);
        if (selectedCountryIso3 === iso3 || hoveredIso3 === iso3) return 0.055;
        return 0.008;
      })
      .labelsData(showLabels ? globeLabels : [])
      .labelSize((d: any) => d.size)
      .labelColor((d: any) => d.color);
  }

  // Initialize Flat 2D Map with Plotly
  function initPlotlyFlat() {
    if (!flatMapContainer || !plotlyModule) return;

    const isDark = currentTheme === 'dark';
    const dataList = mapData;
    const locations = dataList.map(d => d.iso3);
    const zValues = dataList.map(d => {
      if (activeMetric === 'rate') return d.middleRate;
      if (activeMetric === 'change') return d.change24h;
      return 1; // flag / neutral mode
    });

    const customData = dataList.map(d => ({
      country: d.countryName,
      code: d.currencyCode,
      name: d.currencyName,
      flag: d.flag,
      iso3: d.iso3,
      buyFormatted: formatRupiah(d.buyRate),
      sellFormatted: formatRupiah(d.sellRate),
      midFormatted: formatRupiah(d.middleRate),
      changeFormatted: formatPercent(d.change24h),
      change: d.change24h,
      changeColor: d.change24h >= 0 ? '#10b981' : '#ef4444',
    }));

    const isRateMetric = activeMetric === 'rate';
    const regionObj = REGION_FILTERS.find(r => r.id === activeRegion) || REGION_FILTERS[0];

    const rateColorScale: Array<[number, string]> = [
      [0.0, isDark ? '#042f2e' : '#ccfbf1'],
      [0.15, isDark ? '#065f46' : '#99f6e4'],
      [0.35, isDark ? '#0d9488' : '#2dd4bf'],
      [0.60, isDark ? '#06b6d4' : '#06b6d4'],
      [0.85, isDark ? '#3b82f6' : '#2563eb'],
      [1.0, isDark ? '#6366f1' : '#4f46e5'],
    ];

    const changeColorScale: Array<[number, string]> = [
      [0.0, '#ef4444'],
      [0.35, isDark ? '#991b1b' : '#f87171'],
      [0.48, isDark ? '#1e293b' : '#e2e8f0'],
      [0.52, isDark ? '#1e293b' : '#e2e8f0'],
      [0.65, isDark ? '#065f46' : '#34d399'],
      [1.0, '#10b981'],
    ];

    const flagColorScale: Array<[number, string]> = [
      [0.0, isDark ? '#0284c7' : '#38bdf8'],
      [1.0, isDark ? '#0d9488' : '#2dd4bf'],
    ];

    const labelCurrency = t('common.currency');
    const labelMid = t('common.mid');
    const labelBuy = t('common.buy');
    const labelSell = t('common.sell');
    const labelChange24h = t('common.change24h');
    const labelInspect = t('map.inspectCountry');

    const trace = {
      type: 'choropleth' as const,
      locationmode: 'ISO-3' as const,
      locations: locations,
      z: zValues,
      customdata: customData,
      hovertemplate: 
        '<extra></extra>' +
        '<span style="font-size: 13px; font-weight: bold; color: ' + (isDark ? '#f8fafc' : '#0f172a') + ';">%{customdata.flag} %{customdata.country} (%{customdata.code})</span><br>' +
        '<span style="font-size: 11px; color: ' + (isDark ? '#94a3b8' : '#475569') + ';">' + labelCurrency + ': %{customdata.name}</span><br>' +
        '<span style="font-size: 12px; font-weight: 600; color: #10b981;">' + labelMid + ': %{customdata.midFormatted}</span><br>' +
        '<span style="font-size: 11px; color: ' + (isDark ? '#cbd5e1' : '#334155') + ';">' + labelBuy + ': %{customdata.buyFormatted} | ' + labelSell + ': %{customdata.sellFormatted}</span><br>' +
        '<span style="font-size: 11px; font-weight: 600; color: %{customdata.changeColor};">' + labelChange24h + ': %{customdata.changeFormatted}</span><br>' +
        '<span style="font-size: 10px; color: #0284c7;">👉 ' + labelInspect + '</span>',
      colorscale: activeMetric === 'rate' ? rateColorScale : (activeMetric === 'change' ? changeColorScale : flagColorScale),
      zmin: activeMetric === 'change' ? -1.0 : undefined,
      zmax: activeMetric === 'change' ? 1.0 : undefined,
      zmid: activeMetric === 'change' ? 0 : undefined,
      showscale: activeMetric !== 'flag',
      colorbar: {
        title: {
          text: isRateMetric ? 'Kurs (IDR)' : '24h (%)',
          side: 'top' as const,
          font: { color: isDark ? '#94a3b8' : '#475569', size: 11, family: 'Inter, sans-serif' },
        },
        thickness: 12,
        len: 0.55,
        x: 0.02,
        y: 0.30,
        xanchor: 'left' as const,
        tickfont: { color: isDark ? '#94a3b8' : '#475569', size: 9, family: 'Inter, sans-serif' },
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
        bordercolor: isDark ? 'rgba(51, 65, 85, 0.7)' : 'rgba(203, 213, 225, 0.9)',
        borderwidth: 1,
      },
      marker: {
        line: {
          color: isDark ? '#334155' : '#cbd5e1',
          width: 0.8,
        },
      },
    };

    const layout = {
      geo: {
        projection: {
          type: 'natural earth' as const,
          scale: regionObj.zoom,
        },
        center: {
          lon: regionObj.lon,
          lat: regionObj.lat,
        },
        showcoastlines: true,
        coastlinecolor: isDark ? '#334155' : '#94a3b8',
        coastlinewidth: 0.8,
        showland: true,
        landcolor: isDark ? '#111827' : '#f1f5f9',
        showocean: true,
        oceancolor: isDark ? '#0b0f19' : '#faf8f3',
        showlakes: true,
        lakecolor: isDark ? '#0b0f19' : '#faf8f3',
        showcountries: true,
        countrycolor: isDark ? '#1e293b' : '#cbd5e1',
        countrywidth: 0.8,
        showframe: false,
        bgcolor: 'rgba(0,0,0,0)',
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      margin: { t: 0, b: 0, l: 0, r: 0 },
      autosize: true,
      font: {
        family: 'Inter, ui-sans-serif, system-ui, sans-serif',
        color: isDark ? '#e2e8f0' : '#1e293b',
      },
    };

    const config = {
      responsive: true,
      displayModeBar: false,
      scrollZoom: true,
    };

    plotlyModule.react(flatMapContainer, [trace], layout, config).then(() => {
      if (flatMapContainer && (flatMapContainer as any).on) {
        (flatMapContainer as any).removeAllListeners?.('plotly_click');
        (flatMapContainer as any).on('plotly_click', (data: any) => {
          if (data && data.points && data.points.length > 0) {
            const point = data.points[0];
            const custom = point.customdata;
            if (custom) {
              const country = mapData.find(d => d.iso3 === custom.iso3);
              if (country) {
                handleCountryClick(country);
              }
            }
          }
        });
      }
    });
  }

  let lastClickTime = 0;
  let lastClickedIso3 = '';

  function handleCountryClick(country: MapCountryData, isExplicitInspect = false) {
    const now = Date.now();
    const isDoubleClick = (now - lastClickTime < 350) && (lastClickedIso3 === country.iso3);
    lastClickTime = now;
    lastClickedIso3 = country.iso3;

    selectedCurrencyCode = country.currencyCode;
    selectedCountryIso3 = country.iso3;
    searchQuery = country.countryName;
    isSearchDropdownOpen = false;

    // Fly in 3D to country on globe
    if (projectionMode === 'globe' && globeInstance) {
      const regionObj = REGION_FILTERS.find(r => r.id === country.regionId);
      const lat = regionObj?.lat ?? 10;
      const lon = regionObj?.lon ?? 110;
      globeInstance.pointOfView({ lat, lng: lon, altitude: 1.3 }, 1000);
      updateGlobeVisuals();
    } else if (country.regionId && country.regionId !== 'all') {
      activeRegion = country.regionId;
      initPlotlyFlat();
    }

    loadBankMatrixForSelectedCurrency(country.currencyCode);
    onSelectCurrency?.(country.currencyCode);

    // If double click, explicit inspect button, or inspector was already open -> open docked inspector split view
    if (isDoubleClick || isExplicitInspect || isInspectorOpen) {
      openInspector();
    }
  }

  function openInspector() {
    isInspectorOpen = true;
    triggerCanvasResize();
  }

  function handleCloseInspector() {
    isInspectorOpen = false;
    triggerCanvasResize();
  }

  function triggerCanvasResize() {
    requestAnimationFrame(() => {
      if (projectionMode === 'globe' && globeInstance && globeContainer) {
        globeInstance.width(globeContainer.clientWidth).height(globeContainer.clientHeight);
      } else if (plotlyModule && flatMapContainer) {
        plotlyModule.Plots?.resize(flatMapContainer);
      }
    });
    setTimeout(() => {
      if (projectionMode === 'globe' && globeInstance && globeContainer) {
        globeInstance.width(globeContainer.clientWidth).height(globeContainer.clientHeight);
      } else if (plotlyModule && flatMapContainer) {
        plotlyModule.Plots?.resize(flatMapContainer);
      }
    }, 320);
  }

  function handleOpenInspector(code: string, iso3: string) {
    selectedCurrencyCode = code;
    selectedCountryIso3 = iso3;
    const country = mapData.find(d => d.iso3 === iso3 || d.currencyCode === code);
    if (country) {
      handleCountryClick(country, true);
    } else {
      openInspector();
      loadBankMatrixForSelectedCurrency(code);
      onSelectCurrency?.(code);
    }
  }

  function toggleProjection(mode: 'globe' | 'flat') {
    if (projectionMode === mode) return;
    projectionMode = mode;
    setTimeout(() => {
      if (mode === 'globe') {
        initGlobeGl();
      } else {
        initPlotlyFlat();
      }
    }, 50);
  }

  function toggleMetric(metric: MetricType) {
    if (activeMetric === metric) return;
    activeMetric = metric;
    if (projectionMode === 'globe') {
      updateGlobeVisuals();
    } else {
      initPlotlyFlat();
    }
  }

  function handleRegionSelect(regionId: RegionId) {
    activeRegion = regionId;
    const regionObj = REGION_FILTERS.find(r => r.id === regionId);
    if (!regionObj) return;

    if (projectionMode === 'globe' && globeInstance) {
      const altitude = regionId === 'all' ? 2.2 : (regionObj.zoom ? Math.max(0.6, 2.5 / regionObj.zoom) : 1.5);
      globeInstance.pointOfView({ lat: regionObj.lat, lng: regionObj.lon, altitude }, 1000);
    } else {
      initPlotlyFlat();
    }
  }

  function handleResetView() {
    activeRegion = 'all';
    searchQuery = '';
    if (projectionMode === 'globe' && globeInstance) {
      globeInstance.pointOfView({ lat: 10, lng: 110, altitude: 2.2 }, 1000);
    } else {
      initPlotlyFlat();
    }
  }

  function handleSelectFromSearch(item: MapCountryData) {
    handleCountryClick(item, true);
  }

  function handleSearchKeyDown(e: KeyboardEvent) {
    if (!isSearchDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        isSearchDropdownOpen = true;
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (searchResults.length > 0) {
        highlightedIndex = (highlightedIndex + 1) % searchResults.length;
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (searchResults.length > 0) {
        highlightedIndex = (highlightedIndex - 1 + searchResults.length) % searchResults.length;
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0 && searchResults[highlightedIndex]) {
        handleSelectFromSearch(searchResults[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      isSearchDropdownOpen = false;
    }
  }

  function toggleConvertDirection() {
    convertDirection = convertDirection === 'foreign_to_idr' ? 'idr_to_foreign' : 'foreign_to_idr';
  }

  function setPresetAmount(amt: number) {
    convertAmount = amt;
  }

  onMount(() => {
    loadDataAndInit();

    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef && !searchContainerRef.contains(e.target as Node)) {
        isSearchDropdownOpen = false;
      }
      if (regionContainerRef && !regionContainerRef.contains(e.target as Node)) {
        isRegionDropdownOpen = false;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        isSearchDropdownOpen = false;
        isRegionDropdownOpen = false;
        isInspectorOpen = false;
      }
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && document.activeElement !== searchInputRef)) {
        e.preventDefault();
        searchInputRef?.focus();
        isSearchDropdownOpen = true;
      }
    };

    const handleWindowResize = () => {
      if (projectionMode === 'globe' && globeInstance && globeContainer) {
        globeInstance.width(globeContainer.clientWidth).height(globeContainer.clientHeight);
      } else if (plotlyModule && flatMapContainer) {
        plotlyModule.Plots?.resize(flatMapContainer);
      }
    };

    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClickOutside);

    const unsubTheme = subscribeTheme((th) => {
      currentTheme = th;
      if (projectionMode === 'globe') {
        updateGlobeVisuals();
      } else if (flatMapContainer && plotlyModule) {
        initPlotlyFlat();
      }
    });

    return () => {
      unsubTheme();
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClickOutside);
    };
  });

  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (flatMapContainer && plotlyModule) {
      try {
        plotlyModule.purge(flatMapContainer);
      } catch {}
    }
    if (globeInstance) {
      try {
        globeInstance._destructor?.();
      } catch {}
    }
  });
</script>

{#if isLoading}
  <MapSkeleton class={className} />
{:else}
  <!-- Split-Screen Side-by-Side Main Container (Kiri: Globe / Peta, Kanan: Docked Inspector Panel) -->
  <div class={`relative w-full h-[calc(100vh-52px)] overflow-hidden bg-[var(--bg)] flex flex-col md:flex-row ${className}`}>

    <!-- ── Left Column: Globe 3D / Flat Map Section (Always 100% visible & interactive, no blocking backdrop!) ── -->
    <div class="flex-1 h-full min-w-0 relative overflow-hidden transition-all duration-300 ease-out">
      
      <!-- 1. True WebGL 3D Google Earth-Style Globe Canvas -->
      {#if projectionMode === 'globe'}
        <div
          bind:this={globeContainer}
          class="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          style="z-index: 1;"
        ></div>
      {:else}
        <!-- 2. Plotly 100% Full-Viewport 2D Flat Map Canvas -->
        <div
          bind:this={flatMapContainer}
          class="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          style="z-index: 1;"
        ></div>
      {/if}

      <!-- Top-Left Floating Live Status Pill -->
      <div class="absolute top-4 left-4 z-10 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[var(--bg-raised)]/85 border border-[var(--bg-rule)] text-xs font-semibold text-[var(--ink)] backdrop-blur-xl shadow-xl">
        <div class="flex items-center gap-2">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span class="font-bold tracking-tight">Kurs.World</span>
          <span class="text-[10px] text-[var(--ink-4)] font-normal">
            • {projectionMode === 'globe' ? '🌍 Globe 3D WebGL' : '🗺️ Peta Datar'} 
            {#if activeMetric === 'flag'}
              • 🏁 Mode Bendera
            {/if}
          </span>
          {#if isInspectorOpen}
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30">
              Split View ⇄
            </span>
          {/if}
        </div>
      </div>

      <!-- Top-Right Floating Controls Card ("Pusat Kontrol Peta & Filter") -->
      <div
        class="absolute top-4 right-4 z-20 w-[92vw] sm:w-[380px] max-w-sm bg-[var(--bg-raised)]/95 border border-[var(--bg-rule)] rounded-2xl shadow-2xl backdrop-blur-2xl p-4 transition-all duration-200"
        style="color: var(--ink);"
      >
        <!-- 1. Panel Header & Quick Actions -->
        <div class="flex items-center justify-between pb-3 border-b border-[var(--bg-rule)]">
          <div class="flex items-center gap-2">
            <SlidersHorizontal class="w-4 h-4 text-sky-400" />
            <span class="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
              {t('map.controlCenter')}
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              onclick={handleResetView}
              class="p-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-rule)] text-[var(--ink-3)] hover:text-[var(--ink)] transition text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              title="Reset Zoom & Center"
            >
              <RotateCcw class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onclick={() => (isControlsCollapsed = !isControlsCollapsed)}
              class="p-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-rule)] text-[var(--ink-3)] hover:text-[var(--ink)] transition cursor-pointer"
              aria-label="Toggle Panel"
            >
              {#if isControlsCollapsed}
                <ChevronDown class="w-4 h-4" />
              {:else}
                <ChevronUp class="w-4 h-4" />
              {/if}
            </button>
          </div>
        </div>

        {#if !isControlsCollapsed}
          <div class="mt-3.5 space-y-3">
            <!-- 2. Search Autocomplete Bar with Shortcut Badge -->
            <div class="relative" bind:this={searchContainerRef}>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-4)]">
                  <Search class="w-3.5 h-3.5" />
                </div>
                <input
                  bind:this={searchInputRef}
                  type="text"
                  bind:value={searchQuery}
                  oninput={(e) => {
                    searchQuery = (e.target as HTMLInputElement).value;
                    isSearchDropdownOpen = true;
                    highlightedIndex = 0;
                  }}
                  onfocus={() => {
                    isSearchDropdownOpen = true;
                  }}
                  onkeydown={handleSearchKeyDown}
                  placeholder={t('map.searchPlaceholder')}
                  class="w-full bg-[var(--bg-subtle)] border border-[var(--bg-rule)] hover:border-[var(--ink-4)] focus:border-sky-500 rounded-xl pl-9 pr-14 py-2 text-xs text-[var(--ink)] placeholder:text-[var(--ink-4)] outline-none transition shadow-inner font-medium"
                />
                <div class="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
                  {#if searchQuery}
                    <button
                      type="button"
                      onclick={() => { searchQuery = ''; searchInputRef?.focus(); }}
                      class="text-[var(--ink-4)] hover:text-[var(--ink)] p-0.5 cursor-pointer"
                    >
                      <X class="w-3.5 h-3.5" />
                    </button>
                  {:else}
                    <kbd class="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono text-[var(--ink-4)] bg-[var(--bg-raised)] rounded border border-[var(--bg-rule)]">
                      ⌘K
                    </kbd>
                  {/if}
                </div>
              </div>

              <!-- Autocomplete Suggestions Dropdown -->
              {#if isSearchDropdownOpen}
                <div class="absolute top-full left-0 right-0 mt-2 z-50 bg-[var(--bg-raised)] border border-[var(--bg-rule)] rounded-xl shadow-2xl backdrop-blur-2xl max-h-64 overflow-y-auto divide-y divide-[var(--bg-rule)] scrollbar-thin">
                  {#if searchResults.length > 0}
                    <div class="px-3 py-1.5 text-[10px] font-bold text-[var(--ink-4)] uppercase tracking-wider bg-[var(--bg-subtle)] flex items-center justify-between">
                      <span>{searchQuery ? `${searchResults.length} Negara Ditemukan` : 'Rekomendasi Populer'}</span>
                      <span class="text-[9px] text-sky-400 font-normal">Pilih ↵</span>
                    </div>
                    {#each searchResults as item, index}
                      {@const isHighlighted = highlightedIndex === index}
                      <button
                        type="button"
                        onclick={() => handleSelectFromSearch(item)}
                        class={`w-full text-left px-3 py-2 flex items-center justify-between gap-2.5 transition cursor-pointer group ${
                          isHighlighted ? 'bg-sky-500/20 text-sky-200' : 'hover:bg-[var(--bg-subtle)]'
                        }`}
                      >
                        <div class="flex items-center gap-2.5 min-w-0">
                          <span class="text-lg shrink-0">{item.flag}</span>
                          <div class="truncate">
                            <div class="text-xs font-bold text-[var(--ink)] group-hover:text-sky-400 transition flex items-center gap-1.5">
                              <span>{item.countryName}</span>
                              <span class="text-[9px] font-semibold px-1 py-0.2 rounded bg-[var(--bg-subtle)] text-[var(--ink-3)]">{item.currencyCode}</span>
                            </div>
                            <div class="text-[10px] text-[var(--ink-4)] truncate">
                              {item.currencyName} • {item.regionLabel}
                            </div>
                          </div>
                        </div>
                        <div class="text-right shrink-0">
                          <div class="text-xs font-bold text-emerald-400 font-mono">
                            {formatRupiah(item.middleRate, { showFraction: true })}
                          </div>
                          <div class={`text-[10px] font-semibold ${item.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatPercent(item.change24h)}
                          </div>
                        </div>
                      </button>
                    {/each}
                  {:else}
                    <div class="px-4 py-5 text-center text-xs text-[var(--ink-4)]">
                      <Search class="w-5 h-5 mx-auto mb-1.5 opacity-40 text-sky-400" />
                      <p class="font-bold text-[var(--ink)]">Tidak ada negara ditemukan</p>
                      <p class="text-[11px] mt-0.5">Tidak ada hasil untuk "{searchQuery}"</p>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- 3. Section: Tampilan Peta & Lapisan (Projection + 3D Pin Switch) -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--ink-4)]">
                <span>{t('map.viewAndLayers')}</span>
                {#if projectionMode === 'globe'}
                  <button
                    type="button"
                    onclick={() => {
                      showLabels = !showLabels;
                      updateGlobeVisuals();
                    }}
                    class={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition border cursor-pointer ${
                      showLabels
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-[var(--bg-subtle)] border-[var(--bg-rule)] text-[var(--ink-4)] hover:text-[var(--ink)]'
                    }`}
                    title="Toggle Label Nama & Kode Valas di Globe 3D"
                  >
                    <MapPin class="w-2.5 h-2.5" />
                    <span>{t('map.pinLabels')}: {showLabels ? 'ON' : 'OFF'}</span>
                  </button>
                {/if}
              </div>

              <!-- Segmented Projection Switcher -->
              <div class="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)]">
                <button
                  type="button"
                  onclick={() => toggleProjection('globe')}
                  class={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    projectionMode === 'globe'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                  }`}
                >
                  <Globe class="w-3.5 h-3.5" />
                  <span>{t('map.projectionGlobe')}</span>
                </button>
                <button
                  type="button"
                  onclick={() => toggleProjection('flat')}
                  class={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    projectionMode === 'flat'
                      ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                  }`}
                >
                  <Compass class="w-3.5 h-3.5" />
                  <span>{t('map.projectionFlat')}</span>
                </button>
              </div>
            </div>

            <!-- 4. Section: Metrik Pewarnaan Peta (Heatmap Color Mode) -->
            <div class="space-y-1.5">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-4)]">
                {t('map.colorMetric')}
              </span>
              <div class="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)]">
                <button
                  type="button"
                  onclick={() => toggleMetric('rate')}
                  class={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    activeMetric === 'rate'
                      ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                  }`}
                >
                  <Coins class="w-3.5 h-3.5" />
                  <span>{t('map.modeRate')}</span>
                </button>
                <button
                  type="button"
                  onclick={() => toggleMetric('change')}
                  class={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    activeMetric === 'change'
                      ? 'bg-indigo-500 text-white shadow-md font-extrabold'
                      : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                  }`}
                >
                  <TrendingUp class="w-3.5 h-3.5" />
                  <span>{t('map.modeChange')}</span>
                </button>
                <button
                  type="button"
                  onclick={() => toggleMetric('flag')}
                  class={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    activeMetric === 'flag'
                      ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                      : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                  }`}
                >
                  <span>🏁</span>
                  <span>{t('map.modeFlag').replace(' 🏁', '')}</span>
                </button>
              </div>
            </div>

            <!-- 5. Section: Filter Kawasan Dunia (Clean Dropdown Selector — Tanpa Horizontal Scrollbar!) -->
            <div class="space-y-1.5" bind:this={regionContainerRef}>
              <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-4)]">
                {t('map.regionFilter')}
              </span>
              <div class="relative">
                <button
                  type="button"
                  onclick={() => (isRegionDropdownOpen = !isRegionDropdownOpen)}
                  class="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)] hover:border-sky-500/60 text-xs font-bold text-[var(--ink)] transition shadow-sm cursor-pointer"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-base">{currentRegionObj.emoji}</span>
                    <span class="truncate">{currentRegionObj.label}</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-[var(--ink-4)] shrink-0">
                    <span class="text-[10px] font-normal px-1.5 py-0.5 rounded bg-[var(--bg-raised)]">
                      {activeRegion === 'all' ? '195+ Negara' : `${currentRegionObj.iso3List?.length || 0} Negara`}
                    </span>
                    <ChevronDown class={`w-3.5 h-3.5 transition-transform duration-200 ${isRegionDropdownOpen ? 'rotate-180 text-sky-400' : ''}`} />
                  </div>
                </button>

                {#if isRegionDropdownOpen}
                  <div class="absolute bottom-full left-0 right-0 mb-2 z-50 bg-[var(--bg-raised)] border border-[var(--bg-rule)] rounded-xl shadow-2xl backdrop-blur-2xl max-h-56 overflow-y-auto divide-y divide-[var(--bg-rule)] scrollbar-thin">
                    <div class="px-3 py-1.5 text-[10px] font-bold text-[var(--ink-4)] uppercase tracking-wider bg-[var(--bg-subtle)]">
                      Pilih Kawasan Fokus (Kamera Otomatis Zoom)
                    </div>
                    {#each REGION_FILTERS as reg}
                      {@const isActive = activeRegion === reg.id}
                      <button
                        type="button"
                        onclick={() => {
                          handleRegionSelect(reg.id);
                          isRegionDropdownOpen = false;
                        }}
                        class={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition cursor-pointer ${
                          isActive ? 'bg-sky-500/20 text-sky-300 font-extrabold' : 'hover:bg-[var(--bg-subtle)] text-[var(--ink)]'
                        }`}
                      >
                        <div class="flex items-center gap-2 min-w-0">
                          <span class="text-base shrink-0">{reg.emoji}</span>
                          <span class="text-xs truncate">{reg.label}</span>
                        </div>
                        <span class={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${isActive ? 'bg-sky-500/30 text-sky-200' : 'bg-[var(--bg-subtle)] text-[var(--ink-4)]'}`}>
                          {reg.id === 'all' ? '195+' : `${reg.iso3List?.length || 0} Negara`}
                        </span>
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>

            <!-- 6. Section: Mini Quick Converter Box & Split CTA -->
            <div class="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)] space-y-2">
              <div class="flex items-center justify-between text-[11px] text-[var(--ink-4)] font-semibold">
                <span class="flex items-center gap-1 text-[var(--ink)]">
                  <Calculator class="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('converter.title')}</span>
                </span>
                <button
                  type="button"
                  onclick={toggleConvertDirection}
                  class="hover:text-sky-400 flex items-center gap-1 transition cursor-pointer"
                >
                  <ArrowRightLeft class="w-3 h-3" />
                  <span>{convertDirection === 'foreign_to_idr' ? `${selectedCountry.currencyCode} ➔ IDR` : `IDR ➔ ${selectedCountry.currencyCode}`}</span>
                </button>
              </div>

              <!-- Input & Live Result Row -->
              <div class="flex items-center gap-2">
                <div class="relative flex-1">
                  <input
                    type="number"
                    bind:value={convertAmount}
                    min="1"
                    step="any"
                    class="w-full bg-[var(--bg-raised)] border border-[var(--bg-rule)] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[var(--ink)] outline-none focus:border-sky-500 font-mono"
                  />
                  <span class="absolute right-2 top-1.5 text-[10px] text-[var(--ink-4)] font-bold">
                    {convertDirection === 'foreign_to_idr' ? selectedCountry.currencyCode : 'IDR'}
                  </span>
                </div>
                <div class="flex-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 text-right truncate font-mono">
                  {calculatedConvertResult.formatted}
                </div>
              </div>

              <!-- Inspect Selected Country Action Button -->
              <button
                type="button"
                onclick={() => openInspector()}
                class="w-full py-2 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{selectedCountry.flag} {t('map.inspectCountry')}: {selectedCountry.countryName}</span>
                <ChevronRight class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        {/if}
      </div>

    </div>

    <!-- ── Right Column: Docked Inspector Sidebar (Side-by-side split screen, no blocking backdrop!) ── -->
    {#if isInspectorOpen && selectedCountry}
      {@const curr = selectedCountry}
      {@const isPositive = curr.change24h >= 0}

      <aside
        aria-label={t('map.countryInspector')}
        class="w-full md:w-[440px] lg:w-[480px] xl:w-[520px] h-[55vh] md:h-full shrink-0 border-t md:border-t-0 md:border-l border-[var(--bg-rule)] bg-[var(--bg-raised)]/98 backdrop-blur-2xl shadow-2xl flex flex-col justify-between p-5 md:p-6 overflow-y-auto z-30 transition-all duration-300 ease-out"
        style="color: var(--ink);"
      >
        <div class="space-y-4">
          <!-- 1. Inspector Header -->
          <div class="flex items-start justify-between gap-3 border-b border-[var(--bg-rule)] pb-3.5">
            <div class="flex items-center gap-3">
              <span class="text-4xl shrink-0 drop-shadow-md">{curr.flag}</span>
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-lg md:text-xl font-bold text-[var(--ink)] truncate">
                    {curr.countryName}
                  </h3>
                  <span class="text-xs font-bold px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    {curr.currencyCode}
                  </span>
                  <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--ink-4)]">
                    {curr.iso3}
                  </span>
                </div>
                <p class="text-xs text-[var(--ink-4)] mt-0.5 truncate">
                  {curr.currencyName} • {curr.regionLabel}
                </p>
              </div>
            </div>

            <button
              type="button"
              onclick={handleCloseInspector}
              class="p-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-rule)] text-[var(--ink-3)] hover:text-[var(--ink)] transition cursor-pointer shrink-0"
              aria-label={t('common.close')}
              title="Tutup Split View"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- 2. Key Live Rates Grid (Mid, Buy, Sell, Spread, 24h Trend) -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div class="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)] flex flex-col justify-between">
              <span class="text-[10px] uppercase font-bold text-[var(--ink-4)]">{t('matrix.table.midRate')}</span>
              <div class="text-sm md:text-base font-extrabold text-emerald-400 mt-1 font-mono">
                {formatRupiah(curr.middleRate, { showFraction: true })}
              </div>
            </div>

            <div class="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)] flex flex-col justify-between">
              <span class="text-[10px] uppercase font-bold text-[var(--ink-4)]">{t('matrix.table.change24h')}</span>
              <div class={`text-sm md:text-base font-extrabold mt-1 flex items-center gap-1 font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {#if isPositive}
                  <TrendingUp class="w-4 h-4 shrink-0" />
                {:else}
                  <TrendingDown class="w-4 h-4 shrink-0" />
                {/if}
                <span>{formatPercent(curr.change24h)}</span>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)] col-span-2 sm:col-span-1 flex flex-col justify-between">
              <div class="flex items-center justify-between">
                <span class="text-[10px] uppercase font-bold text-[var(--ink-4)]">Spread</span>
                <span class="text-[9px] text-[var(--ink-4)]">{formatPercent(curr.spreadPercent)}</span>
              </div>
              <div class="text-sm md:text-base font-bold text-sky-400 mt-1 font-mono">
                {formatRupiah(curr.spread, { showFraction: true })}
              </div>
            </div>
          </div>

          <!-- 3. Google Finance-Style Trend Chart Mini -->
          <div class="border border-[var(--bg-rule)] rounded-2xl bg-[var(--bg-subtle)] p-3">
            <GoogleRateChart
              initialCurrency={curr.currencyCode}
              showCurrencySelector={false}
            />
          </div>

          <!-- 4. Quick Mini Converter Inside Drawer -->
          <div class="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)] space-y-2.5">
            <div class="flex items-center justify-between text-xs font-bold text-[var(--ink)]">
              <span class="flex items-center gap-1.5">
                <Calculator class="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('converter.title')} ({curr.currencyCode} ↔ IDR)</span>
              </span>
              <button
                type="button"
                onclick={toggleConvertDirection}
                class="text-sky-400 hover:text-sky-300 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
              >
                <ArrowRightLeft class="w-3 h-3" />
                <span>{convertDirection === 'foreign_to_idr' ? `${curr.currencyCode} ➔ IDR` : `IDR ➔ ${curr.currencyCode}`}</span>
              </button>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <input
                type="number"
                bind:value={convertAmount}
                min="1"
                class="w-full bg-[var(--bg-raised)] border border-[var(--bg-rule)] rounded-xl px-3 py-2 text-xs md:text-sm font-bold text-[var(--ink)] font-mono outline-none focus:border-sky-500"
              />
              <div class="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs md:text-sm font-bold text-emerald-400 flex items-center justify-end font-mono truncate">
                {calculatedConvertResult.formatted}
              </div>
            </div>

            <!-- Preset Nominals -->
            <div class="flex items-center gap-1.5 flex-wrap pt-0.5">
              {#each PRESET_AMOUNTS as preset}
                <button
                  type="button"
                  onclick={() => setPresetAmount(preset)}
                  class={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition border cursor-pointer ${
                    convertAmount === preset
                      ? 'bg-sky-500 text-slate-950 border-sky-400'
                      : 'bg-[var(--bg-raised)] border-[var(--bg-rule)] text-[var(--ink-3)] hover:text-[var(--ink)]'
                  }`}
                >
                  {preset.toLocaleString('id-ID')}
                </button>
              {/each}
            </div>
          </div>

          <!-- 5. Bank Comparison Matrix (If Quotes Available) -->
          {#if isMatrixLoading}
            <div class="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)] space-y-2 animate-pulse">
              <div class="h-4 bg-[var(--bg-rule)] rounded w-1/3"></div>
              <div class="h-12 bg-[var(--bg-rule)] rounded-xl"></div>
            </div>
          {:else if bankMatrix && bankMatrix.rows && bankMatrix.rows.length > 0}
            <div class="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)] space-y-2.5">
              <div class="flex items-center justify-between text-xs font-bold text-[var(--ink)]">
                <span class="flex items-center gap-1.5">
                  <Building2 class="w-3.5 h-3.5 text-sky-400" />
                  <span>{t('map.bankComparison')}</span>
                </span>
                <span class="text-[10px] text-[var(--ink-4)] font-normal">
                  {bankMatrix.rows.length} Bank
                </span>
              </div>

              <div class="divide-y divide-[var(--bg-rule)] text-[11px]">
                {#each bankMatrix.rows.slice(0, 4) as item}
                  <div class="py-2 flex items-center justify-between gap-2">
                    <div class="min-w-0">
                      <div class="font-bold text-[var(--ink)] truncate flex items-center gap-1.5">
                        <span>{item.providerName}</span>
                        {#if item.isBestBuy}
                          <span class="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                            {t('map.bestBuy')}
                          </span>
                        {/if}
                        {#if item.isBestSell}
                          <span class="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold">
                            {t('map.bestSell')}
                          </span>
                        {/if}
                      </div>
                      <div class="text-[10px] text-[var(--ink-4)]">
                        Spread: {formatRupiah(item.spread)}
                      </div>
                    </div>
                    <div class="text-right shrink-0 font-mono">
                      <div class="text-xs font-bold text-emerald-400">
                        {formatRupiah(item.buyRate, { showFraction: true })}
                      </div>
                      <div class="text-[10px] text-[var(--ink-4)]">
                        Jual: {formatRupiah(item.sellRate, { showFraction: true })}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

        </div>

        <!-- 6. Drawer Footer & Actions -->
        <div class="pt-3 border-t border-[var(--bg-rule)] flex items-center justify-between gap-2 text-xs text-[var(--ink-4)]">
          <div class="flex items-center gap-1.5 truncate">
            <Clock class="w-3.5 h-3.5 shrink-0" />
            <span class="truncate">{formatDateTimeIndo(new Date())}</span>
          </div>
          <button
            type="button"
            onclick={handleCloseInspector}
            class="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-rule)] text-[var(--ink)] font-bold transition cursor-pointer shrink-0"
          >
            {t('common.close')}
          </button>
        </div>
      </aside>
    {/if}

  </div>
{/if}
