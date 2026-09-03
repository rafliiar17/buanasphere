<script lang="ts">
  import type { CountrySpatialMetadata } from '$lib/framework/geoglobe/types';
  import type { CountrySeismicProfile } from '$lib/framework/geoglobe/data/earthquakeData';

  interface Props {
    country: CountrySpatialMetadata;
    data?: CountrySeismicProfile;
    theme?: 'dark' | 'light';
  }

  let { country, data, theme = 'dark' }: Props = $props();

  const latest = $derived(data?.recentEvents?.[0]);
  const isDark = $derived(theme === 'dark');
  const riskTier = $derived(data?.seismicRiskTier ?? 'low');

  const riskBadgeClass = $derived.by(() => {
    if (riskTier === 'high') return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
    if (riskTier === 'moderate') return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
  });

  const riskLabel = $derived.by(() => {
    if (riskTier === 'high') return 'Risiko Tinggi';
    if (riskTier === 'moderate') return 'Risiko Sedang';
    return 'Risiko Rendah';
  });
</script>

<div
  class={`p-3 rounded-2xl border shadow-2xl backdrop-blur-xl pointer-events-none min-w-[240px] select-none ${
    isDark
      ? 'bg-slate-950/95 border-slate-800 text-slate-100 shadow-slate-950/80'
      : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/60'
  }`}
>
  <div class="flex items-center justify-between gap-3 mb-2">
    <div class="flex items-center gap-2">
      <span class="text-base font-extrabold tracking-tight">{country.countryName}</span>
      <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400 border border-slate-700/50">
        {country.iso3}
      </span>
    </div>
    <span class={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskBadgeClass}`}>
      {riskLabel}
    </span>
  </div>

  {#if data?.tectonicPlate}
    <div class="text-[11px] text-slate-400 mb-2">
      Lempeng: <span class="font-medium text-slate-300">{data.tectonicPlate}</span>
    </div>
  {/if}

  {#if latest}
    <div class="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
      <div class="flex items-center justify-between text-xs">
        <span class="font-bold text-rose-400">M {latest.magnitude.toFixed(1)}</span>
        <span class="text-[10px] text-slate-400">{latest.depthKm} km</span>
      </div>
      <div class="text-[11px] text-slate-200 line-clamp-1 font-medium">{latest.place}</div>
      {#if latest.tsunamiWarning}
        <div class="text-[10px] font-bold text-rose-400 flex items-center gap-1">
          <span>Potensi Tsunami Aktif</span>
        </div>
      {/if}
    </div>
  {:else}
    <div class="text-[11px] text-slate-400 italic">
      Tidak ada rekaman gempa signifikan terbaru.
    </div>
  {/if}
</div>
