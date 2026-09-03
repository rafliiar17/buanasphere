<script lang="ts">
  import { ratesState } from '../state/ratesState.svelte';
  import { globeState } from '../state/globeState.svelte';
  import {
    EXTENDED_COUNTRIES_DATA,
    getCountryByCurrency,
  } from '../data/countrySpatialData';
  import {
    formatRupiah,
    formatCurrency,
    formatDateTimeIndo,
  } from '../formatters/currency';
  import {
    ArrowUpDown,
    ArrowLeftRight,
    Globe,
    Check,
    Sparkles,
    Calculator,
    TrendingUp,
  } from 'lucide-svelte';

  // Currency options (unique currency list)
  const currencyOptions = Array.from(
    new Map(
      EXTENDED_COUNTRIES_DATA.map((c) => [
        c.currencyCode.toUpperCase(),
        {
          code: c.currencyCode.toUpperCase(),
          name: c.currencyName,
          country: c.countryName,
          flag: c.flagEmoji,
        },
      ])
    ).values()
  ).sort((a, b) => {
    // Prioritize USD, IDR, EUR, SGD, JPY
    const priority = ['USD', 'IDR', 'EUR', 'SGD', 'JPY', 'GBP', 'AUD', 'MYR', 'SAR', 'CNY'];
    const idxA = priority.indexOf(a.code);
    const idxB = priority.indexOf(b.code);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.code.localeCompare(b.code);
  });

  // Converter state
  let fromCurrency = $state<string>('USD');
  let toCurrency = $state<string>('IDR');
  let inputAmount = $state<number>(100);

  // Quick preset amounts
  const presets = [10, 50, 100, 500, 1000];

  // Quick pair shortcuts
  const popularPairs = [
    { from: 'USD', to: 'IDR' },
    { from: 'SGD', to: 'IDR' },
    { from: 'EUR', to: 'IDR' },
    { from: 'JPY', to: 'IDR' },
    { from: 'MYR', to: 'IDR' },
    { from: 'AUD', to: 'IDR' },
    { from: 'SAR', to: 'IDR' },
    { from: 'CNY', to: 'IDR' },
  ];

  const conversion = $derived(
    ratesState.convert(inputAmount, fromCurrency, toCurrency)
  );

  const fromInfo = $derived(
    currencyOptions.find((c) => c.code === fromCurrency) ?? {
      code: fromCurrency,
      name: fromCurrency,
      country: '',
      flag: '🌐',
    }
  );

  const toInfo = $derived(
    currencyOptions.find((c) => c.code === toCurrency) ?? {
      code: toCurrency,
      name: toCurrency,
      country: '',
      flag: '🌐',
    }
  );

  function swapCurrencies() {
    const temp = fromCurrency;
    fromCurrency = toCurrency;
    toCurrency = temp;
  }

  function setPreset(val: number) {
    inputAmount = val;
  }

  function setPair(from: string, to: string) {
    fromCurrency = from;
    toCurrency = to;
  }
</script>

<div class="w-full max-w-2xl mx-auto p-4 sm:p-6 my-6">
  <!-- Outer Card with Glassmorphism -->
  <div class="bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Calculator class="w-5 h-5" />
        </div>
        <div>
          <h2 class="text-xl font-bold text-white tracking-tight">Konverter Mata Uang</h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Konversi instan dengan kurs real-time pasar global
          </p>
        </div>
      </div>

      <button
        onclick={() => globeState.setViewMode('globe')}
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer"
      >
        <Globe class="w-3.5 h-3.5 text-indigo-400" />
        <span class="hidden sm:inline">Kembali ke Globe</span>
      </button>
    </div>

    <!-- Popular Pairs Quick Selection -->
    <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-4 text-xs">
      <span class="text-slate-400 text-[11px] shrink-0 font-medium mr-1">Populer:</span>
      {#each popularPairs as p}
        <button
          onclick={() => setPair(p.from, p.to)}
          class="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer {fromCurrency === p.from && toCurrency === p.to
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60'}"
        >
          {p.from}/{p.to}
        </button>
      {/each}
    </div>

    <!-- Inputs Container -->
    <div class="space-y-4">
      <!-- From Currency Box -->
      <div class="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 focus-within:border-indigo-500/80 transition-all">
        <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Dari Mata Uang</span>
          <span class="font-medium text-slate-300">{fromInfo.name}</span>
        </div>

        <div class="flex items-center gap-3">
          <!-- Currency Selector Dropdown -->
          <div class="relative shrink-0">
            <select
              bind:value={fromCurrency}
              class="appearance-none bg-slate-900 hover:bg-slate-800/90 border border-slate-700 text-white font-semibold text-sm rounded-xl pl-9 pr-8 py-2.5 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/30 transition-all"
            >
              {#each currencyOptions as opt}
                <option value={opt.code} class="bg-slate-900 text-white">
                  {opt.flag} {opt.code} - {opt.country}
                </option>
              {/each}
            </select>
            <span class="absolute left-2.5 top-2.5 text-base pointer-events-none">{fromInfo.flag}</span>
            <div class="absolute right-2.5 top-3.5 pointer-events-none text-slate-400 text-xs">▼</div>
          </div>

          <!-- Amount Input -->
          <input
            type="number"
            min="0"
            step="any"
            bind:value={inputAmount}
            class="w-full bg-transparent text-right font-mono text-2xl font-bold text-white placeholder-slate-600 outline-none"
            placeholder="0"
          />
        </div>

        <!-- Quick Presets -->
        <div class="flex items-center justify-end gap-1.5 mt-3 pt-3 border-t border-slate-800/50">
          <span class="text-[10px] text-slate-400 mr-1">Preset:</span>
          {#each presets as amt}
            <button
              onclick={() => setPreset(amt)}
              class="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
            >
              +{amt}
            </button>
          {/each}
        </div>
      </div>

      <!-- Swap Button in Middle -->
      <div class="flex justify-center -my-2 relative z-10">
        <button
          onclick={swapCurrencies}
          class="w-11 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/80 border-2 border-slate-900 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          title="Tukar mata uang (Swap)"
        >
          <ArrowUpDown class="w-5 h-5" />
        </button>
      </div>

      <!-- To Currency Box -->
      <div class="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 focus-within:border-indigo-500/80 transition-all">
        <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Ke Mata Uang</span>
          <span class="font-medium text-slate-300">{toInfo.name}</span>
        </div>

        <div class="flex items-center gap-3">
          <!-- Currency Selector Dropdown -->
          <div class="relative shrink-0">
            <select
              bind:value={toCurrency}
              class="appearance-none bg-slate-900 hover:bg-slate-800/90 border border-slate-700 text-white font-semibold text-sm rounded-xl pl-9 pr-8 py-2.5 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/30 transition-all"
            >
              {#each currencyOptions as opt}
                <option value={opt.code} class="bg-slate-900 text-white">
                  {opt.flag} {opt.code} - {opt.country}
                </option>
              {/each}
            </select>
            <span class="absolute left-2.5 top-2.5 text-base pointer-events-none">{toInfo.flag}</span>
            <div class="absolute right-2.5 top-3.5 pointer-events-none text-slate-400 text-xs">▼</div>
          </div>

          <!-- Converted Result Display -->
          <div class="w-full text-right font-mono text-2xl font-bold text-emerald-400 overflow-x-auto truncate">
            {toCurrency === 'IDR'
              ? formatRupiah(conversion.result, { showFraction: conversion.result < 1000 })
              : formatCurrency(conversion.result, toCurrency)}
          </div>
        </div>
      </div>
    </div>

    <!-- Exchange Rate Summary Card -->
    <div class="mt-6 p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-xs space-y-2">
      <div class="flex items-center justify-between text-slate-300">
        <span class="text-slate-400">Kurs Konversi Saat Ini:</span>
        <span class="font-mono font-semibold text-white">
          1 {fromCurrency} = {toCurrency === 'IDR' ? formatRupiah(conversion.rate) : `${conversion.rate.toFixed(4)} ${toCurrency}`}
        </span>
      </div>

      <div class="flex items-center justify-between text-slate-400 text-[11px]">
        <span>Kurs Kebalikan (Inverse):</span>
        <span class="font-mono">
          1 {toCurrency} = {conversion.inverseRate < 0.0001 ? conversion.inverseRate.toExponential(4) : conversion.inverseRate.toFixed(4)} {fromCurrency}
        </span>
      </div>

      <div class="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
        <span class="flex items-center gap-1">
          <Sparkles class="w-3 h-3 text-indigo-400" />
          <span>Sumber: Kurs World Market Feed</span>
        </span>
        <span>{ratesState.lastUpdated ? formatDateTimeIndo(ratesState.lastUpdated) : 'Live'}</span>
      </div>
    </div>
  </div>
</div>
