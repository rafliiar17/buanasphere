<script lang="ts">
  import { 
    Plane, 
    Search, 
    RotateCcw, 
    SlidersHorizontal, 
    Eye, 
    EyeOff, 
    Zap,
    Users,
    DollarSign,
    ExternalLink
  } from 'lucide-svelte';
  import type { CountrySpatialMetadata } from '$lib/framework/geoglobe/types';
  import { EXTENDED_COUNTRIES_DATA } from '$lib/framework/geoglobe/countrySpatialData';
  import { geoStore } from '$lib/framework/geoglobe/geoStore.svelte';

  interface Props {
    onSelectCountry?: (iso3: string) => void;
    onResetView?: () => void;
  }

  let { onSelectCountry, onResetView }: Props = $props();

  const corridorRegion = $derived(geoStore.flightCorridorFilter);
  let searchQuery = $state('');
  let isSearchDropdownOpen = $state(false);

  const REMITTANCE_HUBS: Record<string, { volumeM: number; workers: number; region: string }> = {
    SAU: { volumeM: 3200, workers: 950000, region: 'mideast' },
    MYS: { volumeM: 2800, workers: 1400000, region: 'asean' },
    TWN: { volumeM: 1900, workers: 320000, region: 'eastasia' },
    HKG: { volumeM: 1600, workers: 170000, region: 'eastasia' },
    SGP: { volumeM: 1500, workers: 140000, region: 'asean' },
    JPN: { volumeM: 1100, workers: 85000, region: 'eastasia' },
    USA: { volumeM: 950, workers: 65000, region: 'west' },
    KOR: { volumeM: 800, workers: 55000, region: 'eastasia' },
    ARE: { volumeM: 750, workers: 60000, region: 'mideast' },
    AUS: { volumeM: 620, workers: 45000, region: 'west' },
  };

  const selectedCountry = $derived(geoStore.selectedCountry);
  const selectedHub = $derived(REMITTANCE_HUBS[selectedCountry.iso3]);

  // Search Results
  const searchResults = $derived.by(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return EXTENDED_COUNTRIES_DATA.filter(
      (c) =>
        c.countryName.toLowerCase().includes(q) ||
        c.capital.toLowerCase().includes(q) ||
        c.iso3.toLowerCase().includes(q)
    ).slice(0, 8);
  });

  function handleCountrySelect(iso3: string) {
    geoStore.selectCountry(iso3);
    searchQuery = '';
    isSearchDropdownOpen = false;
    onSelectCountry?.(iso3);
  }
</script>

<!-- Floating Top-Right Controls Card -->
<div class="absolute top-4 right-4 z-20 w-80 sm:w-88 flex flex-col gap-3 pointer-events-auto select-none">
  <div class="rounded-3xl border border-slate-700/80 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-xl text-slate-100 transition-all duration-200">
    <!-- Header -->
    <div class="flex items-center justify-between pb-3 border-b border-slate-800">
      <div class="flex items-center gap-2">
        <Plane class="w-4 h-4 text-emerald-400" />
        <span class="text-xs font-bold tracking-tight text-white uppercase">Pusat Koridor Penerbangan 3D</span>
      </div>
      <div class="flex items-center gap-1">
        <button
          type="button"
          onclick={onResetView}
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
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
          placeholder="Cari rute negara (Arab Saudi, Malaysia)..."
          bind:value={searchQuery}
          onfocus={() => { isSearchDropdownOpen = true; }}
          class="w-full pl-9 pr-8 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
        />
      </div>

      <!-- Search Dropdown List -->
      {#if isSearchDropdownOpen && searchResults.length > 0}
        <div class="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl z-30 divide-y divide-slate-800">
          {#each searchResults as item}
            {@const hub = REMITTANCE_HUBS[item.iso3]}
            <button
              type="button"
              onclick={() => handleCountrySelect(item.iso3)}
              class="w-full px-3 py-2 text-left hover:bg-slate-800/80 flex items-center justify-between transition text-xs"
            >
              <div class="flex items-center gap-2 truncate">
                <span>{item.flagEmoji}</span>
                <span class="font-medium text-white truncate">{item.countryName}</span>
              </div>
              <span class="text-[11px] font-mono font-bold {hub ? 'text-emerald-400' : 'text-slate-500'}">
                {hub ? `$${hub.volumeM}M USD` : 'Non-Hub'}
              </span>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Projection Toggle & 3D Arcs Toggle -->
    <div class="mt-3 grid grid-cols-2 gap-2">
      <button
        type="button"
        onclick={() => geoStore.setProjection(geoStore.projectionMode === 'globe' ? 'flat' : 'globe')}
        class="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl border text-xs font-semibold transition {geoStore.projectionMode === 'globe' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800/80 text-slate-400 border-slate-700'}"
      >
        <span>{geoStore.projectionMode === 'globe' ? '🌍 Globe 3D Arcs' : '🗺️ Peta Datar'}</span>
      </button>

      <button
        type="button"
        onclick={() => { geoStore.showLabels = !geoStore.showLabels; }}
        class="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl border text-xs font-semibold transition {geoStore.showLabels ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-800/80 text-slate-400 border-slate-700'}"
      >
        <Zap class="w-3.5 h-3.5 text-cyan-400" />
        <span>Partikel 3D: ON</span>
      </button>
    </div>

    <!-- Regional Hub Filters -->
    <div class="mt-3">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Pilihan Koridor Rute</span>
      <div class="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onclick={() => geoStore.setFlightCorridorFilter('all')}
          class="py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer {corridorRegion === 'all' ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <span>🇮🇩 Semua Rute (10 Hub)</span>
        </button>

        <button
          type="button"
          onclick={() => geoStore.setFlightCorridorFilter('mideast')}
          class="py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer {corridorRegion === 'mideast' ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <span>🕌 Timur Tengah</span>
        </button>

        <button
          type="button"
          onclick={() => geoStore.setFlightCorridorFilter('asean')}
          class="py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer {corridorRegion === 'asean' ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <span>🌴 ASEAN Hub</span>
        </button>

        <button
          type="button"
          onclick={() => geoStore.setFlightCorridorFilter('eastasia')}
          class="py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer {corridorRegion === 'eastasia' ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <span>🏯 Asia Timur</span>
        </button>
      </div>
    </div>

    <!-- Active Country Corridor Card -->
    <div class="mt-3 rounded-2xl bg-slate-950/80 border border-slate-800 p-3 space-y-1.5">
      <div class="flex items-center justify-between text-xs">
        <span class="font-bold text-slate-300 flex items-center gap-1.5">
          {selectedCountry.flagEmoji} {selectedCountry.countryName}
        </span>
        <span class="font-bold text-[10px] {selectedHub ? 'text-emerald-400' : 'text-slate-500'}">
          {selectedHub ? 'Koridor Aktif' : 'Non-Koridor'}
        </span>
      </div>

      {#if selectedHub}
        <div class="flex items-center justify-between pt-1">
          <span class="text-[11px] text-slate-400">Volume Remitansi:</span>
          <span class="text-sm font-mono font-extrabold text-emerald-400">
            ${selectedHub.volumeM}M USD/Thn
          </span>
        </div>
      {:else}
        <p class="text-[11px] text-slate-500 pt-1">Pilih salah satu dari 10 koridor utama di globe untuk melihat rute 3D.</p>
      {/if}
    </div>

    <!-- Country Inspector CTA Button -->
    <button
      type="button"
      onclick={() => { geoStore.isInspectorOpen = true; }}
      class="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition flex items-center justify-center gap-2"
    >
      <span>✈️ Inspeksi Rute & Koridor</span>
      <ExternalLink class="w-3.5 h-3.5" />
    </button>
  </div>
</div>
