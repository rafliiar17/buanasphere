<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowRightLeft, TrendingUp, Landmark, ShieldCheck, Sparkles, AlertCircle } from 'lucide-svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { apiClient, SUPPORTED_CURRENCIES, MOCK_PROVIDERS } from '$lib/api/client';
  import type { ConversionResult, ProviderInfo } from '$lib/api/types';
  import { formatRupiah, formatCurrency, formatPercent, formatDateTimeIndo } from '$lib/formatters/currency';

  // Component Props
  interface Props {
    initialFromCurrency?: string;
    initialToCurrency?: string;
    class?: string;
  }

  let {
    initialFromCurrency = 'USD',
    initialToCurrency = 'IDR',
    class: className = '',
  }: Props = $props();

  // Svelte 5 Runes State
  let fromCurrency = $state('USD');
  let toCurrency = $state('IDR');
  let amount = $state<number>(1000);
  let selectedProvider = $state('bca');
  let isLoading = $state(false);
  let conversionResult = $state<ConversionResult | null>(null);

  // Sync prop changes if passed from parent
  $effect(() => {
    if (initialFromCurrency && initialFromCurrency !== fromCurrency) {
      fromCurrency = initialFromCurrency;
    }
    if (initialToCurrency && initialToCurrency !== toCurrency) {
      toCurrency = initialToCurrency;
    }
    performConversion();
  });

  const fromInfo = $derived(SUPPORTED_CURRENCIES.find(c => c.code === fromCurrency) || SUPPORTED_CURRENCIES[0]);
  const toInfo = $derived(SUPPORTED_CURRENCIES.find(c => c.code === toCurrency) || SUPPORTED_CURRENCIES[11]);

  // Derived calculation
  async function performConversion() {
    isLoading = true;
    try {
      conversionResult = await apiClient.convertCurrency(
        fromCurrency,
        toCurrency,
        amount || 0,
        selectedProvider
      );
    } catch (e) {
      console.error('Error converting currency:', e);
    } finally {
      isLoading = false;
    }
  }

  function swapCurrencies() {
    const temp = fromCurrency;
    fromCurrency = toCurrency;
    toCurrency = temp;
    performConversion();
  }

  function setPresetAmount(val: number) {
    amount = val;
    performConversion();
  }

  onMount(() => {
    performConversion();
  });
</script>

<Card class="relative overflow-hidden border-indigo-500/20 bg-gradient-to-b from-slate-900/90 to-slate-950/90">
  <!-- Top decorative accent -->
  <div class="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

  <!-- Header -->
  <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-5">
    <div>
      <div class="flex items-center gap-2">
        <h2 class="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Sparkles class="w-5 h-5 text-indigo-400" />
          Multi-Source Converter
        </h2>
        <Badge variant="success" size="sm">Real-Time</Badge>
      </div>
      <p class="text-xs text-slate-400 mt-0.5">
        Bandingkan hasil konversi nyata di berbagai bank & money changer secara instan
      </p>
    </div>

    <!-- Provider Selection Pill -->
    <div class="flex items-center gap-2">
      <span class="text-xs text-slate-400 font-medium">Sumber Kurs:</span>
      <select
        bind:value={selectedProvider}
        onchange={performConversion}
        class="bg-slate-950 border border-slate-700/80 text-xs font-semibold text-indigo-300 rounded-xl px-3 py-1.5 focus:border-indigo-500 outline-none cursor-pointer"
      >
        {#each MOCK_PROVIDERS as prov}
          <option value={prov.id}>{prov.shortName}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Conversion Grid -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
    <!-- From Input -->
    <div class="lg:col-span-5 space-y-2">
      <div class="flex items-center justify-between text-xs font-semibold text-slate-400">
        <span>Jumlah ({fromCurrency})</span>
        <span class="text-slate-500">{fromInfo.name}</span>
      </div>
      <div class="relative flex items-center rounded-2xl bg-slate-950/90 border border-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all p-2">
        <input
          type="number"
          min="0"
          step="any"
          bind:value={amount}
          oninput={performConversion}
          placeholder="0.00"
          class="w-full bg-transparent text-xl font-bold text-slate-100 px-3 outline-none"
        />
        <div class="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 shrink-0">
          <span class="text-lg">{fromInfo.flag}</span>
          <select
            bind:value={fromCurrency}
            onchange={performConversion}
            class="bg-transparent text-sm font-bold text-slate-200 outline-none cursor-pointer"
          >
            {#each SUPPORTED_CURRENCIES as curr}
              <option value={curr.code} class="bg-slate-900 text-slate-100">{curr.code}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    <!-- Swap Button -->
    <div class="lg:col-span-2 flex justify-center py-2 lg:py-0">
      <button
        type="button"
        onclick={swapCurrencies}
        aria-label="Tukar Posisi Mata Uang"
        class="h-11 w-11 rounded-2xl bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700/80 hover:border-indigo-500 flex items-center justify-center transition-all duration-200 shadow-md active:scale-95 cursor-pointer"
      >
        <ArrowRightLeft class="w-5 h-5" />
      </button>
    </div>

    <!-- To Output -->
    <div class="lg:col-span-5 space-y-2">
      <div class="flex items-center justify-between text-xs font-semibold text-slate-400">
        <span>Hasil Konversi ({toCurrency})</span>
        <span class="text-slate-500">{toInfo.name}</span>
      </div>
      <div class="relative flex items-center rounded-2xl bg-slate-950/90 border border-slate-800 p-2">
        <div class="w-full px-3 text-xl font-extrabold text-emerald-400 truncate">
          {#if isLoading}
            <div class="h-7 w-36 rounded-md animate-shimmer"></div>
          {:else if conversionResult}
            {#if toCurrency === 'IDR'}
              {formatRupiah(conversionResult.resultAmount)}
            {:else}
              {formatCurrency(conversionResult.resultAmount, toCurrency)}
            {/if}
          {:else}
            0.00
          {/if}
        </div>
        <div class="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 shrink-0">
          <span class="text-lg">{toInfo.flag}</span>
          <select
            bind:value={toCurrency}
            onchange={performConversion}
            class="bg-transparent text-sm font-bold text-slate-200 outline-none cursor-pointer"
          >
            {#each SUPPORTED_CURRENCIES as curr}
              <option value={curr.code} class="bg-slate-900 text-slate-100">{curr.code}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>
  </div>

  <!-- Quick Presets -->
  <div class="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800/60">
    <span class="text-xs text-slate-500 font-medium">Pilihan Cepat:</span>
    {#if fromCurrency === 'IDR'}
      {#each [1000000, 5000000, 10000000, 50000000] as preset}
        <button
          type="button"
          class="text-xs px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 font-medium transition cursor-pointer"
          onclick={() => setPresetAmount(preset)}
        >
          {formatRupiah(preset, { showFraction: false })}
        </button>
      {/each}
    {:else}
      {#each [100, 500, 1000, 5000] as preset}
        <button
          type="button"
          class="text-xs px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 font-medium transition cursor-pointer"
          onclick={() => setPresetAmount(preset)}
        >
          {fromInfo.symbol}{preset.toLocaleString()}
        </button>
      {/each}
    {/if}
  </div>

  <!-- Multi-Provider Comparison Cards -->
  {#if conversionResult && conversionResult.comparisons && conversionResult.comparisons.length > 0}
    <div class="mt-6 pt-4 border-t border-slate-800">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Landmark class="w-3.5 h-3.5 text-indigo-400" />
          Komparasi Penerimaan di Berbagai Provider
        </h4>
        <span class="text-[11px] text-slate-500">
          Kurs Acuan: 1 {fromCurrency} = {toCurrency === 'IDR' ? formatRupiah(conversionResult.rateUsed) : formatCurrency(conversionResult.rateUsed, toCurrency)}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {#each conversionResult.comparisons as comp, i}
          {@const isBest = i === 0}
          <div class={`p-3.5 rounded-xl border transition-all ${isBest ? 'bg-indigo-950/30 border-indigo-500/40 ring-1 ring-indigo-500/20' : 'bg-slate-950/60 border-slate-800/80'}`}>
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-semibold text-slate-300">{comp.providerName}</span>
              {#if isBest}
                <Badge variant="success" size="sm">Nilai Terbaik</Badge>
              {/if}
            </div>
            <div class="text-base font-bold text-slate-100">
              {toCurrency === 'IDR' ? formatRupiah(comp.resultAmount, { showFraction: false }) : formatCurrency(comp.resultAmount, toCurrency)}
            </div>
            <div class="text-[11px] mt-1 text-slate-400 flex items-center justify-between">
              {#if isBest}
                <span class="text-emerald-400 font-medium">Rekomendasi Utama</span>
              {:else}
                <span class="text-slate-500">Selisih: {comp.diffWithBest > 0 ? `+${formatRupiah(comp.diffWithBest, { showFraction: false })}` : `${formatRupiah(comp.diffWithBest, { showFraction: false })}`}</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</Card>
