<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import MapSkeleton from '$lib/components/skeletons/MapSkeleton.svelte';
  import { apiClient } from '$lib/api/client';
  import type { RateItem, RateMatrixResponse } from '$lib/api/types';
  import { formatRupiah, formatCurrency } from '$lib/formatters/currency';
  import { getTheme, subscribeTheme, type Theme } from '$lib/theme';
  import { 
    type MapCountryData, 
    type MetricType, 
    type RegionId, 
    COUNTRY_CURRENCY_MAP 
  } from './map-constants';
  import { createMapState } from './mapState.svelte';

  // Sub-components decomposition (ADR 0017 & ADR 0030)
  import Globe3DView from './components/Globe3DView.svelte';
  import FlatMap2DView from './components/FlatMap2DView.svelte';
  import CountryInspectorDrawer from './components/CountryInspectorDrawer.svelte';
  import GlobeEntranceLoader from './components/GlobeEntranceLoader.svelte';
  import { geoStore } from '$lib/framework/geoglobe/geoStore.svelte';
  import KursControls from '$lib/apps/kurs/KursControls.svelte';
  import TimeControls from '$lib/apps/time/TimeControls.svelte';
  import FlightControls from '$lib/apps/flight/FlightControls.svelte';
  import PassportControls from '$lib/apps/passport/PassportControls.svelte';
  import FloraControls from '$lib/apps/flora/FloraControls.svelte';
  import UniversalCountryInspector from '$lib/framework/geoglobe/ui/UniversalCountryInspector.svelte';

  interface Props {
    onSelectCurrency?: (currencyCode: string) => void;
    class?: string;
  }

  let { onSelectCurrency, class: className = '' }: Props = $props();

  const activeApp = $derived(geoStore.activeApp);

  // Reactive Map State Store — MapState uses Svelte 5 $state runes internally (ADR-0034)
  const mapState = createMapState();

  // 2-Way Reactive Synchronization between geoStore.showLabels and mapState.showLabels
  $effect(() => {
    const geoLabels = geoStore.showLabels;
    if (mapState.showLabels !== geoLabels) {
      mapState.showLabels = geoLabels;
    }
  });

  $effect(() => {
    const mapLabels = mapState.showLabels;
    if (geoStore.showLabels !== mapLabels) {
      geoStore.showLabels = mapLabels;
    }
  });

  let liveRates = $state<RateItem[]>([]);
  let geoJsonFeatures = $state<any[]>([]);
  let isLoading = $state(true);
  let isGlobeSceneReady = $state(false);
  let currentTheme = $state<Theme>(getTheme());
  let bankMatrix = $state<RateMatrixResponse | null>(null);
  let isMatrixLoading = $state(false);

  // Derived country map records combining API live rates & fallback
  const mapData = $derived.by<MapCountryData[]>(() => {
    return COUNTRY_CURRENCY_MAP.map((item) => {
      const live = liveRates.find((r) => r.targetCurrency === item.currencyCode);
      const buyRate = live?.buyRate ?? item.defaultRate.buy;
      const sellRate = live?.sellRate ?? item.defaultRate.sell;
      const middleRate = live?.middleRate ?? item.defaultRate.mid;
      const spread = live?.spread ?? sellRate - buyRate;
      const spreadPercent = live?.spreadPercent ?? (spread / (middleRate || 1)) * 100;
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

  // Selected Country details
  const selectedCountry = $derived.by<MapCountryData>(() => {
    if (mapState.selectedCountryIso3) {
      const byIso = mapData.find((d) => d.iso3 === mapState.selectedCountryIso3);
      if (byIso) return byIso;
    }
    const found = mapData.find((d) => d.currencyCode === mapState.selectedCurrencyCode);
    return found || mapData[0];
  });

  // Quick converted result
  const calculatedConvertResult = $derived.by<{ value: number; formatted: string }>(() => {
    if (!selectedCountry) return { value: 0, formatted: '0' };
    const amt = Number(mapState.convertAmount) || 0;
    if (mapState.convertDirection === 'foreign_to_idr') {
      const val = amt * selectedCountry.middleRate;
      return { value: val, formatted: formatRupiah(val, { showFraction: true }) };
    } else {
      const val = selectedCountry.middleRate > 0 ? amt / selectedCountry.middleRate : 0;
      return {
        value: val,
        formatted: `${formatCurrency(val, selectedCountry.currencyCode, { maxDecimals: 4 })} ${selectedCountry.currencyCode}`,
      };
    }
  });

  async function loadBankMatrix(code: string) {
    if (!code || code === 'IDR') {
      bankMatrix = null;
      return;
    }
    isMatrixLoading = true;
    try {
      bankMatrix = await apiClient.getRateMatrix(code);
    } catch (err) {
      console.error('Error fetching bank matrix:', code, err);
    } finally {
      isMatrixLoading = false;
    }
  }

  let lastClickTime = 0;
  let lastClickedIso3 = '';

  function handleCountryClick(country: MapCountryData, isExplicitInspect = false) {
    const now = Date.now();
    const isDoubleClick = now - lastClickTime < 350 && lastClickedIso3 === country.iso3;
    lastClickTime = now;
    lastClickedIso3 = country.iso3;

    mapState.selectCountry(country.iso3, country.currencyCode);
    mapState.setSearchQuery(country.countryName);
    mapState.isSearchDropdownOpen = false;

    loadBankMatrix(country.currencyCode);
    onSelectCurrency?.(country.currencyCode);

    if (isDoubleClick || isExplicitInspect || mapState.isInspectorOpen) {
      mapState.openInspector();
    }
  }

  onMount(() => {
    let unsubTheme: () => void = () => {};

    async function loadData() {
      isLoading = true;
      try {
        const [rates, geoRes] = await Promise.all([
          apiClient.getLiveRates('IDR'),
          fetch('/data/world-countries.geojson').then((r) => r.json()),
        ]);
        liveRates = rates;
        geoJsonFeatures = geoRes?.features || [];
      } catch (err) {
        console.error('Error loading world map data:', err);
      } finally {
        isLoading = false;
        loadBankMatrix(mapState.selectedCurrencyCode);
      }
    }

    loadData();

    unsubTheme = subscribeTheme((th) => {
      currentTheme = th;
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        mapState.isSearchDropdownOpen = false;
        mapState.isRegionDropdownOpen = false;
        mapState.closeInspector();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubTheme();
      window.removeEventListener('keydown', handleKeyDown);
    };
  });
</script>

<!-- Split-Screen Side-by-Side Main Container -->
<div class={`relative w-full h-[calc(100vh-52px)] overflow-hidden bg-[var(--bg)] flex flex-col md:flex-row ${className}`}>
  
  <!-- Holographic Globe Entrance Animation Overlay -->
  {#if isLoading || !isGlobeSceneReady}
    <GlobeEntranceLoader isReady={!isLoading && isGlobeSceneReady} />
  {/if}

  {#if !isLoading}
    <!-- Left Column: Map Viewport (Globe 3D / Flat 2D) -->
    <div class="flex-1 h-full min-w-0 relative overflow-hidden transition-all duration-300 ease-out">
      {#if mapState.projectionMode === 'globe'}
        <Globe3DView
          {geoJsonFeatures}
          {mapData}
          {mapState}
          {currentTheme}
          onCountryClick={(c) => handleCountryClick(c)}
          onCountryHover={(iso3) => { mapState.hoveredIso3 = iso3; }}
          onReady={() => { isGlobeSceneReady = true; }}
        />
      {:else}
        <FlatMap2DView
          {mapData}
          {mapState}
          {currentTheme}
          onCountryClick={(c) => handleCountryClick(c)}
        />
      {/if}

      <!-- Top-Left Floating Live Status Pill -->
      <div class="absolute top-4 left-4 z-10 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[var(--bg-raised)]/85 border border-[var(--bg-rule)] text-xs font-semibold text-[var(--ink)] backdrop-blur-xl shadow-xl">
        <div class="flex items-center gap-2">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span class="font-bold tracking-tight">{activeApp.name}</span>
          <span class="text-[10px] text-[var(--ink-4)] font-normal">
            • {mapState.projectionMode === 'globe' ? '🌍 Globe 3D WebGL' : '🗺️ Peta Datar'} 
            {#if mapState.activeMetric === 'flag'}
              • 🏁 Mode Bendera
            {/if}
          </span>
          {#if mapState.isInspectorOpen}
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30">
              Split View ⇄
            </span>
          {/if}
        </div>
      </div>

      <!-- Top-Right Floating Controls Card (Isolated per Micro-App) -->
      {#if geoStore.activeAppId === 'world-time'}
        <TimeControls
          onSelectCountry={(iso3) => {
            const country = mapData.find(d => d.iso3 === iso3);
            if (country) handleCountryClick(country);
          }}
          onResetView={() => {
            mapState.setRegion('all');
            mapState.setSearchQuery('');
          }}
        />
      {:else if geoStore.activeAppId === 'remittance-flow'}
        <FlightControls
          onSelectCountry={(iso3) => {
            const country = mapData.find(d => d.iso3 === iso3);
            if (country) handleCountryClick(country);
          }}
          onResetView={() => {
            mapState.setRegion('all');
            mapState.setSearchQuery('');
          }}
        />
      {:else if geoStore.activeAppId === 'passport-power'}
        <PassportControls
          onSelectCountry={(iso3) => {
            const country = mapData.find(d => d.iso3 === iso3);
            if (country) handleCountryClick(country);
          }}
          onResetView={() => {
            mapState.setRegion('all');
            mapState.setSearchQuery('');
          }}
        />
      {:else if geoStore.activeAppId === 'flora-fauna'}
        <FloraControls
          onSelectCountry={(iso3) => {
            const country = mapData.find(d => d.iso3 === iso3);
            if (country) handleCountryClick(country);
          }}
          onResetView={() => {
            mapState.setRegion('all');
            mapState.setSearchQuery('');
          }}
        />
      {:else}
        <KursControls
          {mapState}
          {mapData}
          {selectedCountry}
          {calculatedConvertResult}
          onSelectCountry={(c, explicit) => handleCountryClick(c, explicit)}
          onResetView={() => {
            mapState.setRegion('all');
            mapState.setSearchQuery('');
          }}
          onToggleProjection={(m) => mapState.setProjection(m)}
          onToggleMetric={(m) => mapState.setMetric(m)}
          onSelectRegion={(r) => mapState.setRegion(r)}
          onToggleLabels={() => mapState.toggleLabels()}
          onOpenInspector={() => mapState.openInspector()}
        />
      {/if}
    </div>

    <!-- Right Column: Docked Country Inspector Drawer -->
    {#if (mapState.isInspectorOpen || geoStore.isInspectorOpen) && selectedCountry}
      {#if geoStore.activeAppId === 'fx-rates'}
        <CountryInspectorDrawer
          {selectedCountry}
          {mapState}
          {bankMatrix}
          {isMatrixLoading}
          onClose={() => {
            mapState.closeInspector();
            geoStore.isInspectorOpen = false;
          }}
          {onSelectCurrency}
        />
      {:else}
        <UniversalCountryInspector
          onClose={() => {
            mapState.closeInspector();
            geoStore.isInspectorOpen = false;
          }}
        />
      {/if}
    {/if}
  {/if}
</div>
