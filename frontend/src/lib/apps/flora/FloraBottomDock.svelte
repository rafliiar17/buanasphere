<script lang="ts">
  import { Trees, Sparkles, Flame, ShieldCheck, ChevronRight } from 'lucide-svelte';
  import { geoStore } from '$lib/framework/geoglobe/geoStore.svelte';
  import { 
    MEGADIVERSE_ISO3_LIST, 
    getFloraFaunaDataForCountry 
  } from '$lib/framework/geoglobe/data/floraFaunaData';
  import { EXTENDED_COUNTRIES_DATA } from '$lib/framework/geoglobe/countrySpatialData';

  const megadiverseCountries = $derived(
    MEGADIVERSE_ISO3_LIST.map((iso3) => {
      const spatial = EXTENDED_COUNTRIES_DATA.find((c) => c.iso3 === iso3);
      const bio = getFloraFaunaDataForCountry(iso3);
      return {
        iso3,
        name: spatial?.countryName ?? iso3,
        flag: spatial?.flagEmoji ?? '🌐',
        bio,
      };
    })
  );

  function handleSelect(iso3: string) {
    geoStore.selectCountry(iso3);
  }
</script>

<div class="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto z-20 pointer-events-auto select-none">
  <div class="rounded-2xl border border-emerald-800/50 bg-slate-900/90 p-3 shadow-2xl backdrop-blur-xl text-slate-100 max-w-2xl">
    <div class="flex items-center justify-between gap-4 mb-2">
      <div class="flex items-center gap-2">
        <Sparkles class="w-3.5 h-3.5 text-emerald-400" />
        <span class="text-xs font-bold text-white uppercase tracking-wider">Top 17 Negara Megabiodiversitas Dunia</span>
      </div>
      <span class="text-[10px] text-emerald-400 font-mono font-semibold">
        70%+ Spesies Bumi
      </span>
    </div>

    <!-- Horizontal Scrolling Carousel of Megadiverse Nations -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
      {#each megadiverseCountries as item}
        {@const isSelected = geoStore.selectedIso3 === item.iso3}
        <button
          type="button"
          onclick={() => handleSelect(item.iso3)}
          class="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium shrink-0 transition-all cursor-pointer {isSelected ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-md' : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'}"
        >
          <span>{item.flag}</span>
          <span class="font-bold">{item.name}</span>
          <span class="text-[10px] text-emerald-400 font-mono">#{item.bio.globalBiodiversityRank}</span>
          <span class="text-xs">{item.bio.animal.emoji}</span>
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    height: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.4);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(16, 185, 129, 0.4);
    border-radius: 9999px;
  }
</style>
