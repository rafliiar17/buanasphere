<script lang="ts">
  import type { CountrySpatialMetadata } from '$lib/framework/geoglobe/types';
  import { Plane, Users, DollarSign, Percent } from 'lucide-svelte';

  interface Props {
    country: CountrySpatialMetadata;
  }

  let { country }: Props = $props();

  const REMITTANCE_HUBS: Record<string, { volumeM: number; workers: number; fee: number }> = {
    SAU: { volumeM: 3200, workers: 950000, fee: 3.2 },
    MYS: { volumeM: 2800, workers: 1400000, fee: 2.5 },
    TWN: { volumeM: 1900, workers: 320000, fee: 2.8 },
    HKG: { volumeM: 1600, workers: 170000, fee: 2.1 },
    SGP: { volumeM: 1500, workers: 140000, fee: 1.8 },
    JPN: { volumeM: 1100, workers: 85000, fee: 3.5 },
    USA: { volumeM: 950, workers: 65000, fee: 3.8 },
    KOR: { volumeM: 800, workers: 55000, fee: 3.1 },
    ARE: { volumeM: 750, workers: 60000, fee: 3.3 },
    AUS: { volumeM: 620, workers: 45000, fee: 2.9 },
  };

  const hub = $derived(REMITTANCE_HUBS[country.iso3]);
  const isCorridor = $derived(Boolean(hub));
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
    <span class="rounded px-2 py-0.5 text-[10px] font-bold {isCorridor ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}">
      {isCorridor ? '✈️ Koridor Aktif' : 'Non-Hub'}
    </span>
  </div>

  <!-- Primary Corridor Metrics -->
  <div class="space-y-1.5 text-xs">
    {#if isCorridor && hub}
      <div class="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
        <div class="flex items-center gap-1.5 text-slate-300">
          <Plane class="w-3.5 h-3.5 text-emerald-400" />
          <span class="text-[11px] font-medium">Volume Remitansi:</span>
        </div>
        <span class="text-sm font-extrabold text-emerald-400 font-mono">
          ${hub.volumeM.toLocaleString()}M USD
        </span>
      </div>

      <div class="grid grid-cols-2 gap-1.5 pt-0.5">
        <div class="rounded-lg bg-slate-950/50 p-1.5 border border-slate-800">
          <span class="text-[9px] text-slate-400 block">Pekerja Migran:</span>
          <span class="text-[11px] font-bold text-slate-200 font-mono">
            {hub.workers.toLocaleString()} Jiwa
          </span>
        </div>

        <div class="rounded-lg bg-slate-950/50 p-1.5 border border-slate-800">
          <span class="text-[9px] text-slate-400 block">Biaya Kirim Rata-rata:</span>
          <span class="text-[11px] font-bold text-cyan-400 font-mono">
            {hub.fee}%
          </span>
        </div>
      </div>

      <div class="pt-1.5 border-t border-slate-800/80 text-[10px] flex items-center justify-between">
        <span class="text-slate-400">Rute Jalur 3D:</span>
        <span class="font-medium text-emerald-400">{country.capital} ➔ Jakarta</span>
      </div>
    {:else}
      <div class="rounded-xl bg-slate-950/40 p-2 text-center text-slate-400 text-[11px]">
        Bukan koridor remitansi utama langsung ke Indonesia.
      </div>
    {/if}
  </div>

  <!-- Hint -->
  <div class="mt-2.5 pt-1.5 border-t border-slate-800/60 text-[9px] text-slate-400 flex items-center justify-between">
    <span>👉 Klik untuk rincian koridor</span>
    <span class="text-emerald-400 font-medium">Flow View ✈️</span>
  </div>
</div>
