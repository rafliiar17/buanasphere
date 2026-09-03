<script lang="ts">
  import { 
    Clock, 
    Search, 
    RotateCcw, 
    Sun, 
    Moon, 
    Sunrise,
    Sunset,
    Building2, 
    Eye, 
    EyeOff, 
    ArrowRightLeft,
    SlidersHorizontal,
    ExternalLink,
    Sparkles
  } from 'lucide-svelte';
  import type { CountrySpatialMetadata } from '$lib/framework/geoglobe/types';
  import { EXTENDED_COUNTRIES_DATA } from '$lib/framework/geoglobe/countrySpatialData';
  import { 
    calculateLocalTime, 
    isDaylight, 
    formatUtcOffset, 
    getDiurnalPhase 
  } from '$lib/framework/geoglobe/geoMath';
  import { geoStore } from '$lib/framework/geoglobe/geoStore.svelte';

  interface Props {
    onSelectCountry?: (iso3: string) => void;
    onResetView?: () => void;
  }

  let { onSelectCountry, onResetView }: Props = $props();

  const timeFilter = $derived(geoStore.timeFilter);
  let is24HourFormat = $state(true);
  let searchQuery = $state('');
  let isSearchDropdownOpen = $state(false);

  let now = $state(new Date());

  // Keep digital clock live
  $effect(() => {
    const timer = setInterval(() => {
      now = new Date();
    }, 1000);
    return () => clearInterval(timer);
  });

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

  const selectedCountry = $derived(geoStore.selectedCountry);
  const localTime = $derived(calculateLocalTime(now, selectedCountry.utcOffset));
  const selectedPhase = $derived(getDiurnalPhase(localTime.hours, localTime.minutes));
  const diffHours = $derived(selectedCountry.utcOffset - 7);
  const diffStr = $derived.by(() => {
    if (diffHours === 0) return 'Waktu Acuan Lokal (WIB Jakarta)';
    if (diffHours > 0) return `+${diffHours} Jam lebih cepat dari Jakarta`;
    return `${Math.abs(diffHours)} Jam lebih lambat dari Jakarta`;
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
        <Clock class="w-4 h-4 text-amber-400" />
        <span class="text-xs font-bold tracking-tight text-white uppercase">Pusat Kontrol Jam Global</span>
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
          placeholder="Cari negara atau ibukota (Jakarta, Tokyo)..."
          bind:value={searchQuery}
          onfocus={() => { isSearchDropdownOpen = true; }}
          class="w-full pl-9 pr-8 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
        />
      </div>

      <!-- Search Dropdown List -->
      {#if isSearchDropdownOpen && searchResults.length > 0}
        <div class="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl z-30 divide-y divide-slate-800">
          {#each searchResults as item}
            {@const itemTime = calculateLocalTime(now, item.utcOffset)}
            {@const itemPhase = getDiurnalPhase(itemTime.hours, itemTime.minutes)}
            <button
              type="button"
              onclick={() => handleCountrySelect(item.iso3)}
              class="w-full px-3 py-2 text-left hover:bg-slate-800/80 flex items-center justify-between transition text-xs cursor-pointer"
            >
              <div class="flex items-center gap-2 truncate">
                <span>{item.flagEmoji}</span>
                <span class="font-medium text-white truncate">{item.countryName}</span>
                <span class="text-[10px] text-slate-400">({item.capital})</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-[10px]">{itemPhase.emoji}</span>
                <span class="text-[11px] font-mono font-bold text-amber-400">{itemTime.formatted}</span>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Projection Toggle, 3D Labels Toggle, and Timezone Lines Toggle -->
    <div class="mt-3 grid grid-cols-3 gap-2">
      <button
        type="button"
        onclick={() => geoStore.setProjection(geoStore.projectionMode === 'globe' ? 'flat' : 'globe')}
        class="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border text-xs font-semibold transition cursor-pointer {geoStore.projectionMode === 'globe' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800/80 text-slate-400 border-slate-700'}"
      >
        <span>{geoStore.projectionMode === 'globe' ? '🌍 3D' : '🗺️ Datar'}</span>
      </button>

      <button
        type="button"
        onclick={() => { geoStore.showLabels = !geoStore.showLabels; }}
        class="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border text-xs font-semibold transition cursor-pointer {geoStore.showLabels ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800/80 text-slate-400 border-slate-700'}"
      >
        {#if geoStore.showLabels}
          <Eye class="w-3.5 h-3.5" />
          <span>Label: ON</span>
        {:else}
          <EyeOff class="w-3.5 h-3.5" />
          <span>Label: OFF</span>
        {/if}
      </button>

      <button
        type="button"
        onclick={() => geoStore.toggleTimezoneLines()}
        class="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border text-xs font-semibold transition cursor-pointer {geoStore.showTimezoneLines ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-800/80 text-slate-400 border-slate-700'}"
        title="Tampilkan / Sembunyikan Garis Zona Waktu 3D"
      >
        <span>🌐 Garis: {geoStore.showTimezoneLines ? 'ON' : 'OFF'}</span>
      </button>
    </div>

    <!-- 8-Phase Diurnal Solar Filters (ADR 0037) -->
    <div class="mt-3">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Filter Waktu & Siklus Surya</span>
      <div class="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onclick={() => geoStore.setTimeFilter('all')}
          class="py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer {timeFilter === 'all' ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <span>🌐 Semua Zona</span>
        </button>

        <button
          type="button"
          onclick={() => geoStore.setTimeFilter('golden_hour')}
          class="py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer {timeFilter === 'golden_hour' ? 'bg-rose-500 text-slate-950 border-rose-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <Sunset class="w-3 h-3" />
          <span>Fajar & Senja 🌅</span>
        </button>

        <button
          type="button"
          onclick={() => geoStore.setTimeFilter('daylight')}
          class="py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer {timeFilter === 'daylight' ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <Sun class="w-3 h-3" />
          <span>Siang Hari ☀️</span>
        </button>

        <button
          type="button"
          onclick={() => geoStore.setTimeFilter('night')}
          class="py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer {timeFilter === 'night' ? 'bg-indigo-500 text-slate-950 border-indigo-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <Moon class="w-3 h-3" />
          <span>Malam Hari 🌙</span>
        </button>

        <button
          type="button"
          onclick={() => geoStore.setTimeFilter('working')}
          class="col-span-2 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer {timeFilter === 'working' ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <Building2 class="w-3 h-3" />
          <span>Jam Kantor Aktif (09:00 - 17:00)</span>
        </button>
      </div>
    </div>

    <!-- Active Country Time Card (IDN Default & Diurnal Phase) -->
    <div class="mt-3 rounded-2xl bg-slate-950/80 border border-slate-800 p-3 space-y-2">
      <div class="flex items-center justify-between text-xs">
        <span class="font-bold text-slate-200 flex items-center gap-1.5">
          <span class="text-base">{selectedCountry.flagEmoji}</span>
          <span>{selectedCountry.countryName}</span>
        </span>
        <span class="font-mono text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
          {formatUtcOffset(selectedCountry.utcOffset)}
        </span>
      </div>

      <div class="flex items-center justify-between bg-slate-900/60 p-2 rounded-xl border border-slate-800">
        <div class="flex flex-col">
          <span class="text-[10px] text-slate-400 font-medium">Jam Digital:</span>
          <span class="text-xl font-mono font-extrabold text-white tracking-tight">
            {localTime.formatted}
          </span>
        </div>

        <div class="text-right flex flex-col items-end">
          <span class="text-[10px] text-slate-400 font-medium mb-0.5">Fase Surya:</span>
          <span 
            class="px-2 py-0.5 rounded-lg text-[10px] font-bold text-white flex items-center gap-1 shadow-sm"
            style="background: {selectedPhase.colorRgba};"
          >
            <span>{selectedPhase.emoji}</span>
            <span>{selectedPhase.label}</span>
          </span>
        </div>
      </div>

      <div class="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 px-0.5">
        <span>Relasi vs WIB:</span>
        <span class="font-semibold text-slate-200">{diffStr}</span>
      </div>
    </div>

    <!-- Country Inspector CTA Button -->
    <button
      type="button"
      onclick={() => { geoStore.isInspectorOpen = true; }}
      class="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-950/50 transition flex items-center justify-center gap-2 cursor-pointer"
    >
      <span>🕒 Buka Time Inspector ({selectedCountry.countryName})</span>
      <ExternalLink class="w-3.5 h-3.5" />
    </button>
  </div>
</div>
