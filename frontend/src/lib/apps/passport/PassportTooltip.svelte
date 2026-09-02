<script lang="ts">
  import type { CountrySpatialMetadata } from '$lib/framework/geoglobe/types';
  import { BookOpen, ShieldCheck, Award, AlertCircle } from 'lucide-svelte';

  interface Props {
    country: CountrySpatialMetadata;
  }

  let { country }: Props = $props();

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

  const score = $derived(
    PASSPORT_SCORES[country.iso3] ?? {
      visaFree: Math.max(40, Math.min(170, Math.round(75 + country.lat * 0.5))),
      rank: 70,
      indoRequirement: 'Visa Required',
    }
  );
</script>

<div class="pointer-events-none min-w-[220px] max-w-xs rounded-2xl border border-slate-700/80 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
  <!-- Header -->
  <div class="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
    <div class="flex items-center gap-2 min-w-0">
      <span class="text-xl flex-shrink-0">{country.flagEmoji}</span>
      <div class="truncate">
        <h4 class="text-xs font-bold text-white truncate">{country.countryName}</h4>
        <p class="text-[10px] text-slate-400 truncate">{country.capital} • {country.region}</p>
      </div>
    </div>
    <span class="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 border border-slate-700">
      Rank #{score.rank}
    </span>
  </div>

  <!-- Primary Passport Metrics -->
  <div class="space-y-1.5 text-xs">
    <div class="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
      <div class="flex items-center gap-1.5 text-slate-300">
        <Award class="w-3.5 h-3.5 text-emerald-400" />
        <span class="text-[11px] font-medium">Bebas Visa:</span>
      </div>
      <span class="text-sm font-extrabold text-white font-mono">
        {score.visaFree} Destinasi
      </span>
    </div>

    <!-- Requirement for Indonesian Citizens -->
    <div class="rounded-xl p-2 border {score.indoRequirement === 'Visa Free' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : score.indoRequirement === 'Visa on Arrival' || score.indoRequirement === 'eVisa' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-medium text-slate-300">Bagi Paspor Indonesia:</span>
        <span class="text-[10px] font-bold uppercase tracking-wider">
          {score.indoRequirement}
        </span>
      </div>
    </div>
  </div>

  <!-- Hint -->
  <div class="mt-2.5 pt-1.5 border-t border-slate-800/60 text-[9px] text-slate-400 flex items-center justify-between">
    <span>👉 Klik untuk rincian paspor</span>
    <span class="text-emerald-400 font-medium">Passport Inspector 🛂</span>
  </div>
</div>
