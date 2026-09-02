<script lang="ts">
  import { 
    Search, 
    RotateCcw, 
    SlidersHorizontal, 
    Layers, 
    Eye, 
    EyeOff, 
    ArrowRightLeft,
    TrendingUp,
    Coins,
    Flag,
    Check,
    ChevronDown,
    ExternalLink
  } from 'lucide-svelte';
  import type { MapCountryData, MetricType, RegionId } from '$lib/features/map/map-constants';
  import { REGION_FILTERS } from '$lib/features/map/map-constants';
  import { t } from '$lib/i18n';
  import type { createMapState } from '$lib/features/map/mapState.svelte';

  interface Props {
    mapState: ReturnType<typeof createMapState>;
    mapData: MapCountryData[];
    selectedCountry: MapCountryData;
    calculatedConvertResult: { value: number; formatted: string };
    onSelectCountry: (country: MapCountryData, explicitInspect?: boolean) => void;
    onResetView: () => void;
    onToggleProjection: (mode: 'globe' | 'flat') => void;
    onToggleMetric: (metric: MetricType) => void;
    onSelectRegion: (region: RegionId) => void;
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
    onOpenInspector,
  }: Props = $props();

  const searchResults = $derived(mapState.getSearchResults(mapData));

  function handleSearchSelect(country: MapCountryData) {
    onSelectCountry(country, false);
  }

  function handleRegionSelect(regionId: RegionId) {
    onSelectRegion(regionId);
    mapState.isRegionDropdownOpen = false;
  }

  function handleConvertDirectionToggle() {
    mapState.toggleConvertDirection();
  }
</script>

<!-- Floating Top-Right Controls Card -->
<div class="absolute top-4 right-4 z-20 w-80 sm:w-88 flex flex-col gap-3 pointer-events-auto select-none">
  <div class="rounded-3xl border border-slate-700/80 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-xl text-slate-100 transition-all duration-200">
    <!-- Header -->
    <div class="flex items-center justify-between pb-3 border-b border-slate-800">
      <div class="flex items-center gap-2">
        <SlidersHorizontal class="w-4 h-4 text-cyan-400" />
        <span class="text-xs font-bold tracking-tight text-white uppercase">Pusat Kontrol Kurs Valas</span>
      </div>
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          onclick={() => mapState.togglePerformanceMode()}
          class="flex items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold border transition cursor-pointer {mapState.performanceMode === 'turbo' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}"
          title="Mode Performa (Turbo 60 FPS / High Quality)"
        >
          <span>{mapState.performanceMode === 'turbo' ? '⚡ 60 FPS' : '✨ Quality'}</span>
        </button>

        <button
          type="button"
          onclick={onResetView}
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Reset Sudut Pandang"
        >
          <RotateCcw class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Autocomplete Search Input -->
    <div class="relative mt-3">
      <div class="relative flex items-center">
        <Search class="absolute left-3 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Cari negara, mata uang (USD, JPY)..."
          bind:value={mapState.searchQuery}
          onfocus={() => { mapState.isSearchDropdownOpen = true; }}
          class="w-full pl-9 pr-8 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
        />
      </div>

      <!-- Search Dropdown List -->
      {#if mapState.isSearchDropdownOpen && searchResults.length > 0}
        <div class="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl z-30 divide-y divide-slate-800">
          {#each searchResults as item}
            <button
              type="button"
              onclick={() => handleSearchSelect(item)}
              class="w-full px-3 py-2 text-left hover:bg-slate-800/80 flex items-center justify-between transition text-xs"
            >
              <div class="flex items-center gap-2 truncate">
                <span>{item.flag}</span>
                <span class="font-medium text-white truncate">{item.countryName}</span>
                <span class="text-[10px] text-slate-400 font-mono">{item.currencyCode}</span>
              </div>
              <span class="text-[10px] font-mono font-bold text-emerald-400">Rp {item.middleRate.toLocaleString('id-ID')}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Projection Toggle & 3D Labels Toggle -->
    <div class="mt-3 grid grid-cols-2 gap-2">
      <button
        type="button"
        onclick={() => onToggleProjection(mapState.projectionMode === 'globe' ? 'flat' : 'globe')}
        class="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl border text-xs font-semibold transition {mapState.projectionMode === 'globe' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-800/80 text-slate-400 border-slate-700'}"
      >
        <span>{mapState.projectionMode === 'globe' ? '🌍 Globe 3D' : '🗺️ Peta Datar'}</span>
      </button>

      <button
        type="button"
        onclick={onToggleLabels}
        class="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl border text-xs font-semibold transition {mapState.showLabels ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800/80 text-slate-400 border-slate-700'}"
      >
        {#if mapState.showLabels}
          <Eye class="w-3.5 h-3.5" />
          <span>Label 3D: ON</span>
        {:else}
          <EyeOff class="w-3.5 h-3.5" />
          <span>Label 3D: OFF</span>
        {/if}
      </button>
    </div>

    <!-- Metric Switcher Pills -->
    <div class="mt-3">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Pewarnaan Metrik</span>
      <div class="grid grid-cols-3 gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
        <button
          type="button"
          onclick={() => onToggleMetric('rate')}
          class="py-1 px-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 {mapState.activeMetric === 'rate' ? 'bg-cyan-500 text-slate-950 shadow font-extrabold' : 'text-slate-400 hover:text-white'}"
        >
          <Coins class="w-3 h-3" />
          <span>Kurs</span>
        </button>

        <button
          type="button"
          onclick={() => onToggleMetric('change')}
          class="py-1 px-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 {mapState.activeMetric === 'change' ? 'bg-cyan-500 text-slate-950 shadow font-extrabold' : 'text-slate-400 hover:text-white'}"
        >
          <TrendingUp class="w-3 h-3" />
          <span>Tren 24h</span>
        </button>

        <button
          type="button"
          onclick={() => onToggleMetric('flag')}
          class="py-1 px-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 {mapState.activeMetric === 'flag' ? 'bg-cyan-500 text-slate-950 shadow font-extrabold' : 'text-slate-400 hover:text-white'}"
        >
          <Flag class="w-3 h-3" />
          <span>Bendera</span>
        </button>
      </div>
    </div>

    <!-- Quick Mini Converter Box -->
    <div class="mt-3 rounded-2xl bg-slate-950/80 border border-slate-800 p-3 space-y-2">
      <div class="flex items-center justify-between text-[11px]">
        <span class="font-bold text-slate-300">Kalkulator Valas Kilat</span>
        <button
          type="button"
          onclick={handleConvertDirectionToggle}
          class="flex items-center gap-1 text-[10px] font-medium text-cyan-400 hover:text-cyan-300 transition"
        >
          <ArrowRightLeft class="w-3 h-3" />
          <span>{mapState.convertDirection === 'foreign_to_idr' ? `${selectedCountry.currencyCode} ➔ IDR` : `IDR ➔ ${selectedCountry.currencyCode}`}</span>
        </button>
      </div>

      <div class="flex items-center gap-2">
        <input
          type="number"
          bind:value={mapState.convertAmount}
          class="w-24 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white text-right focus:outline-none focus:border-cyan-500"
        />
        <div class="flex-1 text-right font-mono font-extrabold text-xs text-emerald-400 truncate">
          {calculatedConvertResult.formatted}
        </div>
      </div>
    </div>

    <!-- Country Inspector CTA Button -->
    <button
      type="button"
      onclick={onOpenInspector}
      class="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 transition flex items-center justify-center gap-2"
    >
      <span>{selectedCountry.flag} Inspeksi {selectedCountry.countryName}</span>
      <ExternalLink class="w-3.5 h-3.5" />
    </button>
  </div>
</div>
