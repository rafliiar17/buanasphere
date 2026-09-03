<script lang="ts">
  import {
    Search,
    X,
    RotateCcw,
    Eye,
    EyeOff,
    SlidersHorizontal,
    Sparkles,
    Compass,
    Layers,
    Activity,
    Flag,
    Globe,
    RotateCw
  } from 'lucide-svelte';
  import { geoStore } from '../geoStore.svelte';
  import { EXTENDED_COUNTRIES_DATA } from '../countrySpatialData';
  import type { CountrySpatialMetadata } from '../types';
  import type { createMapState } from '$lib/features/map/mapState.svelte';

  interface Props {
    mapState?: ReturnType<typeof createMapState> | any;
    onSelectCountry?: (iso3: string) => void;
    onResetView?: () => void;
  }

  let { mapState, onSelectCountry, onResetView }: Props = $props();

  const activeApp = $derived(geoStore.activeApp);
  const nonFlagMetrics = $derived((activeApp.metrics || []).filter((m: any) => m.id !== 'flag'));

  let localSearchQuery = $state('');
  let isSearchDropdownOpen = $state(false);

  // Synchronize local search with mapState/geoStore if provided
  $effect(() => {
    const q = mapState?.searchQuery ?? geoStore.searchQuery;
    if (q !== undefined && q !== localSearchQuery) {
      localSearchQuery = q;
    }
  });

  const searchResults = $derived.by<CountrySpatialMetadata[]>(() => {
    if (!localSearchQuery.trim()) return [];
    const q = localSearchQuery.trim().toLowerCase();
    return (EXTENDED_COUNTRIES_DATA as CountrySpatialMetadata[]).filter(
      (c) =>
        c.countryName.toLowerCase().includes(q) ||
        c.capital.toLowerCase().includes(q) ||
        c.iso3.toLowerCase().includes(q) ||
        (c.currencyCode && c.currencyCode.toLowerCase().includes(q))
    ).slice(0, 8);
  });

  function handleSearchInput(e: Event) {
    const target = e.target as HTMLInputElement;
    localSearchQuery = target.value;
    mapState?.setSearchQuery?.(localSearchQuery);
    geoStore.setSearchQuery?.(localSearchQuery);
    isSearchDropdownOpen = localSearchQuery.trim().length > 0;
  }

  function handleClearSearch() {
    localSearchQuery = '';
    mapState?.setSearchQuery?.('');
    geoStore.setSearchQuery?.('');
    isSearchDropdownOpen = false;
  }

  function handleSelectCountry(iso3: string) {
    localSearchQuery = '';
    mapState?.setSearchQuery?.('');
    geoStore.setSearchQuery?.('');
    isSearchDropdownOpen = false;
    geoStore.selectCountry(iso3);
    mapState?.selectCountry?.(iso3);
    geoStore.travelToCountry?.(iso3);
    onSelectCountry?.(iso3);
  }

  function handleSearchKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && searchResults.length > 0) {
      e.preventDefault();
      handleSelectCountry(searchResults[0].iso3);
    }
  }


  function handleToggleLabels() {
    mapState?.toggleLabels?.();
    geoStore.toggleLabels?.();
  }

  function handleToggleAutoRotate() {
    mapState?.toggleAutoRotate?.();
    geoStore.toggleAutoRotate?.();
  }

  function handleToggleFlags() {
    mapState?.toggleFlags?.();
    geoStore.toggleFlags?.();
  }

  function handleMetricChange(metricId: string) {
    mapState?.setMetric?.(metricId);
    geoStore.setMetric?.(metricId);
  }

  function handleFilterSelect(filterId: string) {
    geoStore.setCustomFilter?.(filterId);
  }

  function handleCameraPreset(presetKey: string) {
    mapState?.setRegion?.(presetKey);
    geoStore.setRegion?.(presetKey);
  }

  function handleReset() {
    localSearchQuery = '';
    mapState?.setSearchQuery?.('');
    geoStore.setSearchQuery?.('');
    mapState?.setRegion?.('all');
    geoStore.setRegion?.('all');
    geoStore.setCustomFilter?.('all');
    isSearchDropdownOpen = false;
    onResetView?.();
  }

  function formatPresetLabel(key: string): string {
    const map: Record<string, string> = {
      all: 'Global',
      asean: 'ASEAN',
      asia: 'Asia',
      europe: 'Europe',
      americas: 'Americas',
      africa: 'Africa',
      oceania: 'Oceania',
      middle_east: 'Mideast',
      east_asia: 'East Asia',
    };
    return map[key.toLowerCase()] ?? (key.charAt(0).toUpperCase() + key.slice(1));
  }

  const showLabels = $derived(mapState?.showLabels ?? geoStore.showLabels);
  const activeMetricId = $derived(mapState?.activeMetric ?? geoStore.activeMetricId);
  const activeRegion = $derived(mapState?.activeRegion ?? geoStore.activeRegion);
  const activeCustomFilter = $derived(geoStore.customFilter ?? 'all');
  const isRotating = $derived(Boolean(mapState?.autoRotate || geoStore.autoRotate));
  const isFlagActive = $derived(Boolean(mapState?.showFlags || mapState?.activeMetric === 'flag' || geoStore.showFlags || geoStore.activeMetricId === 'flag'));
</script>

<!-- Floating Top-Right Universal Controls Panel (ADR 0040 & ADR 0052) -->
<div class="absolute top-4 right-4 z-20 w-80 sm:w-88 flex flex-col gap-3 pointer-events-auto select-none">
  <div class="rounded-3xl border border-slate-700/80 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-xl text-slate-100 transition-all duration-200 flex flex-col gap-3.5">
    
    <!-- GROUP 1: 🌐 TAMPILAN GLOBE (GLOBAL) -->
    <div class="space-y-2.5 pb-3 border-b border-slate-800/80">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Globe class="w-4 h-4 text-sky-400 shrink-0" />
          <span class="text-xs font-bold tracking-tight text-white uppercase">Tampilan Globe</span>
          <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase font-bold">Global</span>
        </div>
        <button
          type="button"
          onclick={handleReset}
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Reset Sudut Pandang"
        >
          <RotateCcw class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- 3-col Grid: Label, Rotasi, Bendera -->
      <div class="grid grid-cols-3 gap-1.5">
        <!-- 1. Label Toggle -->
        <button
          type="button"
          onclick={handleToggleLabels}
          class="flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-xl border text-[11px] font-semibold transition cursor-pointer {showLabels ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800/80 text-slate-400 border-slate-700'}"
        >
          {#if showLabels}
            <Eye class="w-3.5 h-3.5" />
            <span>Label: ON</span>
          {:else}
            <EyeOff class="w-3.5 h-3.5" />
            <span>Label: OFF</span>
          {/if}
        </button>

        <!-- 2. Rotasi Toggle -->
        <button
          type="button"
          onclick={handleToggleAutoRotate}
          class="flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-xl border text-[11px] font-semibold transition cursor-pointer {isRotating ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20 font-bold' : 'bg-slate-800/80 text-slate-400 border-slate-700'}"
          title="Putar Otomatis Sudut Pandang Globe"
        >
          <RotateCw class="w-3.5 h-3.5 {isRotating ? 'animate-spin' : ''}" />
          <span>Rotasi: {isRotating ? 'ON' : 'OFF'}</span>
        </button>

        <!-- 3. Bendera Toggle -->
        <button
          type="button"
          onclick={handleToggleFlags}
          class="flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-xl border text-[11px] font-semibold transition cursor-pointer {isFlagActive ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20 font-bold' : 'bg-slate-800/80 text-slate-400 border-slate-700'}"
          title="Tampilkan Tekstur Bendera Nasional di Setiap Negara"
        >
          <Flag class="w-3.5 h-3.5 text-amber-300" />
          <span>Bendera: {isFlagActive ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </div>

    <!-- GROUP 2: 🎛️ [NAMA MICROAPP] (APP) -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 truncate">
          <SlidersHorizontal class="w-4 h-4 text-sky-400 shrink-0" />
          <span class="text-xs font-bold tracking-tight text-white uppercase truncate">
            {activeApp.name}
          </span>
        </div>
        <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-bold">App</span>
      </div>

      <!-- Search Input Row -->
      <div class="relative">
        <div class="relative flex items-center">
          <Search class="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari negara, ibukota, ISO3..."
            value={localSearchQuery}
            oninput={handleSearchInput}
            onkeydown={handleSearchKeydown}
            onfocus={() => {
              if (localSearchQuery.trim()) isSearchDropdownOpen = true;
            }}
            class="w-full pl-9 pr-8 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
          {#if localSearchQuery}
            <button
              type="button"
              onclick={handleClearSearch}
              class="absolute right-2.5 p-0.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Bersihkan pencarian"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          {/if}
        </div>

        <!-- Autocomplete Dropdown List -->
        {#if isSearchDropdownOpen && searchResults.length > 0}
          <div class="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl z-30 divide-y divide-slate-800">
            {#each searchResults as item}
              <button
                type="button"
                onclick={() => handleSelectCountry(item.iso3)}
                class="w-full px-3 py-2 text-left hover:bg-slate-800/80 flex items-center justify-between transition text-xs cursor-pointer"
              >
                <div class="flex items-center gap-2 truncate">
                  <span class="text-sm">{item.flagEmoji}</span>
                  <span class="font-medium text-white truncate">{item.countryName}</span>
                  <span class="text-[10px] text-slate-400 font-mono">({item.capital})</span>
                </div>
                <span class="text-[10px] font-mono font-bold text-sky-400 shrink-0">{item.iso3}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Timezone Lines Toggle (when activeApp.id === 'world-time') -->
      {#if activeApp.id === 'world-time'}
        <div class="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span class="text-xs text-slate-300 font-medium">Garis Batas Zona Waktu 3D</span>
          <button
            type="button"
            onclick={() => mapState?.toggleTimezoneLines?.()}
            class="py-1 px-2.5 rounded-lg border text-xs font-semibold transition cursor-pointer {mapState?.showTimezoneLines ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold' : 'bg-slate-800/80 text-slate-400 border-slate-700'}"
          >
            {mapState?.showTimezoneLines ? 'ON' : 'OFF'}
          </button>
        </div>
      {/if}

      <!-- Filter Section (Dynamic Filter Pills / Tabs) -->
      {#if activeApp.filterOptions && activeApp.filterOptions.length > 0}
        <div>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Filter & Kategori
          </span>
          <div class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
            {#each activeApp.filterOptions as opt}
              {@const isSelected = activeCustomFilter === opt.id}
              <button
                type="button"
                onclick={() => handleFilterSelect(opt.id)}
                class="py-1 px-2.5 rounded-lg text-xs transition cursor-pointer border {isSelected
                  ? 'bg-sky-500 text-white font-bold border-sky-400 shadow-sm shadow-sky-500/30'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'}"
              >
                {opt.label}
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Metrics Section (Dynamic Metric Switcher Buttons without 'flag') -->
      {#if nonFlagMetrics.length > 1}
        <div>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Pewarnaan Metrik
          </span>
          <div class="grid {nonFlagMetrics.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
            {#each nonFlagMetrics as m}
              {@const isMetricActive = activeMetricId === m.id}
              <button
                type="button"
                onclick={() => handleMetricChange(m.id)}
                class="py-1 px-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer truncate {isMetricActive
                  ? 'bg-sky-500 text-white font-bold shadow border border-sky-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}"
                title={m.label}
              >
                <Activity class="w-3 h-3 shrink-0" />
                <span class="truncate">{m.label}</span>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Camera Presets Section (Dynamic Jump Continent / Region Pills) -->
      {#if activeApp.cameraPresets && Object.keys(activeApp.cameraPresets).length > 0}
        <div>
          <div class="flex items-center gap-1 mb-1.5">
            <Compass class="w-3 h-3 text-sky-400 shrink-0" />
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Lompat Wilayah
            </span>
          </div>
          <div class="flex flex-wrap gap-1">
            {#each Object.keys(activeApp.cameraPresets) as presetKey}
              {@const isPresetActive = activeRegion === presetKey}
              <button
                type="button"
                onclick={() => handleCameraPreset(presetKey)}
                class="py-0.5 px-2 rounded-md text-[10px] font-medium border transition cursor-pointer {isPresetActive
                  ? 'bg-sky-500 text-white font-bold border-sky-400'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/80 hover:text-white hover:bg-slate-700/70'}"
              >
                {formatPresetLabel(presetKey)}
              </button>
            {/each}
          </div>
        </div>
      {/if}

    </div>

  </div>
</div>
