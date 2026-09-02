<script lang="ts">
  import type { CountrySpatialMetadata } from '$lib/framework/geoglobe/types';
  import { calculateLocalTime, getDiurnalPhase, formatUtcOffset } from '$lib/framework/geoglobe/geoMath';
  import { Clock, Building2 } from 'lucide-svelte';

  interface Props {
    country: CountrySpatialMetadata;
  }

  let { country }: Props = $props();

  const now = new Date();
  const localTime = $derived(calculateLocalTime(now, country.utcOffset));
  const phase = $derived(getDiurnalPhase(localTime.hours, localTime.minutes));
  const isWorking = $derived(localTime.hours >= 9 && localTime.hours < 17);
  const diffWib = $derived(country.utcOffset - 7);

  const diffStr = $derived.by(() => {
    if (diffWib === 0) return 'Waktu Acuan Lokal (WIB Jakarta)';
    if (diffWib > 0) return `+${diffWib} Jam lebih cepat dari Jakarta`;
    return `${Math.abs(diffWib)} Jam lebih lambat dari Jakarta`;
  });
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
    <span class="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-400 border border-slate-700">
      {formatUtcOffset(country.utcOffset)}
    </span>
  </div>

  <!-- Primary Clock Metric -->
  <div class="space-y-1.5 text-xs">
    <div class="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
      <div class="flex items-center gap-1.5 text-slate-300">
        <Clock class="w-3.5 h-3.5 text-amber-400" />
        <span class="text-[11px] font-medium">Jam Lokal:</span>
      </div>
      <span class="text-base font-extrabold text-white font-mono tracking-tight">
        {localTime.formatted}
      </span>
    </div>

    <!-- 8-Phase Diurnal Status & Office Hours -->
    <div class="grid grid-cols-2 gap-1.5 pt-0.5">
      <div 
        class="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold text-white shadow-sm"
        style="background: {phase.colorRgba};"
      >
        <span>{phase.emoji}</span>
        <span>{phase.label}</span>
      </div>

      <div class="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-semibold border {isWorking ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-slate-800/80 text-slate-400 border-slate-700'}">
        <Building2 class="w-3 h-3 {isWorking ? 'text-emerald-400' : 'text-slate-500'}" />
        <span>{isWorking ? 'Jam Kerja' : 'Tutup'}</span>
      </div>
    </div>

    <!-- Relation vs Indonesia -->
    <div class="pt-1.5 border-t border-slate-800/80 text-[10px] flex items-center justify-between">
      <span class="text-slate-400">Relasi vs WIB:</span>
      <span class="font-medium text-cyan-400">{diffStr}</span>
    </div>
  </div>

  <!-- Hint -->
  <div class="mt-2.5 pt-1.5 border-t border-slate-800/60 text-[9px] text-slate-400 flex items-center justify-between">
    <span>👉 Klik untuk perbandingan jam</span>
    <span class="text-amber-400 font-medium">Time Inspector 🕒</span>
  </div>
</div>
