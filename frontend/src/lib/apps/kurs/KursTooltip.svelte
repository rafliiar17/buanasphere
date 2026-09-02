<script lang="ts">
  import type { MapCountryData } from '$lib/features/map/map-constants';
  import { formatRupiah } from '$lib/formatters/currency';

  interface Props {
    country: MapCountryData;
    metric?: 'rate' | 'change' | 'flag';
  }

  let { country, metric = 'rate' }: Props = $props();
</script>

<div class="pointer-events-none min-w-[200px] max-w-xs rounded-2xl border border-slate-700/80 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
  <!-- Header -->
  <div class="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
    <div class="flex items-center gap-2 min-w-0">
      <span class="text-xl flex-shrink-0">{country.flag}</span>
      <div class="truncate">
        <h4 class="text-xs font-bold text-white truncate">{country.countryName}</h4>
        <p class="text-[10px] text-slate-400 truncate">{country.currencyName}</p>
      </div>
    </div>
    <span class="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono font-bold text-cyan-400 border border-slate-700">
      {country.currencyCode}
    </span>
  </div>

  <!-- Primary Rate Metrics -->
  <div class="space-y-1 text-xs">
    <div class="flex items-center justify-between">
      <span class="text-[11px] text-slate-400">Kurs Tengah:</span>
      <span class="font-bold text-emerald-400 font-mono">
        {formatRupiah(country.middleRate, { showFraction: true })}
      </span>
    </div>

    <div class="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
      <span>Beli: {formatRupiah(country.buyRate, { showFraction: false })}</span>
      <span>Jual: {formatRupiah(country.sellRate, { showFraction: false })}</span>
    </div>

    <div class="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
      <span class="text-slate-400">Performa 24 Jam:</span>
      <span class="font-semibold {country.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
        {country.change24h >= 0 ? '+' : ''}{country.change24h.toFixed(2)}%
      </span>
    </div>
  </div>

  <!-- Hint -->
  <div class="mt-2.5 pt-1.5 border-t border-slate-800/60 text-[9px] text-slate-400 flex items-center justify-between">
    <span>👉 Klik untuk kalkulator</span>
    <span class="text-cyan-400 font-medium">Split View ⇄</span>
  </div>
</div>
