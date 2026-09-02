<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowRightLeft } from 'lucide-svelte';
  import { apiClient, SUPPORTED_CURRENCIES, MOCK_PROVIDERS } from '$lib/api/client';
  import type { ConversionResult } from '$lib/api/types';
  import { formatRupiah, formatCurrency } from '$lib/formatters/currency';
  import { t, getLocalizedCurrencyName } from '$lib/i18n';

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

<!-- Currency Converter: editorial calculator panel -->
<div style="display:flex;flex-direction:column;gap:20px;" class={className}>

  <!-- Section header -->
  <div style="border-bottom:2px solid var(--ink);padding-bottom:14px;display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;">
    <div>
      <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-4);margin-bottom:4px;">
        {t('converter.badge')}
      </p>
      <h2 style="font-size:20px;font-weight:700;color:var(--ink);margin:0;">
        {t('converter.title')}
      </h2>
      <p style="font-size:12px;color:var(--ink-3);margin-top:4px;">
        {t('converter.subtitle')}
      </p>
    </div>
    <!-- Provider selector -->
    <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
      <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-4);">{t('converter.sourceLabel')}</span>
      <select bind:value={selectedProvider} onchange={performConversion} class="field" style="width:auto;padding:5px 10px;font-size:12px;">
        {#each MOCK_PROVIDERS as prov}
          <option value={prov.id}>{prov.shortName}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Conversion input row -->
  <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:end;">

    <!-- From -->
    <div>
      <label for="converter-amount-input" style="display:block;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--ink-4);margin-bottom:6px;">
        {t('converter.amountLabel', { currency: fromCurrency })}
      </label>
      <div style="display:flex;border:1px solid var(--bg-rule);border-radius:var(--radius);overflow:hidden;background:var(--bg-raised);">
        <input
          id="converter-amount-input"
          type="number"
          min="0"
          step="any"
          bind:value={amount}
          oninput={performConversion}
          placeholder="0"
          style="
            flex:1;
            border:none;
            outline:none;
            padding:10px 12px;
            font-size:20px;
            font-weight:700;
            color:var(--ink);
            background:transparent;
            font-variant-numeric:tabular-nums;
            min-width:0;
          "
        />
        <div style="display:flex;align-items:center;gap:6px;padding:8px 10px;border-left:1px solid var(--bg-rule);background:var(--bg-subtle);">
          <span style="font-size:16px;">{fromInfo.flag}</span>
          <select aria-label={t('converter.amountLabel', { currency: fromCurrency })} bind:value={fromCurrency} onchange={performConversion}
            style="border:none;outline:none;background:transparent;font-size:13px;font-weight:700;color:var(--ink);cursor:pointer;">
            {#each SUPPORTED_CURRENCIES as curr}
              <option value={curr.code}>{curr.code}</option>
            {/each}
          </select>
        </div>
      </div>
      <p style="font-size:11px;color:var(--ink-4);margin-top:4px;">{getLocalizedCurrencyName(fromInfo.code, fromInfo.name)}</p>
    </div>

    <!-- Swap -->
    <div style="padding-bottom:24px;">
      <button
        type="button"
        onclick={swapCurrencies}
        aria-label={t('converter.swapButton')}
        class="btn btn-ghost"
        style="padding:9px;border-radius:50%;"
      >
        <ArrowRightLeft style="width:16px;height:16px;" />
      </button>
    </div>

    <!-- To -->
    <div>
      <span style="display:block;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--ink-4);margin-bottom:6px;">
        {t('converter.resultLabel', { currency: toCurrency })}
      </span>
      <div style="display:flex;border:1px solid var(--bg-rule);border-radius:var(--radius);overflow:hidden;background:var(--bg-subtle);">
        <div style="flex:1;padding:10px 12px;font-size:20px;font-weight:700;color:var(--pos);font-variant-numeric:tabular-nums;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          {#if isLoading}
            <div style="height:28px;width:140px;border-radius:2px;" class="animate-shimmer"></div>
          {:else if conversionResult}
            {#if toCurrency === 'IDR'}
              {formatRupiah(conversionResult.resultAmount)}
            {:else}
              {formatCurrency(conversionResult.resultAmount, toCurrency)}
            {/if}
          {:else}
            —
          {/if}
        </div>
        <div style="display:flex;align-items:center;gap:6px;padding:8px 10px;border-left:1px solid var(--bg-rule);background:var(--bg-raised);">
          <span style="font-size:16px;">{toInfo.flag}</span>
          <select aria-label={t('converter.resultLabel', { currency: toCurrency })} bind:value={toCurrency} onchange={performConversion}
            style="border:none;outline:none;background:transparent;font-size:13px;font-weight:700;color:var(--ink);cursor:pointer;">
            {#each SUPPORTED_CURRENCIES as curr}
              <option value={curr.code}>{curr.code}</option>
            {/each}
          </select>
        </div>
      </div>
      <p style="font-size:11px;color:var(--ink-4);margin-top:4px;">{getLocalizedCurrencyName(toInfo.code, toInfo.name)}</p>
    </div>
  </div>

  <!-- Quick presets -->
  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;border-top:1px solid var(--bg-rule);padding-top:12px;">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink-4);">{t('converter.quickNominal')}</span>
    {#if fromCurrency === 'IDR'}
      {#each [1000000, 5000000, 10000000, 50000000] as preset}
        <button type="button" class="btn btn-ghost btn-sm" onclick={() => setPresetAmount(preset)}>
          {formatRupiah(preset, { showFraction: false })}
        </button>
      {/each}
    {:else}
      {#each [100, 500, 1000, 5000] as preset}
        <button type="button" class="btn btn-ghost btn-sm" onclick={() => setPresetAmount(preset)}>
          {fromInfo.symbol}{preset.toLocaleString()}
        </button>
      {/each}
    {/if}
  </div>

  <!-- Multi-provider comparison table -->
  {#if conversionResult?.comparisons && conversionResult.comparisons.length > 0}
    <div style="border-top:2px solid var(--ink);padding-top:20px;">
      <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-4);margin:0;">
          {t('converter.comparisonTitle')}
        </p>
        <span style="font-size:11px;color:var(--ink-4);font-variant-numeric:tabular-nums;">
          {t('converter.referenceRate', { from: fromCurrency, to: toCurrency === 'IDR' ? formatRupiah(conversionResult.rateUsed) : formatCurrency(conversionResult.rateUsed, toCurrency) })}
        </span>
      </div>

      <div style="border:1px solid var(--bg-rule);border-radius:var(--radius);overflow:hidden;">
        {#each conversionResult.comparisons as comp, i}
          {@const isBest = i === 0}
          <div style="
            display:flex;align-items:center;justify-content:space-between;
            padding:12px 16px;
            border-bottom:1px solid var(--bg-rule);
            background:{isBest ? 'var(--pos-bg)' : 'var(--bg-raised)'};
          ">
            <div style="display:flex;align-items:center;gap:10px;">
              {#if isBest}
                <span style="font-size:10px;font-weight:700;color:var(--pos);text-transform:uppercase;letter-spacing:0.06em;padding:2px 6px;border:1px solid var(--pos-rule);border-radius:3px;">
                  {t('converter.best')}
                </span>
              {:else}
                <span style="font-size:10px;color:var(--ink-4);font-variant-numeric:tabular-nums;">#{i+1}</span>
              {/if}
              <span style="font-size:13px;font-weight:600;color:var(--ink);">{comp.providerName}</span>
            </div>
            <div style="text-align:right;">
              <div style="font-size:15px;font-weight:700;font-variant-numeric:tabular-nums;color:{isBest ? 'var(--pos)' : 'var(--ink)'};">
                {toCurrency === 'IDR' ? formatRupiah(comp.resultAmount, { showFraction: false }) : formatCurrency(comp.resultAmount, toCurrency)}
              </div>
              {#if !isBest && comp.diffWithBest}
                <div style="font-size:11px;color:var(--signal);font-variant-numeric:tabular-nums;">
                  {comp.diffWithBest > 0 ? '+' : ''}{formatRupiah(comp.diffWithBest, { showFraction: false })}
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
