<script lang="ts">
  import { globeState } from '../state/globeState.svelte';
  import { ratesState } from '../state/ratesState.svelte';
  import {
    formatRupiah,
    formatPercent,
    formatCurrency,
    formatCompactNumber,
    formatTimeAgo,
  } from '../formatters/currency';
  import {
    X,
    TrendingUp,
    TrendingDown,
    ArrowRightLeft,
    Table,
    Calculator,
    ExternalLink,
    Building2,
    Globe2,
    Users,
  } from 'lucide-svelte';

  const country = $derived(globeState.selectedCountry);
  const rateInfo = $derived(
    country ? ratesState.getRate(country.currencyCode) : undefined
  );

  // Quick convert calculator state
  let convertAmount = $state<number>(100);
  let isReverse = $state<boolean>(false);

  const conversionPreview = $derived.by(() => {
    if (!country || !rateInfo) return { resultFormatted: '0', rateNote: '' };
    if (!isReverse) {
      // From Foreign to IDR
      const conv = ratesState.convert(convertAmount, country.currencyCode, 'IDR');
      return {
        resultFormatted: formatRupiah(conv.result),
        rateNote: `1 ${country.currencyCode} = ${formatRupiah(conv.rate)}`,
      };
    } else {
      // From IDR to Foreign
      const conv = ratesState.convert(convertAmount, 'IDR', country.currencyCode);
      return {
        resultFormatted: formatCurrency(conv.result, country.currencyCode),
        rateNote: `1 IDR = ${conv.rate < 0.0001 ? conv.rate.toExponential(4) : conv.rate.toFixed(4)} ${country.currencyCode}`,
      };
    }
  });

  function handleClose() {
    globeState.selectCountry(null);
  }

  function handleOpenMatrix() {
    globeState.setViewMode('matrix');
  }

  function handleOpenConverter() {
    globeState.setViewMode('converter');
  }

  function toggleReverse() {
    isReverse = !isReverse;
  }
</script>

{#if country}
  <aside
    class="fixed right-0 top-16 bottom-0 w-full sm:w-[420px] z-40 bg-slate-950/90 backdrop-blur-2xl border-l border-slate-800 shadow-2xl flex flex-col transition-all duration-300 overflow-y-auto no-scrollbar"
    aria-label="Detail Kurs Negara"
  >
    <!-- Header -->
    <div class="p-5 border-b border-slate-800/80 sticky top-0 bg-slate-950/95 backdrop-blur-md z-10 flex items-start justify-between gap-3">
      <div class="flex items-center gap-3">
        <span class="text-4xl shadow-sm rounded-lg" role="img" aria-label={country.countryName}>
          {country.flagEmoji}
        </span>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-bold text-white tracking-tight">{country.countryName}</h2>
            <span class="px-2 py-0.5 text-xs font-semibold bg-slate-800 text-slate-300 rounded-md border border-slate-700">
              {country.iso3}
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">
            {country.currencyName} ({country.currencyCode})
          </p>
        </div>
      </div>

      <button
        onclick={handleClose}
        class="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Tutup Drawer"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Content -->
    <div class="p-5 space-y-5 flex-1">
      <!-- Geography & Demographics Badges -->
      <div class="grid grid-cols-3 gap-2 text-center text-xs">
        <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
          <div class="flex items-center justify-center gap-1 text-slate-400 mb-1">
            <Globe2 class="w-3 h-3" />
            <span class="text-[10px] uppercase">Benua</span>
          </div>
          <span class="font-semibold text-slate-200">{country.continent || country.region}</span>
        </div>

        <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
          <div class="flex items-center justify-center gap-1 text-slate-400 mb-1">
            <Building2 class="w-3 h-3" />
            <span class="text-[10px] uppercase">Ibukota</span>
          </div>
          <span class="font-semibold text-slate-200 truncate block" title={country.capital}>
            {country.capital || '-'}
          </span>
        </div>

        <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
          <div class="flex items-center justify-center gap-1 text-slate-400 mb-1">
            <Users class="w-3 h-3" />
            <span class="text-[10px] uppercase">Populasi</span>
          </div>
          <span class="font-semibold text-slate-200">
            {country.population ? formatCompactNumber(country.population) : '-'}
          </span>
        </div>
      </div>

      <!-- Live Rate Highlight Card -->
      <div class="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/40 border border-indigo-500/20 shadow-lg">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold uppercase tracking-wider text-indigo-300">
            Kurs Tengah (Spot vs IDR)
          </span>
          {#if rateInfo}
            <span
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium {rateInfo.change24h >= 0
                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'}"
            >
              {#if rateInfo.change24h >= 0}
                <TrendingUp class="w-3.5 h-3.5" />
              {:else}
                <TrendingDown class="w-3.5 h-3.5" />
              {/if}
              {formatPercent(rateInfo.change24h)} (24j)
            </span>
          {/if}
        </div>

        <div class="text-3xl font-extrabold text-white font-mono tracking-tight my-1">
          {rateInfo ? formatRupiah(rateInfo.middleRate, { showFraction: rateInfo.middleRate < 100 }) : 'Rp -'}
        </div>

        <div class="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/60">
          <span>Penyedia: <strong class="text-slate-300">{rateInfo?.provider ?? 'Bank Indonesia'}</strong></span>
          <span>{rateInfo?.updatedAt ? formatTimeAgo(rateInfo.updatedAt) : 'Terbaru'}</span>
        </div>
      </div>

      <!-- Buy, Sell, and Spread Metrics -->
      <div class="grid grid-cols-2 gap-3">
        <div class="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <span class="text-[11px] font-medium text-slate-400 block mb-1">Kurs Beli (Bank Buy)</span>
          <span class="text-base font-bold text-slate-100 font-mono">
            {rateInfo ? formatRupiah(rateInfo.buyRate, { showFraction: rateInfo.buyRate < 100 }) : '-'}
          </span>
          <span class="text-[10px] text-slate-400 block mt-1">Anda jual valas ke bank</span>
        </div>

        <div class="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <span class="text-[11px] font-medium text-slate-400 block mb-1">Kurs Jual (Bank Sell)</span>
          <span class="text-base font-bold text-slate-100 font-mono">
            {rateInfo ? formatRupiah(rateInfo.sellRate, { showFraction: rateInfo.sellRate < 100 }) : '-'}
          </span>
          <span class="text-[10px] text-slate-400 block mt-1">Anda beli valas dari bank</span>
        </div>
      </div>

      <!-- Spread Info -->
      <div class="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-center justify-between text-xs">
        <span class="text-slate-400">Selisih Spread Bank:</span>
        <span class="font-mono font-semibold text-slate-200">
          {rateInfo ? formatRupiah(rateInfo.spread, { showFraction: true }) : '-'}
          {#if rateInfo}
            <span class="text-indigo-400 text-[11px]">({rateInfo.spreadPercent}%)</span>
          {/if}
        </span>
      </div>

      <!-- Quick Convert Preview Mini-Calculator -->
      <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Calculator class="w-4 h-4 text-indigo-400" />
            <span>Kalkulator Cepat</span>
          </div>
          <button
            onclick={toggleReverse}
            class="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            title="Tukar arah konversi"
          >
            <ArrowRightLeft class="w-3 h-3" />
            <span>Tukar</span>
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label for="drawer-calc-input" class="text-[11px] text-slate-400 block mb-1">
              Jumlah {!isReverse ? country.currencyCode : 'IDR'}
            </label>
            <div class="relative">
              <input
                id="drawer-calc-input"
                type="number"
                min="0"
                step="any"
                bind:value={convertAmount}
                class="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
              <span class="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">
                {!isReverse ? country.currencyCode : 'IDR'}
              </span>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span class="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">
              Estimasi Hasil ({isReverse ? country.currencyCode : 'IDR'})
            </span>
            <div class="text-lg font-bold text-emerald-400 font-mono">
              {conversionPreview.resultFormatted}
            </div>
            <div class="text-[10px] text-slate-400 mt-1">
              {conversionPreview.rateNote}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="p-4 border-t border-slate-800/80 bg-slate-950/95 sticky bottom-0 grid grid-cols-2 gap-2">
      <button
        onclick={handleOpenMatrix}
        class="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-all cursor-pointer"
      >
        <Table class="w-3.5 h-3.5" />
        <span>Bandingkan</span>
      </button>

      <button
        onclick={handleOpenConverter}
        class="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-md shadow-indigo-950 transition-all cursor-pointer"
      >
        <Calculator class="w-3.5 h-3.5" />
        <span>Konverter Penuh</span>
      </button>
    </div>
  </aside>
{/if}
