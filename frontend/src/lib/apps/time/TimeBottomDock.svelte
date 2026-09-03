<script lang="ts">
  import { onMount } from 'svelte';
  import { Globe, Sparkles } from 'lucide-svelte';
  import { calculateLocalTime, getDiurnalPhase } from '$lib/framework/geoglobe/geoMath';
  import { geoStore } from '$lib/framework/geoglobe/geoStore.svelte';

  const WORLD_CITIES = [
    { city: 'Jakarta', iso3: 'IDN', flag: '🇮🇩', offset: 7, label: 'WIB' },
    { city: 'Tokyo', iso3: 'JPN', flag: '🇯🇵', offset: 9, label: 'JST' },
    { city: 'Sydney', iso3: 'AUS', flag: '🇦🇺', offset: 10, label: 'AEST' },
    { city: 'Dubai', iso3: 'ARE', flag: '🇦🇪', offset: 4, label: 'GST' },
    { city: 'Kairo', iso3: 'EGY', flag: '🇪🇬', offset: 2, label: 'EET' },
    { city: 'Paris', iso3: 'FRA', flag: '🇫🇷', offset: 1, label: 'CET' },
    { city: 'London', iso3: 'GBR', flag: '🇬🇧', offset: 0, label: 'GMT' },
    { city: 'New York', iso3: 'USA', flag: '🇺🇸', offset: -5, label: 'EST' },
  ];

  let currentTime = $state(new Date());

  onMount(() => {
    const interval = setInterval(() => {
      currentTime = new Date();
    }, 1000);
    return () => clearInterval(interval);
  });
</script>

<div class="pointer-events-none absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 z-20 flex flex-col sm:flex-row items-end justify-between gap-3 select-none">
  <!-- Live World Cities Clock Strip -->
  <div class="pointer-events-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl px-4 py-2 overflow-x-auto max-w-4xl flex items-center gap-4">
    <div class="flex items-center gap-1.5 text-xs font-bold text-sky-400 border-r border-slate-800 pr-3 whitespace-nowrap">
      <Globe class="w-3.5 h-3.5" />
      <span>Kota Utama Dunia:</span>
    </div>

    <div class="flex items-center gap-3 overflow-x-auto">
      {#each WORLD_CITIES as city}
        {@const cityTime = calculateLocalTime(currentTime, city.offset)}
        {@const phase = getDiurnalPhase(cityTime.hours, cityTime.minutes)}
        <button
          type="button"
          onclick={() => geoStore.selectCountry(city.iso3)}
          class="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 transition cursor-pointer text-xs whitespace-nowrap {geoStore.selectedIso3 === city.iso3 ? 'ring-2 ring-sky-400/80 bg-slate-800' : ''}"
        >
          <span>{city.flag}</span>
          <span class="font-medium text-slate-200">{city.city}</span>
          <span class="font-mono font-bold text-white">{cityTime.formatted}</span>
          <span class="text-xs">{phase.emoji}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Time Inspector Button -->
  <div class="pointer-events-auto flex items-center gap-2">
    <button
      type="button"
      onclick={() => { geoStore.isInspectorOpen = true; }}
      class="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-bold text-xs shadow-xl shadow-sky-950/50 transition cursor-pointer"
    >
      <Sparkles class="w-3.5 h-3.5" />
      <span>Detail Jam & Selisih Waktu</span>
    </button>
  </div>
</div>
