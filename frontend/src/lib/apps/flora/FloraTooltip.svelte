<script lang="ts">
  import type { CountrySpatialMetadata } from '$lib/framework/geoglobe/types';
  import { 
    getFloraFaunaDataForCountry, 
    type FloraFaunaData 
  } from '$lib/framework/geoglobe/data/floraFaunaData';
  import { Trees, Sparkles, AlertTriangle } from 'lucide-svelte';

  interface Props {
    country: CountrySpatialMetadata;
  }

  let { country }: Props = $props();

  const bioData = $derived<FloraFaunaData>(getFloraFaunaDataForCountry(country.iso3));
</script>

<div class="pointer-events-none min-w-[230px] max-w-xs rounded-2xl border border-emerald-800/80 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
  <!-- Header -->
  <div class="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
    <div class="flex items-center gap-2 min-w-0">
      <span class="text-xl flex-shrink-0">{country.flagEmoji}</span>
      <div class="truncate">
        <h4 class="text-xs font-bold text-white truncate">{country.countryName}</h4>
        <p class="text-[10px] text-slate-400 truncate">{country.capital} • {country.region}</p>
      </div>
    </div>
    {#if bioData.isMegadiverse}
      <span class="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/30">
        Rank #{bioData.globalBiodiversityRank}
      </span>
    {/if}
  </div>

  <!-- Primary Wildlife Metric -->
  <div class="space-y-1.5 text-xs">
    <div class="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
      <div class="flex items-center gap-2">
        <span class="text-lg">{bioData.animal.emoji}</span>
        <div>
          <div class="text-[11px] font-bold text-white leading-tight">{bioData.animal.commonName}</div>
          <div class="text-[9px] text-slate-400 italic">{bioData.animal.scientificName}</div>
        </div>
      </div>
    </div>

    <!-- IUCN Status & Flora Highlight -->
    <div class="grid grid-cols-2 gap-1.5 pt-0.5">
      <div class="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-semibold border {bioData.animal.iucnStatus.includes('Endangered') || bioData.animal.iucnStatus.includes('Critically') ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' : bioData.animal.iucnStatus === 'Vulnerable' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}">
        <span>IUCN: {bioData.animal.iucnStatus}</span>
      </div>

      <div class="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-semibold border bg-teal-500/10 text-teal-300 border-teal-500/30 truncate">
        <span>{bioData.plant.emoji} {bioData.plant.commonName.split('(')[0].trim()}</span>
      </div>
    </div>

    <!-- Biome Habitat -->
    <div class="pt-1.5 border-t border-slate-800/80 text-[10px] flex items-center justify-between">
      <span class="text-slate-400">Bioma:</span>
      <span class="font-medium text-emerald-300">{bioData.primaryBiome}</span>
    </div>
  </div>

  <!-- Hint -->
  <div class="mt-2 pt-1.5 border-t border-slate-800/60 text-[9px] text-slate-400 flex items-center justify-between">
    <span>👉 Klik untuk inspeksi satwa</span>
    <span class="text-emerald-400 font-medium">Nature Inspector 🌿</span>
  </div>
</div>
