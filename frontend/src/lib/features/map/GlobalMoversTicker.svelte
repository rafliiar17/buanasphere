<script lang="ts">
  import { onMount } from 'svelte';
  import { apiClient, SUPPORTED_CURRENCIES } from '$lib/api/client';
  import type { RateItem } from '$lib/api/types';
  import { formatRupiah, formatPercent } from '$lib/formatters/currency';
  import { t } from '$lib/i18n';

  interface Props {
    onSelectCurrency?: (currencyCode: string) => void;
    class?: string;
  }

  let { onSelectCurrency, class: className = '' }: Props = $props();

  let liveRates = $state<RateItem[]>([]);
  let isLoading = $state(true);

  const POPULAR_CODES = ['USD', 'EUR', 'SGD', 'JPY', 'MYR', 'CNY', 'SAR', 'AUD', 'GBP'];

  // Currency Flag lookup helper
  function getCurrencyFlag(code: string): string {
    const found = SUPPORTED_CURRENCIES.find(c => c.code === code);
    return found?.flag || '🌐';
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

<!-- Ticker: market data strip, horizontal layout -->
<div class="py-1 px-1 text-xs select-none {className}">
  {#if isLoading}
    <!-- Skeleton row -->
    <div class="flex items-center gap-3 py-1">
      {#each Array(6) as _}
        <div class="h-6 w-20 rounded-md animate-shimmer"></div>
      {/each}
    </div>
  {:else}
    <!-- Header row: label + live dot -->
    <div class="flex items-center gap-2 mb-2">
      <span class="text-[10px] font-bold tracking-wider uppercase text-[var(--ink-4)]">
        {t('ticker.marketStatus')}
      </span>
      <span class="live-dot"></span>
    </div>

    <!-- Row 1: Gaining & Declining side-by-side -->
    <div class="flex items-center gap-3 flex-wrap mb-2">
      <!-- Gainers -->
      <div class="flex items-center gap-1.5 flex-wrap">
        <span class="text-[10px] font-bold tracking-wider uppercase text-[var(--pos)] shrink-0">
          ↑ {t('map.strengthening')}
        </span>
        {#each topGainers as item}
          <button
            type="button"
            onclick={() => handleCurrencyClick(item.targetCurrency)}
            class="inline-flex items-center gap-1.5 px-2 py-1 border border-[var(--pos-rule)] bg-[var(--pos-bg)] rounded-md hover:border-[var(--pos)] transition cursor-pointer text-xs font-semibold whitespace-nowrap"
            title={item.targetCurrency}
          >
            <span class="text-[11px]">{getCurrencyFlag(item.targetCurrency)}</span>
            <span class="font-bold text-[var(--ink)]">{item.targetCurrency}</span>
            <span class="text-[11px] font-semibold text-[var(--pos)] font-mono">{formatPercent(item.change24h ?? 0)}</span>
          </button>
        {/each}
      </div>

      <div class="w-px h-4 bg-[var(--bg-rule)] hidden sm:block"></div>

      <!-- Losers -->
      <div class="flex items-center gap-1.5 flex-wrap">
        <span class="text-[10px] font-bold tracking-wider uppercase text-[var(--signal)] shrink-0">
          ↓ {t('map.weakening')}
        </span>
        {#each topLosers as item}
          <button
            type="button"
            onclick={() => handleCurrencyClick(item.targetCurrency)}
            class="inline-flex items-center gap-1.5 px-2 py-1 border border-[var(--signal-rule)] bg-[var(--signal-bg)] rounded-md hover:border-[var(--signal)] transition cursor-pointer text-xs font-semibold whitespace-nowrap"
            title={item.targetCurrency}
          >
            <span class="text-[11px]">{getCurrencyFlag(item.targetCurrency)}</span>
            <span class="font-bold text-[var(--ink)]">{item.targetCurrency}</span>
            <span class="text-[11px] font-semibold text-[var(--signal)] font-mono">{formatPercent(item.change24h ?? 0)}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Row 2: Popular Currencies flowing horizontally across full width -->
    <div class="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[var(--bg-rule)]/60">
      <span class="text-[10px] font-bold tracking-wider uppercase text-[var(--ink-4)] shrink-0 mr-1">
        {t('ticker.popularCurrencies')}:
      </span>
      {#each popularRates as item}
        {@const changeVal = item.change24h ?? 0}
        {@const isPos = changeVal >= 0}
        <button
          type="button"
          onclick={() => handleCurrencyClick(item.targetCurrency)}
          class="inline-flex items-center gap-1 px-2 py-0.5 border border-[var(--bg-rule)] bg-[var(--bg-raised)] rounded-md hover:bg-[var(--bg-subtle)] hover:border-[var(--ink-ghost)] transition cursor-pointer text-xs font-semibold whitespace-nowrap"
          title={t('ticker.rateTitle', { currency: item.targetCurrency })}
        >
          <span class="text-[11px]">{getCurrencyFlag(item.targetCurrency)}</span>
          <span class="font-bold text-[var(--ink)]">{item.targetCurrency}</span>
          <span class="text-[11px] text-[var(--ink-3)] font-mono">
            {formatRupiah(item.middleRate, { showFraction: false, withPrefix: false })}
          </span>
          <span class="text-[10px] font-semibold font-mono {isPos ? 'text-[var(--pos)]' : 'text-[var(--signal)]'}">
            {formatPercent(changeVal)}
          </span>
        </button>
      {/each}
    </div>
  {/if}
</div>
