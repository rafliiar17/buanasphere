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

<!-- Ticker: market data strip, editorial style -->
<div
  style="
    padding: 10px 0;
    overflow: hidden;
    font-size: 12px;
    position: relative;
  "
  class={className}
>
  {#if isLoading}
    <!-- Skeleton row -->
    <div style="display:flex;gap:16px;align-items:center;padding:4px 0;">
      {#each Array(8) as _}
        <div style="height:22px;width:80px;border-radius:3px;" class="animate-shimmer"></div>
      {/each}
    </div>
  {:else}
    <!-- Header row: label + live dot -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
      <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-4);">
        Pergerakan 24 Jam vs IDR
      </span>
      <span class="live-dot"></span>
    </div>

    <!-- Three sections: Gainers · Losers · Popular in one dense row -->
    <div style="display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start;">

      <!-- Gainers -->
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:nowrap;">
        <span style="font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--pos);white-space:nowrap;">
          ↑ Menguat
        </span>
        {#each topGainers as item}
          <button
            type="button"
            onclick={() => handleCurrencyClick(item.targetCurrency)}
            style="
              display:inline-flex;align-items:center;gap:5px;
              padding:3px 8px;
              border:1px solid var(--pos-rule);
              background:var(--pos-bg);
              border-radius:3px;
              cursor:pointer;
              transition:all 120ms;
              white-space:nowrap;
            "
            title={`Fokus ${item.targetCurrency}`}
            onmouseenter={(e) => (e.currentTarget.style.borderColor = 'var(--pos)')}
            onmouseleave={(e) => (e.currentTarget.style.borderColor = 'var(--pos-rule)')}
          >
            <span style="font-size:11px;">{getCurrencyFlag(item.targetCurrency)}</span>
            <span style="font-size:12px;font-weight:700;color:var(--ink);">{item.targetCurrency}</span>
            <span style="font-size:11px;font-weight:600;color:var(--pos);font-variant-numeric:tabular-nums;">{formatPercent(item.change24h ?? 0)}</span>
          </button>
        {/each}
      </div>

      <!-- Separator -->
      <div style="width:1px;background:var(--bg-rule);align-self:stretch;flex-shrink:0;"></div>

      <!-- Losers -->
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:nowrap;">
        <span style="font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--signal);white-space:nowrap;">
          ↓ Melemah
        </span>
        {#each topLosers as item}
          <button
            type="button"
            onclick={() => handleCurrencyClick(item.targetCurrency)}
            style="
              display:inline-flex;align-items:center;gap:5px;
              padding:3px 8px;
              border:1px solid var(--signal-rule);
              background:var(--signal-bg);
              border-radius:3px;
              cursor:pointer;
              transition:all 120ms;
              white-space:nowrap;
            "
            title={`Fokus ${item.targetCurrency}`}
            onmouseenter={(e) => (e.currentTarget.style.borderColor = 'var(--signal)')}
            onmouseleave={(e) => (e.currentTarget.style.borderColor = 'var(--signal-rule)')}
          >
            <span style="font-size:11px;">{getCurrencyFlag(item.targetCurrency)}</span>
            <span style="font-size:12px;font-weight:700;color:var(--ink);">{item.targetCurrency}</span>
            <span style="font-size:11px;font-weight:600;color:var(--signal);font-variant-numeric:tabular-nums;">{formatPercent(item.change24h ?? 0)}</span>
          </button>
        {/each}
      </div>

      <!-- Separator -->
      <div style="width:1px;background:var(--bg-rule);align-self:stretch;flex-shrink:0;"></div>

      <!-- Popular: scrolling rate ticker chips -->
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;flex:1;min-width:0;">
        <span style="font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--ink-4);white-space:nowrap;flex-shrink:0;">
          Populer
        </span>
        {#each popularRates as item}
          {@const changeVal = item.change24h ?? 0}
          {@const isPos = changeVal >= 0}
          <button
            type="button"
            onclick={() => handleCurrencyClick(item.targetCurrency)}
            style="
              display:inline-flex;align-items:center;gap:5px;
              padding:3px 8px;
              border:1px solid var(--bg-rule);
              background:var(--bg-raised);
              border-radius:3px;
              cursor:pointer;
              transition:all 120ms;
              white-space:nowrap;
            "
            title={`Kurs ${item.targetCurrency}/IDR`}
            onmouseenter={(e) => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.borderColor = 'var(--ink-ghost)'; }}
            onmouseleave={(e) => { e.currentTarget.style.background = 'var(--bg-raised)'; e.currentTarget.style.borderColor = 'var(--bg-rule)'; }}
          >
            <span style="font-size:11px;">{getCurrencyFlag(item.targetCurrency)}</span>
            <span style="font-size:12px;font-weight:700;color:var(--ink);">{item.targetCurrency}</span>
            <span style="font-size:11px;color:var(--ink-3);font-variant-numeric:tabular-nums;">
              {formatRupiah(item.middleRate, { showFraction: false, withPrefix: false })}
            </span>
            <span style="font-size:11px;font-weight:600;font-variant-numeric:tabular-nums;color:{isPos ? 'var(--pos)' : 'var(--signal)'}">
              {formatPercent(changeVal)}
            </span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
