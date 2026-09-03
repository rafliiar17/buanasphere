<script lang="ts">
  import { globeState, type ViewMode } from '../state/globeState.svelte';
  import { ratesState } from '../state/ratesState.svelte';
  import { formatRupiah, formatPercent } from '../formatters/currency';
  import {
    Globe,
    Table,
    ArrowLeftRight,
    Sun,
    Moon,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Sparkles,
  } from 'lucide-svelte';

  // State
  let isDarkMode = $state<boolean>(true);

  // Key currency pairs for the top ticker
  const TICKER_CURRENCIES = ['USD', 'EUR', 'SGD', 'JPY', 'GBP', 'AUD', 'CNY', 'SAR'];

  const tickerItems = $derived(
    TICKER_CURRENCIES.map((code) => {
      const rateInfo = ratesState.getRate(code);
      return {
        code,
        flag: rateInfo?.flagEmoji ?? '🌐',
        rate: rateInfo?.middleRate ?? 0,
        change: rateInfo?.change24h ?? 0,
      };
    })
  );

  function toggleTheme() {
    isDarkMode = !isDarkMode;
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (isDarkMode) {
        root.setAttribute('data-theme', 'dark');
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.setAttribute('data-theme', 'light');
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }
  }

  function handleRefresh() {
    ratesState.fetchRates();
  }

  function handleSelectView(mode: ViewMode) {
    globeState.setViewMode(mode);
  }
</script>

<header class="w-full z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 transition-colors">
  <!-- Top ticker bar -->
  <div class="w-full overflow-hidden bg-slate-900/60 border-b border-slate-800/40 text-xs py-1.5 px-4">
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
      <div class="flex items-center gap-2 text-slate-400 shrink-0 font-medium text-[11px]">
        <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="uppercase tracking-wider">Live Kurs Spot</span>
      </div>

      <!-- Marquee / Ticker items -->
      <div class="flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth py-0.5 text-slate-200">
        {#each tickerItems as item (item.code)}
          <div class="flex items-center gap-1.5 shrink-0 hover:text-white transition-colors cursor-default">
            <span>{item.flag}</span>
            <span class="font-semibold text-slate-300">{item.code}/IDR</span>
            <span class="font-mono text-slate-100">{formatRupiah(item.rate, { showFraction: item.rate < 1000 })}</span>
            <span
              class="inline-flex items-center text-[10px] font-medium px-1 rounded {item.change >= 0
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-rose-400 bg-rose-500/10'}"
            >
              {#if item.change >= 0}
                <TrendingUp class="w-3 h-3 mr-0.5" />
              {:else}
                <TrendingDown class="w-3 h-3 mr-0.5" />
              {/if}
              {formatPercent(item.change)}
            </span>
          </div>
        {/each}
      </div>

      <button
        onclick={handleRefresh}
        class="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-400 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
        disabled={ratesState.isLoading}
        title="Perbarui kurs live"
      >
        <RefreshCw class="w-3 h-3 {ratesState.isLoading ? 'animate-spin text-indigo-400' : ''}" />
        <span class="hidden sm:inline">Perbarui</span>
      </button>
    </div>
  </div>

  <!-- Main navigation bar -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
    <!-- Brand / Logo -->
    <div class="flex items-center gap-3">
      <div class="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-400 text-white shadow-md shadow-indigo-500/20">
        <Globe class="w-5 h-5 text-white" />
        <Sparkles class="w-3 h-3 absolute -top-1 -right-1 text-amber-300 animate-pulse" />
      </div>

      <div class="flex flex-col">
        <div class="flex items-center gap-2">
          <span class="text-lg font-bold tracking-tight text-white">Kurs World</span>
          <span class="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md">
            BuanaSphere
          </span>
        </div>
        <span class="text-[11px] text-slate-400">Global FX Spatial Visualizer</span>
      </div>
    </div>

    <!-- Center Navigation Tabs: Globe / Matrix / Converter -->
    <nav class="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800 shadow-inner">
      <button
        onclick={() => handleSelectView('globe')}
        class="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer {globeState.viewMode === 'globe'
          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}"
      >
        <Globe class="w-4 h-4" />
        <span>Globe 3D</span>
      </button>

      <button
        onclick={() => handleSelectView('matrix')}
        class="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer {globeState.viewMode === 'matrix'
          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}"
      >
        <Table class="w-4 h-4" />
        <span>Matriks Kurs</span>
      </button>

      <button
        onclick={() => handleSelectView('converter')}
        class="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer {globeState.viewMode === 'converter'
          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}"
      >
        <ArrowLeftRight class="w-4 h-4" />
        <span>Konverter</span>
      </button>
    </nav>

    <!-- Right Controls: Theme Switch -->
    <div class="flex items-center gap-2">
      <button
        onclick={toggleTheme}
        class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
        aria-label="Toggle Theme"
        title={isDarkMode ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
      >
        {#if isDarkMode}
          <Sun class="w-4 h-4 text-amber-400" />
        {:else}
          <Moon class="w-4 h-4 text-indigo-400" />
        {/if}
      </button>
    </div>
  </div>
</header>
