<script lang="ts">
  import { onMount } from 'svelte';
  import { Clock, Sun, Moon, Sparkles } from 'lucide-svelte';
  import { calculateLocalTime, isDaylight } from '$lib/framework/geoglobe/geoMath';
  import { geoStore } from '$lib/framework/geoglobe/geoStore.svelte';

  const FINANCIAL_HUBS = [
    { city: 'Tokyo', iso3: 'JPN', flag: '🇯🇵', offset: 9, label: 'JST' },
    { city: 'Singapura', iso3: 'SGP', flag: '🇸🇬', offset: 8, label: 'SGT' },
    { city: 'Jakarta', iso3: 'IDN', flag: '🇮🇩', offset: 7, label: 'WIB' },
    { city: 'Dubai', iso3: 'ARE', flag: '🇦🇪', offset: 4, label: 'GST' },
    { city: 'Frankfurt', iso3: 'DEU', flag: '🇩🇪', offset: 1, label: 'CET' },
    { city: 'London', iso3: 'GBR', flag: '🇬🇧', offset: 0, label: 'GMT' },
    { city: 'New York', iso3: 'USA', flag: '🇺🇸', offset: -5, label: 'EST' },
    { city: 'San Francisco', iso3: 'USA', flag: '🇺🇸', offset: -8, label: 'PST' },
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
  <!-- Live Financial Hubs Clock Strip -->
  <div class="pointer-events-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl px-4 py-2 overflow-x-auto max-w-4xl flex items-center gap-4">
    <div class="flex items-center gap-1.5 text-xs font-bold text-amber-400 border-r border-slate-800 pr-3 whitespace-nowrap">
      <Clock class="w-3.5 h-3.5" />
      <span>Pasar Finansial Dunia:</span>
    </div>

    <div class="flex items-center gap-3 overflow-x-auto">
      {#each FINANCIAL_HUBS as hub}
        {@const hubTime = calculateLocalTime(currentTime, hub.offset)}
        {@const isDay = isDaylight(hubTime.hours)}
        <button
          type="button"
          onclick={() => geoStore.selectCountry(hub.iso3)}
          class="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 transition cursor-pointer text-xs whitespace-nowrap"
        >
          <span>{hub.flag}</span>
          <span class="font-medium text-slate-200">{hub.city}</span>
          <span class="font-mono font-bold text-white">{hubTime.formatted}</span>
          {#if isDay}
            <Sun class="w-3 h-3 text-amber-400" />
          {:else}
            <Moon class="w-3 h-3 text-indigo-400" />
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <!-- Time Inspector Button -->
  <div class="pointer-events-auto flex items-center gap-2">
    <button
      type="button"
      onclick={() => { geoStore.isInspectorOpen = true; }}
      class="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-xl shadow-amber-950/50 transition cursor-pointer"
    >
      <Sparkles class="w-3.5 h-3.5" />
      <span>Detail Jam & Selisih Waktu</span>
    </button>
  </div>
</div>
