<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    Copy, 
    Check, 
    ArrowUpRight, 
    ArrowDownRight
  } from 'lucide-svelte';
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

<!-- Rate Cards: snapshot format for sharing -->
<div style="display:flex;flex-direction:column;gap:20px;">

  <!-- Section header -->
  <div style="border-bottom:2px solid var(--ink);padding-bottom:14px;display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;">
    <div>
      <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-4);margin-bottom:4px;">
        {t('cards.badge')}
      </p>
      <h2 style="font-size:20px;font-weight:700;color:var(--ink);margin:0;">
        {t('cards.title')}
      </h2>
      <p style="font-size:12px;color:var(--ink-3);margin-top:4px;">
        {t('cards.subtitle')}
      </p>
    </div>

    <button
      type="button"
      class="btn btn-ghost btn-sm"
      onclick={copySummary}
      style="display:flex;align-items:center;gap:6px;"
    >
      {#if isCopied}
        <Check style="width:13px;height:13px;color:var(--pos);" />
        <span style="color:var(--pos);font-weight:700;">{t('cards.copied')}</span>
      {:else}
        <Copy style="width:13px;height:13px;" />
        <span>{t('cards.copyButton')}</span>
      {/if}
    </button>
  </div>

  {#if isLoading}
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;">
      {#each Array(6) as _}
        <div style="border:1px solid var(--bg-rule);border-radius:var(--radius);padding:16px;background:var(--bg-raised);">
          <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
            <div style="height:16px;width:100px;border-radius:2px;" class="animate-shimmer"></div>
            <div style="height:16px;width:50px;border-radius:2px;" class="animate-shimmer"></div>
          </div>
          <div style="height:40px;border-radius:2px;" class="animate-shimmer"></div>
        </div>
      {/each}
    </div>
  {:else}
    <!-- Grid of currency cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;">
      {#each rates.slice(0, 6) as item}
        {@const flag = getCurrencyFlag(item.targetCurrency)}
        {@const isUp = (item.change24h || 0) >= 0}
        <div style="
          border:1px solid var(--bg-rule);
          border-radius:var(--radius);
          padding:16px;
          background:var(--bg-raised);
          display:flex;
          flex-direction:column;
          gap:12px;
          transition:border-color 120ms;
        ">
          <!-- Card Header -->
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:20px;">{flag}</span>
              <div>
                <div style="font-size:15px;font-weight:700;color:var(--ink);">{item.targetCurrency} / IDR</div>
                <div style="font-size:11px;color:var(--ink-4);">{item.providerName}</div>
              </div>
            </div>
            <span class={isUp ? 'pill-pos' : 'pill-neg'} style="font-size:11px;display:inline-flex;align-items:center;gap:2px;">
              {#if isUp}
                <ArrowUpRight style="width:11px;height:11px;" />
              {:else}
                <ArrowDownRight style="width:11px;height:11px;" />
              {/if}
              {formatPercent(item.change24h || 0)}
            </span>
          </div>

          <!-- Buy & Sell Rate Cells -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;border-top:1px solid var(--bg-rule);padding-top:10px;">
            <div style="padding:8px 10px;background:var(--pos-bg);border:1px solid var(--pos-rule);border-radius:var(--radius-sm);">
              <span style="display:block;font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--pos);">
                {t('cards.buyLabel')}
              </span>
              <div style="font-size:14px;font-weight:700;color:var(--ink);margin-top:2px;font-variant-numeric:tabular-nums;">
                {formatRupiah(item.buyRate)}
              </div>
            </div>
            <div style="padding:8px 10px;background:var(--bg-subtle);border:1px solid var(--bg-rule);border-radius:var(--radius-sm);">
              <span style="display:block;font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--ink-4);">
                {t('cards.sellLabel')}
              </span>
              <div style="font-size:14px;font-weight:700;color:var(--ink);margin-top:2px;font-variant-numeric:tabular-nums;">
                {formatRupiah(item.sellRate)}
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
