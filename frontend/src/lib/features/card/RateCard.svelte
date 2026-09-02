<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    Copy, 
    Check, 
    Sparkles, 
    ArrowUpRight, 
    ArrowDownRight
  } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import CardSkeleton from '$lib/components/skeletons/CardSkeleton.svelte';
  import { apiClient, SUPPORTED_CURRENCIES } from '$lib/api/client';
  import type { RateItem } from '$lib/api/types';
  import { formatRupiah, formatPercent, formatDateTimeIndo } from '$lib/formatters/currency';
  import { t } from '$lib/i18n';

  let rates = $state<RateItem[]>([]);
  let isLoading = $state(true);
  let isCopied = $state(false);

  async function loadRates() {
    isLoading = true;
    try {
      rates = await apiClient.getLiveRates('IDR');
    } catch (e) {
      console.error('Error fetching live rates:', e);
    } finally {
      isLoading = false;
    }
  }

  function getCurrencyFlag(code: string) {
    return SUPPORTED_CURRENCIES.find(c => c.code === code)?.flag || '🌐';
  }

  function copySummary() {
    if (rates.length === 0) return;
    const now = formatDateTimeIndo(new Date());
    let text = `📊 *KURS WORLD — Update Kurs Valas Hari Ini*\n🕒 ${now}\nSumber: Multi-Bank Indonesia\n\n`;

    rates.slice(0, 6).forEach(r => {
      const flag = getCurrencyFlag(r.targetCurrency);
      text += `${flag} *${r.targetCurrency}/IDR*\n`;
      text += `  • Beli : ${formatRupiah(r.buyRate)}\n`;
      text += `  • Jual : ${formatRupiah(r.sellRate)}\n`;
      text += `  • 24h  : ${formatPercent(r.change24h || 0)}\n\n`;
    });

    text += `🔗 Cek perbandingan lengkap: https://kurs.world\n100% Gratis • Non-Fintech`;

    navigator.clipboard.writeText(text);
    isCopied = true;
    setTimeout(() => {
      isCopied = false;
    }, 2500);
  }

  onMount(() => {
    loadRates();
  });
</script>

<div class="space-y-4">
  <!-- Top Action Bar -->
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-lg font-bold text-slate-100 flex items-center gap-2">
        <Sparkles class="w-5 h-5 text-indigo-400" />
        {t('cards.title')}
      </h3>
      <p class="text-xs text-slate-400">
        {t('cards.subtitle')}
      </p>
    </div>

    <Button
      variant="subtle"
      size="sm"
      onclick={copySummary}
    >
      {#if isCopied}
        <Check class="w-4 h-4 text-emerald-400" />
        <span class="text-emerald-400 font-semibold">{t('cards.copied')}</span>
      {:else}
        <Copy class="w-4 h-4" />
        <span>{t('cards.copyButton')}</span>
      {/if}
    </Button>
  </div>

  {#if isLoading}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each Array(6) as _}
        <CardSkeleton type="stat" />
      {/each}
    </div>
  {:else}
    <!-- Grid of currency cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each rates.slice(0, 6) as item}
        {@const flag = getCurrencyFlag(item.targetCurrency)}
        {@const isUp = (item.change24h || 0) >= 0}
        <div class="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md hover:border-slate-700/80 transition-all shadow-lg hover:shadow-indigo-950/20">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">{flag}</span>
              <div>
                <div class="font-bold text-slate-100">{item.targetCurrency} / IDR</div>
                <div class="text-[11px] text-slate-500">{item.providerName}</div>
              </div>
            </div>
            <Badge variant={isUp ? 'destructive' : 'success'} size="sm">
              <span class="flex items-center gap-0.5">
                {#if isUp}
                  <ArrowUpRight class="w-3 h-3" />
                {:else}
                  <ArrowDownRight class="w-3 h-3" />
                {/if}
                {formatPercent(item.change24h || 0)}
              </span>
            </Badge>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-xs">
            <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/50">
              <span class="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{t('cards.buyLabel')}</span>
              <div class="text-sm font-bold text-emerald-400 mt-0.5">
                {formatRupiah(item.buyRate)}
              </div>
            </div>
            <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/50">
              <span class="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{t('cards.sellLabel')}</span>
              <div class="text-sm font-bold text-indigo-400 mt-0.5">
                {formatRupiah(item.sellRate)}
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
