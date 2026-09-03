<script lang="ts">
  import { onMount } from 'svelte';
  import Navbar from './lib/components/Navbar.svelte';
  import ControlsToolbar from './lib/components/ControlsToolbar.svelte';
  import CountryDrawer from './lib/components/CountryDrawer.svelte';
  import QuickConverter from './lib/components/QuickConverter.svelte';
  import CurrencyMatrix from './lib/components/CurrencyMatrix.svelte';
  import GlobeScene from './lib/globe/GlobeScene.svelte';
  import { globeState } from './lib/state/globeState.svelte';
  import { ratesState } from './lib/state/ratesState.svelte';
  import { EXTENDED_COUNTRIES_DATA } from './lib/data/countrySpatialData';
  import { createRemittanceArc } from './lib/globe/layers/arcLayer';
  import { generateMeridianPaths } from './lib/globe/layers/pathLayer';
  import { createCountryPinLabel, filterLabelsByLOD } from './lib/globe/layers/labelLayer';
  import { createPulsingRing } from './lib/globe/layers/ringLayer';
  import type { RateChoroplethData, ArcData } from './lib/globe/types';

  let globeSceneRef = $state<any>(null);
  let geoJsonFeatures = $state<any[]>([]);
  let isGeoJsonLoading = $state<boolean>(true);

  // Pre-generate all static country pin labels once
  const allPinLabels = EXTENDED_COUNTRIES_DATA.map((c) => createCountryPinLabel(c));

  // Load GeoJSON Polygons and Initial Rates on Mount
  onMount(async () => {
    // Initial fetch of live rates
    ratesState.fetchRates();

    // Fetch GeoJSON world countries
    try {
      isGeoJsonLoading = true;
      const res = await fetch('/data/world-countries.geojson');
      if (res.ok) {
        const data = await res.json();
        geoJsonFeatures = data.features || [];
      }
    } catch (err) {
      console.error('[App] Failed to load GeoJSON world countries:', err);
    } finally {
      isGeoJsonLoading = false;
    }
  });

  // Derived rate data mapping by ISO-3 for polygon choropleth & tooltips
  const rateDataByIso3 = $derived.by<Record<string, RateChoroplethData>>(() => {
    const map: Record<string, RateChoroplethData> = {};
    for (const country of EXTENDED_COUNTRIES_DATA) {
      const live = ratesState.liveRates[country.currencyCode.toUpperCase()];
      map[country.iso3] = {
        rate: live ? live.middleRate : country.defaultRate,
        change24h: live ? live.change24h : country.defaultChange24h,
        currencyCode: country.currencyCode,
      };
    }
    return map;
  });

  // Remittance & Financial Corridor 3D Arcs (Anchored from IDN to top global partners)
  const remittanceArcs = $derived.by<ArcData[]>(() => {
    const partners = ['SGP', 'MYS', 'SAU', 'JPN', 'USA', 'AUS', 'CHN', 'GBR', 'DEU', 'KOR', 'ARE', 'NLD'];
    const list: ArcData[] = [];

    for (const partnerIso of partners) {
      const dest = EXTENDED_COUNTRIES_DATA.find((c) => c.iso3 === partnerIso);
      if (!dest) continue;
      const rate = ratesState.liveRates[dest.currencyCode.toUpperCase()]?.middleRate ?? dest.defaultRate;
      const arc = createRemittanceArc('IDN', dest.iso3, {
        amount: rate,
        currency: dest.currencyCode,
        label: `Koridor IDN ➔ ${dest.iso3}`,
      });
      if (arc) {
        list.push(arc);
      }
    }

    return list;
  });

  // 3D Meridians & Timezone Longitude Lines
  const meridianPaths = $derived.by(() => {
    if (!globeState.showTimezoneLines) return [];
    return generateMeridianPaths();
  });

  // 3D Country & Capital Pin Labels with LOD filtering
  const countryLabels = $derived.by(() => {
    if (!globeState.showLabels) return [];
    return filterLabelsByLOD(allPinLabels, globeState.cameraAltitude, globeState.selectedCountryIso3);
  });

  // Pulsing Transaction Rings for Selected Country
  const pulseRings = $derived.by(() => {
    const selected = globeState.selectedCountry;
    if (!selected) return [];
    return [
      createPulsingRing(
        selected.lat,
        selected.lng,
        {
          color: 'rgba(56, 189, 248, 0.75)',
          maxRadius: 6,
          label: `Aktif: ${selected.countryName}`,
        }
      ),
    ];
  });

  function handleCountryClick(iso3: string) {
    globeState.selectCountry(iso3);
    if (globeSceneRef?.flyToCountry) {
      globeSceneRef.flyToCountry(iso3);
    }
  }

  function handleCountryHover(iso3: string | null) {
    globeState.hoverCountry(iso3);
  }
</script>

<div class="min-h-screen bg-[#0B0F19] text-[#F8FAFC] flex flex-col relative selection:bg-indigo-500 selection:text-white">
  <!-- Top Navigation Bar -->
  <Navbar />

  <!-- Main View Router -->
  <main class="flex-1 relative flex flex-col">
    {#if globeState.viewMode === 'globe'}
      <!-- Globe 3D Canvas View -->
      <div class="flex-1 w-full relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden">
        <GlobeScene
          bind:this={globeSceneRef}
          polygons={geoJsonFeatures}
          selectedIso3={globeState.selectedCountryIso3}
          hoveredIso3={globeState.hoveredCountryIso3}
          {rateDataByIso3}
          activeMetric={globeState.activeMetric}
          arcs={remittanceArcs}
          paths={meridianPaths}
          labels={countryLabels}
          rings={pulseRings}
          theme="dark"
          onCountryClick={handleCountryClick}
          onCountryHover={handleCountryHover}
        />

        <!-- Floating Controls Toolbar -->
        <ControlsToolbar
          onZoomIn={() => globeSceneRef?.handleZoomIn()}
          onZoomOut={() => globeSceneRef?.handleZoomOut()}
          onResetCamera={() => globeSceneRef?.handleResetView()}
        />

        <!-- Side Details Drawer -->
        <CountryDrawer />
      </div>
    {:else if globeState.viewMode === 'matrix'}
      <div class="flex-1">
        <CurrencyMatrix />
      </div>
    {:else if globeState.viewMode === 'converter'}
      <div class="flex-1 flex items-center justify-center py-10 px-4">
        <QuickConverter />
      </div>
    {/if}
  </main>
</div>
