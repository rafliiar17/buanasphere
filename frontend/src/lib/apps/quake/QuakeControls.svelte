<script lang="ts">
  import {
    Activity,
    Search,
    RotateCcw,
    SlidersHorizontal,
    Eye,
    EyeOff,
    RotateCw,
    Waves,
    ShieldAlert,
    Flame,
    ExternalLink
  } from 'lucide-svelte';
  import { EXTENDED_COUNTRIES_DATA } from '$lib/framework/geoglobe/countrySpatialData';
  import { geoStore } from '$lib/framework/geoglobe/geoStore.svelte';

  interface Props {
    onSelectCountry?: (iso3: string) => void;
    onResetView?: () => void;
  }

  let { onSelectCountry, onResetView }: Props = $props();

  let searchQuery = $state('');
  let isSearchDropdownOpen = $state(false);

  // Selected Country
  const selectedCountry = $derived(geoStore.selectedCountry);

  // Active Filter in geoStore
  const activeFilter = $derived(String(geoStore.customFilter || 'all'));

  // Search results
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
    onSelectCountry?.(iso3);
    searchQuery = '';
    isSearchDropdownOpen = false;
  }

  function handleFilterSelect(filterId: string) {
    geoStore.setCustomFilter(filterId);
  }

  function handleReset() {
    geoStore.setCustomFilter('all');
    searchQuery = '';
    isSearchDropdownOpen = false;
    onResetView?.();
  }
</script>

<!-- Floating Top-Right Controls Card -->
<div class="absolute top-4 right-4 z-20 w-80 sm:w-88 flex flex-col gap-3 pointer-events-auto select-none">
  <div class="rounded-3xl border border-slate-700/80 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-xl text-slate-100 flex flex-col gap-3.5 transition-all duration-200">
    <!-- Header -->
  <div class="flex items-center justify-between border-b border-slate-800 pb-3">
    <div class="flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
        <Activity class="w-4 h-4" />
      </div>
      <div>
        <h3 class="text-xs font-black tracking-wider uppercase text-slate-100">Pemantauan Seismik</h3>
        <p class="text-[10px] text-slate-400 font-medium">Filter Magnitudo & Zona Gempa</p>
      </div>
    </div>
    <button
      type="button"
      onclick={handleReset}
      title="Reset Filter"
      class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer border border-slate-700/50"
    >
      <RotateCcw class="w-3.5 h-3.5" />
    </button>
  </div>

  <!-- Section 1: Global 3D Globe Display Controls -->
  <div class="space-y-1.5">
    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tampilan Globe 3D</span>
    <div class="grid grid-cols-2 gap-2">
      <!-- Label Pin 3D Toggle -->
      <button
        type="button"
        onclick={() => geoStore.toggleLabels()}
        class={`flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
          geoStore.showLabels
            ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-sm shadow-rose-950/30'
            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
        }`}
      >
        {#if geoStore.showLabels}
          <Eye class="w-3.5 h-3.5" />
        {:else}
          <EyeOff class="w-3.5 h-3.5" />
        {/if}
        <span>Label: {geoStore.showLabels ? 'ON' : 'OFF'}</span>
      </button>

      <!-- Auto Rotate Toggle -->
      <button
        type="button"
        onclick={() => geoStore.toggleAutoRotate()}
        class={`flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
          geoStore.autoRotate
            ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-sm shadow-rose-950/30'
            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
        }`}
      >
        <RotateCw class={`w-3.5 h-3.5 ${geoStore.autoRotate ? 'animate-spin' : ''}`} style="animation-duration: 8s;" />
        <span>Rotasi: {geoStore.autoRotate ? 'ON' : 'OFF'}</span>
      </button>
    </div>
  </div>

  <!-- Section 2: Preset Filter Seismik & Risiko -->
  <div class="space-y-2">
    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kategori Risiko Gempa</span>
    <div class="grid grid-cols-2 gap-1.5">
      <button
        type="button"
        onclick={() => handleFilterSelect('all')}
        class={`flex items-center gap-1.5 p-2 rounded-xl border text-left transition cursor-pointer ${
          activeFilter === 'all'
            ? 'bg-slate-800 border-slate-600 text-slate-100 font-bold'
            : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-200'
        }`}
      >
        <Activity class="w-3.5 h-3.5 text-slate-400" />
        <span class="text-[11px]">Semua Wilayah</span>
      </button>

      <button
        type="button"
        onclick={() => handleFilterSelect('high_risk')}
        class={`flex items-center gap-1.5 p-2 rounded-xl border text-left transition cursor-pointer ${
          activeFilter === 'high_risk'
            ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold'
            : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-200'
        }`}
      >
        <Flame class="w-3.5 h-3.5 text-rose-400" />
        <span class="text-[11px]">Ring of Fire</span>
      </button>

      <button
        type="button"
        onclick={() => handleFilterSelect('m6_plus')}
        class={`flex items-center gap-1.5 p-2 rounded-xl border text-left transition cursor-pointer ${
          activeFilter === 'm6_plus'
            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
            : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-200'
        }`}
      >
        <ShieldAlert class="w-3.5 h-3.5 text-amber-400" />
        <span class="text-[11px]">Magnitudo M6.0+</span>
      </button>

      <button
        type="button"
        onclick={() => handleFilterSelect('tsunami_alert')}
        class={`flex items-center gap-1.5 p-2 rounded-xl border text-left transition cursor-pointer ${
          activeFilter === 'tsunami_alert'
            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
            : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-200'
        }`}
      >
        <Waves class="w-3.5 h-3.5 text-cyan-400" />
        <span class="text-[11px]">Siaga Tsunami</span>
      </button>
    </div>
  </div>

  <!-- Section 3: Filter Kedalaman Seismik -->
  <div class="space-y-1.5">
    <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
      <span>Kedalaman Hiposentrum</span>
    </div>
    <div class="grid grid-cols-3 gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-[10px] font-semibold text-center">
      <button
        type="button"
        onclick={() => handleFilterSelect('depth_shallow')}
        class={`py-1.5 rounded-lg transition cursor-pointer ${
          activeFilter === 'depth_shallow'
            ? 'bg-rose-500/30 text-rose-300 font-bold border border-rose-500/40'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        Dangkal (&lt;30km)
      </button>
      <button
        type="button"
        onclick={() => handleFilterSelect('depth_medium')}
        class={`py-1.5 rounded-lg transition cursor-pointer ${
          activeFilter === 'depth_medium'
            ? 'bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        Menengah
      </button>
      <button
        type="button"
        onclick={() => handleFilterSelect('depth_deep')}
        class={`py-1.5 rounded-lg transition cursor-pointer ${
          activeFilter === 'depth_deep'
            ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/40'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        Dalam (&gt;300km)
      </button>
    </div>
  </div>

  <!-- Section 4: Country Search -->
  <div class="relative">
    <div class="relative flex items-center">
      <Search class="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
      <input
        type="text"
        placeholder="Cari negara / wilayah gempa..."
        bind:value={searchQuery}
        onfocus={() => { isSearchDropdownOpen = true; }}
        class="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
      />
    </div>

    {#if isSearchDropdownOpen && searchResults.length > 0}
      <div class="absolute left-0 right-0 top-full mt-1.5 max-h-48 overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-30 divide-y divide-slate-800">
        {#each searchResults as country}
          <button
            type="button"
            onclick={() => handleCountrySelect(country.iso3)}
            class="w-full px-3 py-2 text-left text-xs hover:bg-slate-800 flex items-center justify-between transition cursor-pointer"
          >
            <span class="font-medium text-slate-200">{country.countryName}</span>
            <span class="text-[10px] font-mono text-slate-400">{country.iso3}</span>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Selected Country Snapshot & Inspector CTA -->
  <div class="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
    <div>
      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fokus Negara</div>
      <div class="text-xs font-extrabold text-slate-100">{selectedCountry.countryName}</div>
    </div>
    <button
      type="button"
      onclick={() => { geoStore.isInspectorOpen = true; }}
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-[11px] transition shadow-md shadow-rose-950/40 cursor-pointer"
    >
      <ExternalLink class="w-3 h-3" />
      <span>Detail Lempeng</span>
    </button>
  </div>
</div>
</div>
