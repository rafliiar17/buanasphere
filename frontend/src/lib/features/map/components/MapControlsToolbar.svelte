<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    Globe, 
    TrendingUp, 
    Coins, 
    RotateCcw, 
    Calculator, 
    Search, 
    Compass, 
    ChevronRight, 
    MapPin, 
    SlidersHorizontal, 
    ChevronDown, 
    ChevronUp, 
    X,
    ArrowRightLeft
  } from 'lucide-svelte';
  import { t, getLocalizedRegion, getLocalizedCountryName, getLocalizedCurrencyName } from '$lib/i18n';
  import { formatRupiah, formatPercent } from '$lib/formatters/currency';
  import { 
    type MapCountryData, 
    type MetricType, 
    type RegionId, 
    REGION_FILTERS 
  } from '../map-constants';
  import type { MapStateStore } from '../mapState';

  interface Props {
    mapState: MapStateStore;
    mapData: MapCountryData[];
    selectedCountry: MapCountryData;
    calculatedConvertResult: { value: number; formatted: string };
    onSelectCountry: (country: MapCountryData, isExplicitInspect?: boolean) => void;
    onResetView: () => void;
    onToggleProjection: (mode: 'globe' | 'flat') => void;
    onToggleMetric: (metric: MetricType) => void;
    onSelectRegion: (regionId: RegionId) => void;
    onToggleLabels: () => void;
    onOpenInspector: () => void;
  }

  let {
    mapState,
    mapData,
    selectedCountry,
    calculatedConvertResult,
    onSelectCountry,
    onResetView,
    onToggleProjection,
    onToggleMetric,
    onSelectRegion,
    onToggleLabels,
    onOpenInspector
  }: Props = $props();

  let searchInputRef = $state<HTMLInputElement | null>(null);
  let searchContainerRef = $state<HTMLDivElement | null>(null);
  let regionContainerRef = $state<HTMLDivElement | null>(null);

  const searchResults = $derived.by<MapCountryData[]>(() => {
    return mapState.getSearchResults<MapCountryData>(mapData);
  });

  const currentRegionObj = $derived.by(() => {
    return REGION_FILTERS.find(r => r.id === mapState.activeRegion) || REGION_FILTERS[0];
  });

  function handleSearchKeyDown(e: KeyboardEvent) {
    if (!mapState.isSearchDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        mapState.isSearchDropdownOpen = true;
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (searchResults.length > 0) {
        mapState.highlightedIndex = (mapState.highlightedIndex + 1) % searchResults.length;
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (searchResults.length > 0) {
        mapState.highlightedIndex = (mapState.highlightedIndex - 1 + searchResults.length) % searchResults.length;
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0 && searchResults[mapState.highlightedIndex]) {
        handleSelectFromSearch(searchResults[mapState.highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      mapState.isSearchDropdownOpen = false;
    }
  }

  function handleSelectFromSearch(item: MapCountryData) {
    onSelectCountry(item, true);
  }

  onMount(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef && !searchContainerRef.contains(e.target as Node)) {
        mapState.isSearchDropdownOpen = false;
      }
      if (regionContainerRef && !regionContainerRef.contains(e.target as Node)) {
        mapState.isRegionDropdownOpen = false;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        mapState.isSearchDropdownOpen = false;
        mapState.isRegionDropdownOpen = false;
      }
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && document.activeElement !== searchInputRef)) {
        e.preventDefault();
        searchInputRef?.focus();
        mapState.isSearchDropdownOpen = true;
      }
    };

    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  });
</script>

<!-- Top-Left Floating Live Status Pill -->
<div class="absolute top-4 left-4 z-10 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[var(--bg-raised)]/85 border border-[var(--bg-rule)] text-xs font-semibold text-[var(--ink)] backdrop-blur-xl shadow-xl">
  <div class="flex items-center gap-2">
    <span class="relative flex h-2.5 w-2.5">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
    </span>
    <span class="font-bold tracking-tight">Kurs.World</span>
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
        onclick={onResetView}
        class="p-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-rule)] text-[var(--ink-3)] hover:text-[var(--ink)] transition text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
        title={t('map.resetZoom')}
      >
        <RotateCcw class="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onclick={() => (mapState.isControlsCollapsed = !mapState.isControlsCollapsed)}
        class="p-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-rule)] text-[var(--ink-3)] hover:text-[var(--ink)] transition cursor-pointer"
        aria-label={t('map.togglePanel')}
      >
        {#if mapState.isControlsCollapsed}
          <ChevronDown class="w-4 h-4" />
        {:else}
          <ChevronUp class="w-4 h-4" />
        {/if}
      </button>
    </div>
  </div>

  {#if !mapState.isControlsCollapsed}
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
            bind:value={mapState.searchQuery}
            oninput={(e) => {
              mapState.searchQuery = (e.target as HTMLInputElement).value;
              mapState.isSearchDropdownOpen = true;
              mapState.highlightedIndex = 0;
            }}
            onfocus={() => {
              mapState.isSearchDropdownOpen = true;
            }}
            onkeydown={handleSearchKeyDown}
            placeholder={t('map.searchPlaceholder')}
            class="w-full bg-[var(--bg-subtle)] border border-[var(--bg-rule)] hover:border-[var(--ink-4)] focus:border-sky-500 rounded-xl pl-9 pr-14 py-2 text-xs text-[var(--ink)] placeholder:text-[var(--ink-4)] outline-none transition shadow-inner font-medium"
          />
          <div class="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
            {#if mapState.searchQuery}
              <button
                type="button"
                onclick={() => { mapState.searchQuery = ''; searchInputRef?.focus(); }}
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
        {#if mapState.isSearchDropdownOpen}
          <div class="absolute top-full left-0 right-0 mt-2 z-50 bg-[var(--bg-raised)] border border-[var(--bg-rule)] rounded-xl shadow-2xl backdrop-blur-2xl max-h-64 overflow-y-auto divide-y divide-[var(--bg-rule)] scrollbar-thin">
            {#if searchResults.length > 0}
              <div class="px-3 py-1.5 text-[10px] font-bold text-[var(--ink-4)] uppercase tracking-wider bg-[var(--bg-subtle)] flex items-center justify-between">
                <span>{mapState.searchQuery ? t('map.countriesFound', { count: searchResults.length }) : t('map.popularRecommendations')}</span>
                <span class="text-[9px] text-sky-400 font-normal">{t('map.selectKey')}</span>
              </div>
              {#each searchResults as item, index}
                {@const isHighlighted = mapState.highlightedIndex === index}
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
                        <span>{getLocalizedCountryName(item.iso3, item.countryName)}</span>
                        <span class="text-[9px] font-semibold px-1 py-0.2 rounded bg-[var(--bg-subtle)] text-[var(--ink-3)]">{item.currencyCode}</span>
                      </div>
                      <div class="text-[10px] text-[var(--ink-4)] truncate">
                        {getLocalizedCurrencyName(item.currencyCode, item.currencyName)} • {getLocalizedRegion(item.regionId)}
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
                <p class="font-bold text-[var(--ink)]">{t('map.noCountriesFound')}</p>
                <p class="text-[11px] mt-0.5">{t('map.noResultsFor', { query: mapState.searchQuery })}</p>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- 3. Section: Tampilan Peta & Lapisan (Projection + 3D Pin Switch) -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--ink-4)]">
          <span>{t('map.viewAndLayers')}</span>
          {#if mapState.projectionMode === 'globe'}
            <button
              type="button"
              onclick={onToggleLabels}
              class={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition border cursor-pointer ${
                mapState.showLabels
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-[var(--bg-subtle)] border-[var(--bg-rule)] text-[var(--ink-4)] hover:text-[var(--ink)]'
              }`}
              title={t('map.togglePinLabels')}
            >
              <MapPin class="w-2.5 h-2.5" />
              <span>{t('map.pinLabels')}: {mapState.showLabels ? 'ON' : 'OFF'}</span>
            </button>
          {/if}
        </div>

        <!-- Segmented Projection Switcher -->
        <div class="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)]">
          <button
            type="button"
            onclick={() => onToggleProjection('globe')}
            class={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              mapState.projectionMode === 'globe'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
            }`}
          >
            <Globe class="w-3.5 h-3.5" />
            <span>{t('map.projectionGlobe')}</span>
          </button>
          <button
            type="button"
            onclick={() => onToggleProjection('flat')}
            class={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              mapState.projectionMode === 'flat'
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
            onclick={() => onToggleMetric('rate')}
            class={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              mapState.activeMetric === 'rate'
                ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold'
                : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
            }`}
          >
            <Coins class="w-3.5 h-3.5" />
            <span>{t('map.modeRate')}</span>
          </button>
          <button
            type="button"
            onclick={() => onToggleMetric('change')}
            class={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              mapState.activeMetric === 'change'
                ? 'bg-indigo-500 text-white shadow-md font-extrabold'
                : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
            }`}
          >
            <TrendingUp class="w-3.5 h-3.5" />
            <span>{t('map.modeChange')}</span>
          </button>
          <button
            type="button"
            onclick={() => onToggleMetric('flag')}
            class={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              mapState.activeMetric === 'flag'
                ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
            }`}
          >
            <span>🏁</span>
            <span>{t('map.modeFlag').replace(' 🏁', '')}</span>
          </button>
        </div>
      </div>

      <!-- 5. Section: Filter Kawasan Dunia (Clean Dropdown Selector) -->
      <div class="space-y-1.5" bind:this={regionContainerRef}>
        <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-4)]">
          {t('map.regionFilter')}
        </span>
        <div class="relative">
          <button
            type="button"
            onclick={() => (mapState.isRegionDropdownOpen = !mapState.isRegionDropdownOpen)}
            class="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)] hover:border-sky-500/60 text-xs font-bold text-[var(--ink)] transition shadow-sm cursor-pointer"
          >
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-base">{currentRegionObj.emoji}</span>
              <span class="truncate">{getLocalizedRegion(currentRegionObj.id)}</span>
            </div>
            <div class="flex items-center gap-1.5 text-[var(--ink-4)] shrink-0">
              <span class="text-[10px] font-normal px-1.5 py-0.5 rounded bg-[var(--bg-raised)]">
                {mapState.activeRegion === 'all' ? t('map.countryCount', { count: '195+' }) : t('map.countryCount', { count: currentRegionObj.iso3List?.length || 0 })}
              </span>
              <ChevronDown class={`w-3.5 h-3.5 transition-transform duration-200 ${mapState.isRegionDropdownOpen ? 'rotate-180 text-sky-400' : ''}`} />
            </div>
          </button>

          {#if mapState.isRegionDropdownOpen}
            <div class="absolute bottom-full left-0 right-0 mb-2 z-50 bg-[var(--bg-raised)] border border-[var(--bg-rule)] rounded-xl shadow-2xl backdrop-blur-2xl max-h-56 overflow-y-auto divide-y divide-[var(--bg-rule)] scrollbar-thin">
              <div class="px-3 py-1.5 text-[10px] font-bold text-[var(--ink-4)] uppercase tracking-wider bg-[var(--bg-subtle)]">
                {t('map.selectFocusRegion')}
              </div>
              {#each REGION_FILTERS as reg}
                {@const isActive = mapState.activeRegion === reg.id}
                <button
                  type="button"
                  onclick={() => {
                    onSelectRegion(reg.id);
                    mapState.isRegionDropdownOpen = false;
                  }}
                  class={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition cursor-pointer ${
                    isActive ? 'bg-sky-500/20 text-sky-300 font-extrabold' : 'hover:bg-[var(--bg-subtle)] text-[var(--ink)]'
                  }`}
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-base shrink-0">{reg.emoji}</span>
                    <span class="text-xs truncate">{getLocalizedRegion(reg.id)}</span>
                  </div>
                  <span class={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${isActive ? 'bg-sky-500/30 text-sky-200' : 'bg-[var(--bg-subtle)] text-[var(--ink-4)]'}`}>
                    {reg.id === 'all' ? '195+' : t('map.countryCount', { count: reg.iso3List?.length || 0 })}
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
            onclick={() => mapState.toggleConvertDirection()}
            class="hover:text-sky-400 flex items-center gap-1 transition cursor-pointer"
          >
            <ArrowRightLeft class="w-3 h-3" />
            <span>{mapState.convertDirection === 'foreign_to_idr' ? `${selectedCountry.currencyCode} ➔ IDR` : `IDR ➔ ${selectedCountry.currencyCode}`}</span>
          </button>
        </div>

        <!-- Input & Live Result Row -->
        <div class="flex items-center gap-2">
          <div class="relative flex-1">
            <input
              type="number"
              bind:value={mapState.convertAmount}
              min="1"
              step="any"
              class="w-full bg-[var(--bg-raised)] border border-[var(--bg-rule)] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[var(--ink)] outline-none focus:border-sky-500 font-mono"
            />
            <span class="absolute right-2 top-1.5 text-[10px] text-[var(--ink-4)] font-bold">
              {mapState.convertDirection === 'foreign_to_idr' ? selectedCountry.currencyCode : 'IDR'}
            </span>
          </div>
          <div class="flex-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 text-right truncate font-mono">
            {calculatedConvertResult.formatted}
          </div>
        </div>

        <!-- Inspect Selected Country Action Button -->
        <button
          type="button"
          onclick={onOpenInspector}
          class="w-full py-2 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>{selectedCountry.flag} {t('map.inspectCountry')}: {getLocalizedCountryName(selectedCountry.iso3, selectedCountry.countryName)}</span>
          <ChevronRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  {/if}
</div>
