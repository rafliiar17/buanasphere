<script lang="ts">
  import { BookOpen, Award, Sparkles } from 'lucide-svelte';
  import { geoStore } from '$lib/framework/geoglobe/geoStore.svelte';

  const TOP_PASSPORTS = [
    { iso3: 'SGP', country: 'Singapura', flag: '🇸🇬', visaFree: 195, rank: 1 },
    { iso3: 'JPN', country: 'Jepang', flag: '🇯🇵', visaFree: 194, rank: 2 },
    { iso3: 'DEU', country: 'Jerman', flag: '🇩🇪', visaFree: 193, rank: 3 },
    { iso3: 'FRA', country: 'Prancis', flag: '🇫🇷', visaFree: 193, rank: 3 },
    { iso3: 'KOR', country: 'Korea Selatan', flag: '🇰🇷', visaFree: 192, rank: 4 },
    { iso3: 'GBR', country: 'Inggris', flag: '🇬🇧', visaFree: 191, rank: 5 },
    { iso3: 'USA', country: 'Amerika Serikat', flag: '🇺🇸', visaFree: 188, rank: 8 },
    { iso3: 'MYS', country: 'Malaysia', flag: '🇲🇾', visaFree: 183, rank: 12 },
    { iso3: 'IDN', country: 'Indonesia', flag: '🇮🇩', visaFree: 78, rank: 68 },
  ];
</script>

<div class="pointer-events-none absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 z-20 flex flex-col sm:flex-row items-end justify-between gap-3 select-none">
  <!-- Top Passport Strength Strip -->
  <div class="pointer-events-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl px-4 py-2 overflow-x-auto max-w-4xl flex items-center gap-4">
    <div class="flex items-center gap-1.5 text-xs font-bold text-emerald-400 border-r border-slate-800 pr-3 whitespace-nowrap">
      <Award class="w-3.5 h-3.5" />
      <span>Ranking Paspor Dunia:</span>
    </div>

    <div class="flex items-center gap-3 overflow-x-auto">
      {#each TOP_PASSPORTS as pass}
        <button
          type="button"
          onclick={() => geoStore.selectCountry(pass.iso3)}
          class="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 transition cursor-pointer text-xs whitespace-nowrap"
        >
          <span>{pass.flag}</span>
          <span class="font-medium text-slate-200">{pass.country}</span>
          <span class="font-mono font-bold text-emerald-400">#{pass.rank}</span>
          <span class="text-[10px] text-slate-400">({pass.visaFree} Destinasi)</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Passport Inspector Button -->
  <div class="pointer-events-auto flex items-center gap-2">
    <button
      type="button"
      onclick={() => { geoStore.isInspectorOpen = true; }}
      class="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-xl shadow-emerald-950/50 transition cursor-pointer"
    >
      <Sparkles class="w-3.5 h-3.5" />
      <span>Syarat Bebas Visa WNI</span>
    </button>
  </div>
</div>
