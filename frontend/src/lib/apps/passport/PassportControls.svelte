<script lang="ts">
  import { 
    BookOpen, 
    Search, 
    RotateCcw, 
    SlidersHorizontal, 
    Eye, 
    EyeOff, 
    Award,
    ShieldCheck,
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

  const visaFilter = $derived(geoStore.passportVisaFilter);
  let searchQuery = $state('');
  let isSearchDropdownOpen = $state(false);

  const PASSPORT_SCORES: Record<string, { visaFree: number; rank: number; indoRequirement: 'Visa Free' | 'Visa on Arrival' | 'eVisa' | 'Visa Required' }> = {
    SGP: { visaFree: 195, rank: 1, indoRequirement: 'Visa Free' },
    JPN: { visaFree: 194, rank: 2, indoRequirement: 'Visa Free' },
    DEU: { visaFree: 193, rank: 3, indoRequirement: 'Visa Required' },
    FRA: { visaFree: 193, rank: 3, indoRequirement: 'Visa Required' },
    ITA: { visaFree: 193, rank: 3, indoRequirement: 'Visa Required' },
    ESP: { visaFree: 193, rank: 3, indoRequirement: 'Visa Required' },
    KOR: { visaFree: 192, rank: 4, indoRequirement: 'Visa Free' },
    GBR: { visaFree: 191, rank: 5, indoRequirement: 'Visa Required' },
    USA: { visaFree: 188, rank: 8, indoRequirement: 'Visa Required' },
    MYS: { visaFree: 183, rank: 12, indoRequirement: 'Visa Free' },
    ARE: { visaFree: 182, rank: 13, indoRequirement: 'eVisa' },
    BRN: { visaFree: 166, rank: 20, indoRequirement: 'Visa Free' },
    THA: { visaFree: 82, rank: 64, indoRequirement: 'Visa Free' },
    IDN: { visaFree: 78, rank: 68, indoRequirement: 'Visa Free' },
    PHL: { visaFree: 69, rank: 75, indoRequirement: 'Visa Free' },
    VNM: { visaFree: 55, rank: 88, indoRequirement: 'Visa Free' },
    IND: { visaFree: 62, rank: 80, indoRequirement: 'Visa on Arrival' },
    CHN: { visaFree: 85, rank: 60, indoRequirement: 'Visa Required' },
    SAU: { visaFree: 88, rank: 58, indoRequirement: 'eVisa' },
    TUR: { visaFree: 118, rank: 52, indoRequirement: 'Visa Free' },
  };

  const selectedCountry = $derived(geoStore.selectedCountry);
  const selectedScore = $derived(
    PASSPORT_SCORES[selectedCountry.iso3] ?? {
      visaFree: Math.max(40, Math.min(170, Math.round(75 + selectedCountry.lat * 0.5))),
      rank: 70,
      indoRequirement: 'Visa Required',
    }
  );

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
        <BookOpen class="w-4 h-4 text-emerald-400" />
        <span class="text-xs font-bold tracking-tight text-white uppercase">Pusat Kekuatan Paspor</span>
      </div>
      <div class="flex items-center gap-1.5">

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
          placeholder="Cari paspor negara (Singapura, Jepang)..."
          bind:value={searchQuery}
          onfocus={() => { isSearchDropdownOpen = true; }}
          class="w-full pl-9 pr-8 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
        />
      </div>

      <!-- Search Dropdown List -->
      {#if isSearchDropdownOpen && searchResults.length > 0}
        <div class="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl z-30 divide-y divide-slate-800">
          {#each searchResults as item}
            {@const itemScore = PASSPORT_SCORES[item.iso3] ?? { visaFree: 75, rank: 70, indoRequirement: 'Visa Required' }}
            <button
              type="button"
              onclick={() => handleCountrySelect(item.iso3)}
              class="w-full px-3 py-2 text-left hover:bg-slate-800/80 flex items-center justify-between transition text-xs"
            >
              <div class="flex items-center gap-2 truncate">
                <span>{item.flagEmoji}</span>
                <span class="font-medium text-white truncate">{item.countryName}</span>
              </div>
              <span class="text-[10px] font-mono font-bold text-emerald-400">Rank #{itemScore.rank} ({itemScore.visaFree} Bebas)</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Projection Toggle & 3D Labels Toggle -->
    <div class="mt-3 grid grid-cols-2 gap-2">
      <button
        type="button"
        onclick={() => geoStore.setProjection(geoStore.projectionMode === 'globe' ? 'flat' : 'globe')}
        class="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl border text-xs font-semibold transition {geoStore.projectionMode === 'globe' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800/80 text-slate-400 border-slate-700'}"
      >
        <span>{geoStore.projectionMode === 'globe' ? '🌍 Globe 3D Heatmap' : '🗺️ Peta Datar'}</span>
      </button>

      <button
        type="button"
        onclick={() => { geoStore.showLabels = !geoStore.showLabels; }}
        class="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl border text-xs font-semibold transition {geoStore.showLabels ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-800/80 text-slate-400 border-slate-700'}"
      >
        <span>{geoStore.showLabels ? 'Label Rank: ON' : 'Label Rank: OFF'}</span>
      </button>
    </div>

    <!-- Visa Filter Options for Indonesian Citizens -->
    <div class="mt-3">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Syarat Izin Masuk bagi WNI</span>
      <div class="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onclick={() => geoStore.setPassportVisaFilter('all')}
          class="py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer {visaFilter === 'all' ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <span>🌐 Semua Paspor</span>
        </button>

        <button
          type="button"
          onclick={() => geoStore.setPassportVisaFilter('free')}
          class="py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer {visaFilter === 'free' ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <span>🟢 Bebas Visa WNI</span>
        </button>

        <button
          type="button"
          onclick={() => geoStore.setPassportVisaFilter('voa')}
          class="py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer {visaFilter === 'voa' ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <span>🟡 VoA / eVisa</span>
        </button>

        <button
          type="button"
          onclick={() => geoStore.setPassportVisaFilter('required')}
          class="py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer {visaFilter === 'required' ? 'bg-rose-500 text-slate-950 border-rose-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <span>🔴 Butuh Visa</span>
        </button>
      </div>
    </div>

    <!-- Active Country Passport Card -->
    <div class="mt-3 rounded-2xl bg-slate-950/80 border border-slate-800 p-3 space-y-1.5">
      <div class="flex items-center justify-between text-xs">
        <span class="font-bold text-slate-300 flex items-center gap-1.5">
          {selectedCountry.flagEmoji} {selectedCountry.countryName}
        </span>
        <span class="font-bold font-mono text-[10px] text-emerald-400">
          Rank #{selectedScore.rank}
        </span>
      </div>

      <div class="flex items-center justify-between pt-1">
        <span class="text-[11px] text-slate-400">Akses Bebas Visa:</span>
        <span class="text-sm font-mono font-extrabold text-white">
          {selectedScore.visaFree} Negara
        </span>
      </div>

      <div class="text-[10px] pt-1 text-slate-400 border-t border-slate-800 flex justify-between">
        <span>Bagi Warga Indonesia:</span>
        <span class="font-bold text-cyan-400">{selectedScore.indoRequirement}</span>
      </div>
    </div>

    <!-- Country Inspector CTA Button -->
    <button
      type="button"
      onclick={() => { geoStore.isInspectorOpen = true; }}
      class="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition flex items-center justify-center gap-2"
    >
      <span>🛂 Inspeksi Paspor & Visa</span>
      <ExternalLink class="w-3.5 h-3.5" />
    </button>
  </div>
</div>
