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
    Globe,
    RotateCw,
    Check,
    ChevronDown,
    ExternalLink,
    Sparkles
  } from 'lucide-svelte';
  import type { MapCountryData, MetricType, RegionId } from '$lib/features/map/map-constants';
  import { REGION_FILTERS } from '$lib/features/map/map-constants';
  import { t } from '$lib/i18n';
  import type { createMapState } from '$lib/features/map/mapState.svelte';
  import { geoStore } from '$lib/framework/geoglobe/geoStore.svelte';

  interface Props {
    mapState: ReturnType<typeof createMapState>;
    mapData: MapCountryData[];
    selectedCountry: MapCountryData;
    calculatedConvertResult: { value: number; formatted: string };
    onSelectCountry: (country: MapCountryData, explicitInspect?: boolean) => void;
    onResetView: () => void;
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
    onToggleMetric,
    onSelectRegion,
    onToggleLabels,
    onOpenInspector,
  }: Props = $props();

  const searchResults = $derived(mapState.getSearchResults(mapData));

  // Quick Preset Nominal Chips (ADR 0036)
  const presetAmounts = $derived.by(() => {
    if (mapState.convertDirection === 'foreign_to_idr') {
      return [1, 5, 10, 50, 100, 1000];
    }
    return [10000, 50000, 100000, 500000, 1000000, 5000000];
  });

  // Benchmark Currencies for Multi-Valas Comparison
  const BENCHMARK_CURRENCIES = [
    { code: 'IDR', flag: '🇮🇩', name: 'Rupiah', symbol: 'Rp', isIdr: true },
    { code: 'USD', flag: '🇺🇸', name: 'US Dollar', symbol: '$', isIdr: false },
    { code: 'EUR', flag: '🇪🇺', name: 'Euro', symbol: '€', isIdr: false },
    { code: 'SGD', flag: '🇸🇬', name: 'SG Dollar', symbol: 'S$', isIdr: false },
    { code: 'MYR', flag: '🇲🇾', name: 'Ringgit', symbol: 'RM', isIdr: false },
    { code: 'JPY', flag: '🇯🇵', name: 'Yen', symbol: '¥', isIdr: false },
    { code: 'AUD', flag: '🇦🇺', name: 'AU Dollar', symbol: 'A$', isIdr: false },
    { code: 'GBP', flag: '🇬🇧', name: 'Pound', symbol: '£', isIdr: false },
    { code: 'CNY', flag: '🇨🇳', name: 'Yuan', symbol: '¥', isIdr: false },
    { code: 'SAR', flag: '🇸🇦', name: 'Riyal', symbol: 'SR', isIdr: false },
  ];

  // Dynamic Multi-Currency Comparison List (ADR 0036)
  const multiCurrencyComparisons = $derived.by(() => {
    const amt = Number(mapState.convertAmount) || 0;
    if (amt <= 0) return [];

    const isForeignToIdr = mapState.convertDirection === 'foreign_to_idr';
    const sourceMiddleRate = isForeignToIdr ? selectedCountry.middleRate : 1;
    const idrTotal = isForeignToIdr ? amt * sourceMiddleRate : amt;

    return BENCHMARK_CURRENCIES.map((b) => {
      let targetRate = 1;
      if (!b.isIdr) {
        const found = mapData.find((d) => d.currencyCode === b.code);
        targetRate = found?.middleRate || (b.code === 'USD' ? 15850 : b.code === 'EUR' ? 17200 : b.code === 'SGD' ? 11900 : b.code === 'MYR' ? 3580 : b.code === 'JPY' ? 104 : b.code === 'AUD' ? 10350 : b.code === 'GBP' ? 20100 : b.code === 'CNY' ? 2190 : 4225);
      }

      const val = b.isIdr ? idrTotal : (targetRate > 0 ? idrTotal / targetRate : 0);

      let formatted = '';
      if (b.isIdr) {
        formatted = `Rp ${Math.round(val).toLocaleString('id-ID')}`;
      } else if (val >= 100) {
        formatted = `${b.symbol} ${val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      } else if (val >= 1) {
        formatted = `${b.symbol} ${val.toFixed(2)}`;
      } else {
        formatted = `${b.symbol} ${val.toFixed(4)}`;
      }

      return {
        code: b.code,
        flag: b.flag,
        name: b.name,
        symbol: b.symbol,
        value: val,
        formatted,
        isSelected: b.code === selectedCountry.currencyCode,
      };
    });
  });

  function handleSearchSelect(country: MapCountryData) {
    onSelectCountry(country, false);
    geoStore.travelToCountry?.(country.iso3);
  }

  function handleSearchKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && searchResults.length > 0) {
      e.preventDefault();
      handleSearchSelect(searchResults[0]);
    }
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
          onclick={onResetView}
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Reset Sudut Pandang"
        >
          <RotateCcw class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- 3-col Grid: Label, Rotasi, Bendera -->
      <div class="grid grid-cols-3 gap-1.5">
        <!-- 1. Label 3D Toggle -->
        <button
          type="button"
          onclick={onToggleLabels}
          class="flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-xl border text-[11px] font-semibold transition cursor-pointer {mapState.showLabels ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800/80 text-slate-400 border-slate-700'}"
        >
          {#if mapState.showLabels}
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
          onclick={() => mapState.toggleAutoRotate()}
          class="flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-xl border text-[11px] font-semibold transition cursor-pointer {mapState.autoRotate ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20 font-bold' : 'bg-slate-800/80 text-slate-400 border-slate-700'}"
          title="Putar Otomatis Sudut Pandang Globe"
        >
          <RotateCw class="w-3.5 h-3.5 {mapState.autoRotate ? 'animate-spin' : ''}" />
          <span>Rotasi: {mapState.autoRotate ? 'ON' : 'OFF'}</span>
        </button>

        <!-- 3. Bendera Toggle -->
        <button
          type="button"
          onclick={() => mapState.toggleFlags()}
          class="flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-xl border text-[11px] font-semibold transition cursor-pointer {(mapState.showFlags || mapState.activeMetric === 'flag') ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20 font-bold' : 'bg-slate-800/80 text-slate-400 border-slate-700'}"
          title="Tampilkan Tekstur Bendera Nasional di Setiap Negara"
        >
          <Flag class="w-3.5 h-3.5 text-amber-300" />
          <span>Bendera: {(mapState.showFlags || mapState.activeMetric === 'flag') ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </div>

    <!-- GROUP 2: 🎛️ PUSAT KONTROL KURS VALAS (APP) -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <SlidersHorizontal class="w-4 h-4 text-cyan-400 shrink-0" />
          <span class="text-xs font-bold tracking-tight text-white uppercase">Pusat Kontrol Kurs Valas</span>
        </div>
        <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-bold">App</span>
      </div>

      <!-- Autocomplete Search Input -->
      <div class="relative">
        <div class="relative flex items-center">
          <Search class="absolute left-3 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari negara, mata uang (USD, JPY)..."
            bind:value={mapState.searchQuery}
            onkeydown={handleSearchKeydown}
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
                class="w-full px-3 py-2 text-left hover:bg-slate-800/80 flex items-center justify-between transition text-xs cursor-pointer"
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

      <!-- Pewarnaan Metrik (Grid 2 Kolom) -->
      <div>
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Pewarnaan Metrik</span>
        <div class="grid grid-cols-2 gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onclick={() => onToggleMetric('rate')}
            class="py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer {mapState.activeMetric === 'rate' ? 'bg-cyan-500 text-slate-950 shadow font-extrabold' : 'text-slate-400 hover:text-white'}"
          >
            <Coins class="w-3.5 h-3.5" />
            <span>Kurs Nominal</span>
          </button>

          <button
            type="button"
            onclick={() => onToggleMetric('change')}
            class="py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer {mapState.activeMetric === 'change' ? 'bg-cyan-500 text-slate-950 shadow font-extrabold' : 'text-slate-400 hover:text-white'}"
          >
            <TrendingUp class="w-3.5 h-3.5" />
            <span>Tren 24 Jam</span>
          </button>
        </div>
      </div>

    <!-- Quick Mini Converter & Multi-Valas Comparison Box (ADR 0036) -->
    <div class="mt-3 rounded-2xl bg-slate-950/80 border border-slate-800 p-3 space-y-2.5">
      <div class="flex items-center justify-between text-[11px]">
        <div class="flex items-center gap-1.5 font-bold text-slate-200">
          <Coins class="w-3.5 h-3.5 text-cyan-400" />
          <span>Kalkulator & Komparasi Valas</span>
        </div>
        <button
          type="button"
          onclick={handleConvertDirectionToggle}
          class="flex items-center gap-1 text-[10px] font-medium text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
        >
          <ArrowRightLeft class="w-3 h-3" />
          <span>{mapState.convertDirection === 'foreign_to_idr' ? `${selectedCountry.currencyCode} ➔ IDR` : `IDR ➔ ${selectedCountry.currencyCode}`}</span>
        </button>
      </div>

      <!-- Input & Primary Result Row -->
      <div class="flex items-center gap-2">
        <div class="relative flex-1">
          <input
            type="number"
            bind:value={mapState.convertAmount}
            min="0"
            step="any"
            class="w-full pl-12 pr-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white text-right focus:outline-none focus:border-cyan-500"
          />
          <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-cyan-400 font-mono">
            {mapState.convertDirection === 'foreign_to_idr' ? selectedCountry.currencyCode : 'IDR'}
          </span>
        </div>
        <div class="flex-1 text-right font-mono font-extrabold text-xs text-emerald-400 truncate bg-slate-900/60 border border-slate-800 py-1.5 px-2.5 rounded-xl">
          {calculatedConvertResult.formatted}
        </div>
      </div>

      <!-- Quick Preset Nominal Chips -->
      <div class="flex items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar">
        {#each presetAmounts as p}
          <button
            type="button"
            onclick={() => { mapState.convertAmount = p; }}
            class="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition cursor-pointer shrink-0 {mapState.convertAmount === p ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow' : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'}"
          >
            {#if mapState.convertDirection === 'foreign_to_idr'}
              {p.toLocaleString('id-ID')}
            {:else}
              {p >= 1000000 ? `${p / 1000000}jt` : `${p / 1000}rb`}
            {/if}
          </button>
        {/each}
      </div>

      <!-- Live Dynamic Multi-Currency Comparison Section -->
      <div class="pt-2 border-t border-slate-800/80">
        <div class="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
          <span class="font-bold uppercase tracking-wider">Perbandingan Multi-Valas Sekaligus</span>
          <span class="font-mono text-cyan-400 font-bold">10 Valas Utama</span>
        </div>
        
        <div class="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-0.5 custom-scrollbar">
          {#each multiCurrencyComparisons as comp}
            <div class="flex items-center justify-between p-1.5 rounded-xl border text-[10px] transition {comp.isSelected ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200' : 'bg-slate-900/60 border-slate-800/80 text-slate-300'}">
              <div class="flex items-center gap-1.5 truncate">
                <span>{comp.flag}</span>
                <span class="font-bold text-white">{comp.code}</span>
              </div>
              <span class="font-mono font-extrabold text-emerald-400 truncate">
                {comp.formatted}
              </span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>

    <!-- Country Inspector CTA Button -->
    <button
      type="button"
      onclick={onOpenInspector}
      class="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 transition flex items-center justify-center gap-2 cursor-pointer"
    >
      <span>{selectedCountry.flag} Inspeksi {selectedCountry.countryName}</span>
      <ExternalLink class="w-3.5 h-3.5" />
    </button>
  </div>
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.4);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(6, 182, 212, 0.4);
    border-radius: 9999px;
  }
</style>
