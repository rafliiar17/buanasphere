<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    TrendingUp, 
    TrendingDown, 
    Sparkles, 
    Flame, 
    Activity, 
    ChevronRight,
    Coins,
    Globe2
  } from 'lucide-svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { apiClient, SUPPORTED_CURRENCIES } from '$lib/api/client';
  import type { RateItem } from '$lib/api/types';
  import { formatRupiah, formatPercent } from '$lib/formatters/currency';

  interface Props {
    onSelectCurrency?: (currencyCode: string) => void;
    class?: string;
  }

  let { onSelectCurrency, class: className = '' }: Props = $props();

  let liveRates = $state<RateItem[]>([]);
  let isLoading = $state(true);
  let activeCategory = $state<'all' | 'gainers' | 'losers' | 'popular'>('all');

  const POPULAR_CODES = ['USD', 'EUR', 'SGD', 'JPY', 'MYR', 'CNY', 'SAR', 'AUD', 'GBP'];

  // Currency Flag lookup helper
  function getCurrencyFlag(code: string): string {
    const found = SUPPORTED_CURRENCIES.find(c => c.code === code);
    return found?.flag || '🌐';
  }

  function getCurrencyName(code: string): string {
    const found = SUPPORTED_CURRENCIES.find(c => c.code === code);
    return found?.name || code;
  }

  onMount(async () => {
    try {
      liveRates = await apiClient.getLiveRates('IDR');
    } catch (err) {
      console.error('Error fetching live rates for ticker:', err);
    } finally {
      isLoading = false;
    }
  });

  // Derived: Top 3 Gainers (Menguat vs IDR - positive change24h)
  const topGainers = $derived.by<RateItem[]>(() => {
    if (!liveRates.length) return [];
    return [...liveRates]
      .sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0))
      .slice(0, 3);
  });

  // Derived: Top 3 Losers (Melemah vs IDR - negative change24h)
  const topLosers = $derived.by<RateItem[]>(() => {
    if (!liveRates.length) return [];
    return [...liveRates]
      .sort((a, b) => (a.change24h ?? 0) - (b.change24h ?? 0))
      .slice(0, 3);
  });

  // Derived: Popular Currencies
  const popularRates = $derived.by<RateItem[]>(() => {
    if (!liveRates.length) return [];
    return POPULAR_CODES.map(code => {
      return liveRates.find(r => r.targetCurrency === code);
    }).filter((r): r is RateItem => Boolean(r));
  });

  function handleCurrencyClick(code: string) {
    if (onSelectCurrency) {
      onSelectCurrency(code);
    }
  }
</script>

<div class={`relative overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950 p-3 sm:p-4 shadow-xl backdrop-blur-md ${className}`}>
  <!-- Decorative background glow -->
  <div class="absolute -top-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
  <div class="absolute -bottom-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

  {#if isLoading}
    <!-- Ticker Skeleton -->
    <div class="flex items-center gap-4 overflow-hidden py-1">
      <div class="h-6 w-32 rounded-lg animate-shimmer shrink-0"></div>
      <div class="h-8 w-48 rounded-xl animate-shimmer shrink-0"></div>
      <div class="h-8 w-48 rounded-xl animate-shimmer shrink-0"></div>
      <div class="h-8 w-48 rounded-xl animate-shimmer shrink-0"></div>
    </div>
  {:else}
    <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
      <!-- Ticker Title & Status Indicator -->
      <div class="flex items-center gap-2.5 shrink-0 border-b xl:border-b-0 xl:border-r border-slate-800/80 pb-2.5 xl:pb-0 xl:pr-4">
        <div class="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <Activity class="w-4 h-4" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              Global Movers
            </span>
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <p class="text-[10px] text-slate-400">Divergensi 24 Jam vs IDR</p>
        </div>
      </div>

      <!-- Highlights Content: Gainers, Losers, & Popular Currencies -->
      <div class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3 flex-1">
        <!-- TOP GAINERS (Menguat) -->
        <div class="flex flex-col gap-1.5 p-2.5 rounded-xl bg-slate-950/70 border border-emerald-500/20 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
              <TrendingUp class="w-3.5 h-3.5" />
              Top 3 Menguat vs IDR
            </span>
            <Badge variant="success" size="sm" class="text-[10px] py-0 px-1.5">Bullish</Badge>
          </div>
          <div class="flex items-center gap-2 overflow-x-auto pb-0.5">
            {#each topGainers as item}
              {@const flag = getCurrencyFlag(item.targetCurrency)}
              <button
                type="button"
                onclick={() => handleCurrencyClick(item.targetCurrency)}
                class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 hover:border-emerald-400 text-xs font-semibold text-slate-200 transition shrink-0 cursor-pointer group"
                title={`Klik untuk fokus ${item.targetCurrency} di Peta`}
              >
                <span>{flag}</span>
                <span class="font-bold text-white group-hover:text-emerald-300">{item.targetCurrency}</span>
                <span class="text-[11px] text-emerald-400 font-bold">{formatPercent(item.change24h ?? 0)}</span>
              </button>
            {/each}
          </div>
        </div>

        <!-- TOP LOSERS (Melemah) -->
        <div class="flex flex-col gap-1.5 p-2.5 rounded-xl bg-slate-950/70 border border-rose-500/20 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-rose-400 flex items-center gap-1">
              <TrendingDown class="w-3.5 h-3.5" />
              Top 3 Melemah vs IDR
            </span>
            <Badge variant="destructive" size="sm" class="text-[10px] py-0 px-1.5">Bearish</Badge>
          </div>
          <div class="flex items-center gap-2 overflow-x-auto pb-0.5">
            {#each topLosers as item}
              {@const flag = getCurrencyFlag(item.targetCurrency)}
              <button
                type="button"
                onclick={() => handleCurrencyClick(item.targetCurrency)}
                class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 hover:border-rose-400 text-xs font-semibold text-slate-200 transition shrink-0 cursor-pointer group"
                title={`Klik untuk fokus ${item.targetCurrency} di Peta`}
              >
                <span>{flag}</span>
                <span class="font-bold text-white group-hover:text-rose-300">{item.targetCurrency}</span>
                <span class="text-[11px] text-rose-400 font-bold">{formatPercent(item.change24h ?? 0)}</span>
              </button>
            {/each}
          </div>
        </div>

        <!-- POPULAR CURRENCIES BAR -->
        <div class="md:col-span-2 2xl:col-span-1 flex flex-col gap-1.5 p-2.5 rounded-xl bg-slate-950/70 border border-indigo-500/20 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
              <Coins class="w-3.5 h-3.5 text-indigo-400" />
              Valas Populer Hari Ini
            </span>
            <span class="text-[10px] text-slate-400 font-medium">Klik untuk inspeksi</span>
          </div>
          <div class="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {#each popularRates.slice(0, 5) as item}
              {@const flag = getCurrencyFlag(item.targetCurrency)}
              {@const changeVal = item.change24h ?? 0}
              {@const isPos = changeVal >= 0}
              <button
                type="button"
                onclick={() => handleCurrencyClick(item.targetCurrency)}
                class="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-200 transition shrink-0 cursor-pointer group"
                title={`Lihat detail ${item.targetCurrency}`}
              >
                <span>{flag}</span>
                <span class="font-bold text-white group-hover:text-indigo-300">{item.targetCurrency}</span>
                <span class="text-[10px] text-slate-400">{formatRupiah(item.middleRate, { showFraction: false, withPrefix: false })}</span>
                <span class={`text-[10px] font-semibold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatPercent(changeVal)}
                </span>
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
