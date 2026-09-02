<script lang="ts">
  import { 
    Trees, 
    Search, 
    RotateCcw, 
    Eye, 
    EyeOff, 
    Sparkles, 
    ShieldAlert, 
    Compass, 
    ExternalLink,
    Leaf,
    Flame
  } from 'lucide-svelte';
  import type { CountrySpatialMetadata } from '$lib/framework/geoglobe/types';
  import { EXTENDED_COUNTRIES_DATA } from '$lib/framework/geoglobe/countrySpatialData';
  import { geoStore } from '$lib/framework/geoglobe/geoStore.svelte';
  import { 
    getFloraFaunaDataForCountry, 
    type FloraFaunaData 
  } from '$lib/framework/geoglobe/data/floraFaunaData';

  interface Props {
    onSelectCountry?: (iso3: string) => void;
    onResetView?: () => void;
  }

  let { onSelectCountry, onResetView }: Props = $props();

  const natureFilter = $derived(geoStore.natureFilter);
  const activeMetric = $derived(geoStore.activeMetricId);
  let searchQuery = $state('');
  let isSearchDropdownOpen = $state(false);

  const selectedCountry = $derived(geoStore.selectedCountry);
  const selectedFloraFauna = $derived<FloraFaunaData>(
    getFloraFaunaDataForCountry(selectedCountry.iso3)
  );

  // Search Results matching country name, animal, or plant
  const searchResults = $derived.by(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return EXTENDED_COUNTRIES_DATA.filter((c) => {
      const bio = getFloraFaunaDataForCountry(c.iso3);
      return (
        c.countryName.toLowerCase().includes(q) ||
        c.capital.toLowerCase().includes(q) ||
        c.iso3.toLowerCase().includes(q) ||
        bio.animal.commonName.toLowerCase().includes(q) ||
        bio.plant.commonName.toLowerCase().includes(q) ||
        bio.primaryBiome.toLowerCase().includes(q)
      );
    }).slice(0, 8);
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
  <div class="rounded-3xl border border-emerald-800/60 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl text-slate-100 transition-all duration-200">
    <!-- Header -->
    <div class="flex items-center justify-between pb-3 border-b border-slate-800">
      <div class="flex items-center gap-2">
        <Trees class="w-4 h-4 text-emerald-400" />
        <span class="text-xs font-bold tracking-tight text-white uppercase">Pusat Biodiversitas Dunia</span>
      </div>
      <div class="flex items-center gap-1">
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
          placeholder="Cari satwa, flora, atau negara (Komodo, Panda, Brazil)..."
          bind:value={searchQuery}
          onfocus={() => { isSearchDropdownOpen = true; }}
          class="w-full pl-9 pr-8 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
        />
      </div>

      <!-- Search Dropdown List -->
      {#if isSearchDropdownOpen && searchResults.length > 0}
        <div class="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl z-30 divide-y divide-slate-800">
          {#each searchResults as item}
            {@const itemBio = getFloraFaunaDataForCountry(item.iso3)}
            <button
              type="button"
              onclick={() => handleCountrySelect(item.iso3)}
              class="w-full px-3 py-2 text-left hover:bg-slate-800/80 flex items-center justify-between transition text-xs cursor-pointer"
            >
              <div class="flex items-center gap-2 truncate">
                <span>{item.flagEmoji}</span>
                <span class="font-medium text-white truncate">{item.countryName}</span>
              </div>
              <span class="text-[10px] font-mono font-bold text-emerald-400 shrink-0">
                {itemBio.animal.emoji} {itemBio.animal.commonName.split('&')[0].trim()}
              </span>
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
        class="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer {geoStore.projectionMode === 'globe' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800/80 text-slate-400 border-slate-700'}"
      >
        <span>{geoStore.projectionMode === 'globe' ? '🌍 Globe 3D Nature' : '🗺️ Peta Datar'}</span>
      </button>

      <button
        type="button"
        onclick={() => { geoStore.showLabels = !geoStore.showLabels; }}
        class="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer {geoStore.showLabels ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' : 'bg-slate-800/80 text-slate-400 border-slate-700'}"
      >
        <span>{geoStore.showLabels ? 'Label Satwa: ON' : 'Label Satwa: OFF'}</span>
      </button>
    </div>

    <!-- Active Visual Metric Selector -->
    <div class="mt-3">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Metrik Visualisasi Globe</span>
      <div class="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onclick={() => geoStore.setMetric('biodiversity')}
          class="py-1.5 px-1 rounded-xl text-[10px] font-bold border transition flex flex-col items-center justify-center gap-0.5 cursor-pointer {activeMetric === 'biodiversity' ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <span>🌿 Indeks Bio</span>
        </button>

        <button
          type="button"
          onclick={() => geoStore.setMetric('iucn_risk')}
          class="py-1.5 px-1 rounded-xl text-[10px] font-bold border transition flex flex-col items-center justify-center gap-0.5 cursor-pointer {activeMetric === 'iucn_risk' ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <span>⚠️ Risiko IUCN</span>
        </button>

        <button
          type="button"
          onclick={() => geoStore.setMetric('biome')}
          class="py-1.5 px-1 rounded-xl text-[10px] font-bold border transition flex flex-col items-center justify-center gap-0.5 cursor-pointer {activeMetric === 'biome' ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <span>🏞️ Tipe Bioma</span>
        </button>
      </div>
    </div>

    <!-- 2-Way Reactive Nature Filters -->
    <div class="mt-3">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Kategori & Habitat Ekologis</span>
      <div class="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onclick={() => geoStore.setNatureFilter('all')}
          class="py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer {natureFilter === 'all' ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <span>🌐 Semua Wilayah</span>
        </button>

        <button
          type="button"
          onclick={() => geoStore.setNatureFilter('megadiverse')}
          class="py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer {natureFilter === 'megadiverse' ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <span>🌟 Megadiverse 17</span>
        </button>

        <button
          type="button"
          onclick={() => geoStore.setNatureFilter('endangered')}
          class="py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer {natureFilter === 'endangered' ? 'bg-rose-500 text-slate-950 border-rose-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <span>🔴 Satwa Terancam</span>
        </button>

        <button
          type="button"
          onclick={() => geoStore.setNatureFilter('rainforest')}
          class="py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer {natureFilter === 'rainforest' ? 'bg-teal-500 text-slate-950 border-teal-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <span>🌴 Hutan Hujan</span>
        </button>

        <button
          type="button"
          onclick={() => geoStore.setNatureFilter('endemic')}
          class="col-span-2 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer {natureFilter === 'endemic' ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <span>🦎 Spesies Endemik Tinggi</span>
        </button>
      </div>
    </div>

    <!-- Active Country Flora & Fauna Summary Card -->
    <div class="mt-3 rounded-2xl bg-slate-950/80 border border-slate-800 p-3 space-y-2">
      <div class="flex items-center justify-between text-xs">
        <span class="font-bold text-slate-300 flex items-center gap-1.5">
          {selectedCountry.flagEmoji} {selectedCountry.countryName}
        </span>
        {#if selectedFloraFauna.isMegadiverse}
          <span class="font-bold text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Top #{selectedFloraFauna.globalBiodiversityRank} Dunia
          </span>
        {:else}
          <span class="font-mono text-[10px] text-slate-400">
            Bio Rank #{selectedFloraFauna.globalBiodiversityRank}
          </span>
        {/if}
      </div>

      <!-- Animal Highlight -->
      <div class="flex items-center justify-between pt-1 text-xs border-t border-slate-900">
        <div class="flex items-center gap-2 truncate">
          <span class="text-base">{selectedFloraFauna.animal.emoji}</span>
          <div class="truncate">
            <div class="font-bold text-white truncate">{selectedFloraFauna.animal.commonName}</div>
            <div class="text-[10px] text-slate-400 italic truncate">{selectedFloraFauna.animal.scientificName}</div>
          </div>
        </div>
        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 {selectedFloraFauna.animal.iucnStatus.includes('Endangered') || selectedFloraFauna.animal.iucnStatus.includes('Critically') ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : selectedFloraFauna.animal.iucnStatus === 'Vulnerable' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}">
          {selectedFloraFauna.animal.iucnStatus}
        </span>
      </div>

      <!-- Plant Highlight -->
      <div class="flex items-center justify-between pt-1 text-xs border-t border-slate-900">
        <div class="flex items-center gap-2 truncate">
          <span class="text-base">{selectedFloraFauna.plant.emoji}</span>
          <div class="truncate">
            <div class="font-semibold text-slate-200 truncate">{selectedFloraFauna.plant.commonName}</div>
            <div class="text-[10px] text-slate-400 truncate">{selectedFloraFauna.primaryBiome}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Country Inspector CTA Button -->
    <button
      type="button"
      onclick={() => { geoStore.isInspectorOpen = true; }}
      class="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition flex items-center justify-center gap-2 cursor-pointer"
    >
      <span>🌿 Inspeksi Biodiversitas Lengkap</span>
      <ExternalLink class="w-3.5 h-3.5" />
    </button>
  </div>
</div>
