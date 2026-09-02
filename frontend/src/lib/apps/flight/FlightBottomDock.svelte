<script lang="ts">
  import { Plane, TrendingUp, Sparkles, Globe } from 'lucide-svelte';
  import { geoStore } from '$lib/framework/geoglobe/geoStore.svelte';

  const TOP_CORRIDORS = [
    { iso3: 'SAU', country: 'Arab Saudi', flag: '🇸🇦', volume: '$3,200M', workers: '950k TKI' },
    { iso3: 'MYS', country: 'Malaysia', flag: '🇲🇾', volume: '$2,800M', workers: '1.4M TKI' },
    { iso3: 'TWN', country: 'Taiwan', flag: '🇹🇼', volume: '$1,900M', workers: '320k TKI' },
    { iso3: 'HKG', country: 'Hong Kong', flag: '🇭🇰', volume: '$1,600M', workers: '170k TKI' },
    { iso3: 'SGP', country: 'Singapura', flag: '🇸🇬', volume: '$1,500M', workers: '140k TKI' },
    { iso3: 'JPN', country: 'Jepang', flag: '🇯🇵', volume: '$1,100M', workers: '85k TKI' },
    { iso3: 'USA', country: 'Amerika Serikat', flag: '🇺🇸', volume: '$950M', workers: '65k TKI' },
    { iso3: 'KOR', country: 'Korea Selatan', flag: '🇰🇷', volume: '$800M', workers: '55k TKI' },
  ];
</script>

<div class="pointer-events-none absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 z-20 flex flex-col sm:flex-row items-end justify-between gap-3 select-none">
  <!-- Top 8 Remittance Corridors Strip -->
  <div class="pointer-events-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl px-4 py-2 overflow-x-auto max-w-4xl flex items-center gap-4">
    <div class="flex items-center gap-1.5 text-xs font-bold text-emerald-400 border-r border-slate-800 pr-3 whitespace-nowrap">
      <Plane class="w-3.5 h-3.5" />
      <span>Top Koridor ke Jakarta:</span>
    </div>

    <div class="flex items-center gap-3 overflow-x-auto">
      {#each TOP_CORRIDORS as hub}
        <button
          type="button"
          onclick={() => geoStore.selectCountry(hub.iso3)}
          class="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 transition cursor-pointer text-xs whitespace-nowrap"
        >
          <span>{hub.flag}</span>
          <span class="font-medium text-slate-200">{hub.country}</span>
          <span class="font-mono font-bold text-emerald-400">{hub.volume}</span>
          <span class="text-[10px] text-slate-400">({hub.workers})</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Corridor Inspector CTA Button -->
  <div class="pointer-events-auto flex items-center gap-2">
    <button
      type="button"
      onclick={() => { geoStore.isInspectorOpen = true; }}
      class="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-xl shadow-emerald-950/50 transition cursor-pointer"
    >
      <Sparkles class="w-3.5 h-3.5" />
      <span>Rincian Biaya & Jalur 3D</span>
    </button>
  </div>
</div>
