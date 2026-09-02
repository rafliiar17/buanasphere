<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    Building2, 
    ArrowUpRight, 
    ArrowDownRight, 
    CheckCircle2, 
    Sparkles, 
    RefreshCw, 
    HelpCircle,
    Info
  } from 'lucide-svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import TableSkeleton from '$lib/components/skeletons/TableSkeleton.svelte';
  import { apiClient, SUPPORTED_CURRENCIES } from '$lib/api/client';
  import type { RateMatrixResponse, RateMatrixRow } from '$lib/api/types';
  import { formatRupiah, formatPercent, formatDateTimeIndo, formatTimeAgo } from '$lib/formatters/currency';

  // Svelte 5 State
  let selectedCurrency = $state('USD');
  let isLoading = $state(true);
  let matrixData = $state<RateMatrixResponse | null>(null);
  let filterType = $state<'ALL' | 'commercial_bank' | 'central_bank' | 'money_changer'>('ALL');

  const currencyList = SUPPORTED_CURRENCIES.filter(c => c.code !== 'IDR');
  const activeCurrencyInfo = $derived(
    SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency) || SUPPORTED_CURRENCIES[0]
  );

  async function loadMatrix(currency: string) {
    isLoading = true;
    try {
      matrixData = await apiClient.getRateMatrix(currency);
    } catch (e) {
      console.error('Error fetching rate matrix:', e);
    } finally {
      isLoading = false;
    }
  }

  function handleSelectCurrency(curr: string) {
    selectedCurrency = curr;
    loadMatrix(curr);
  }

  const filteredRows = $derived(
    matrixData?.rows.filter(row => {
      if (filterType === 'ALL') return true;
      return row.providerType === filterType;
    }) || []
  );

  onMount(() => {
    loadMatrix(selectedCurrency);
  });
</script>

<!-- Rate Matrix: data-journalism table layout -->
<div style="display:flex;flex-direction:column;gap:20px;">

  <!-- Header row -->
  <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;border-bottom:2px solid var(--ink);padding-bottom:14px;">
    <div>
      <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-4);margin-bottom:4px;">
        Perbandingan Kurs Side-by-Side
      </p>
      <h2 style="font-size:20px;font-weight:700;color:var(--ink);margin:0;">
        {activeCurrencyInfo.flag} {selectedCurrency}/IDR — Antar Bank & Money Changer
      </h2>
      <p style="font-size:12px;color:var(--ink-3);margin-top:4px;">
        Kurs beli, kurs jual, dan spread nyata tanpa markup tersembunyi
      </p>
    </div>
    <button
      class="btn btn-ghost btn-sm"
      disabled={isLoading}
      onclick={() => loadMatrix(selectedCurrency)}
      style="display:flex;align-items:center;gap:5px;flex-shrink:0;"
    >
      <RefreshCw style="width:12px;height:12px;{isLoading ? 'animation:spin 1s linear infinite;' : ''}" />
      Segarkan
    </button>
  </div>

  <!-- Currency selector row -->
  <div style="display:flex;align-items:center;gap:6px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;">
    {#each currencyList as curr}
      <button
        type="button"
        onclick={() => handleSelectCurrency(curr.code)}
        style="
          display:inline-flex;align-items:center;gap:5px;
          padding:5px 12px;
          border:1px solid {selectedCurrency === curr.code ? 'var(--ink)' : 'var(--bg-rule)'};
          background:{selectedCurrency === curr.code ? 'var(--ink)' : 'var(--bg-raised)'};
          color:{selectedCurrency === curr.code ? 'var(--accent-fg)' : 'var(--ink-3)'};
          border-radius:3px;
          font-size:12px;font-weight:600;
          cursor:pointer;
          white-space:nowrap;
          transition:all 120ms;
          flex-shrink:0;
        "
      >
        <span>{curr.flag}</span>
        <span>{curr.code}</span>
      </button>
    {/each}
  </div>

  <!-- Best-of summary strip (3 kpi cells, hairline ruled) -->
  {#if matrixData && !isLoading}
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));border:1px solid var(--bg-rule);border-radius:var(--radius);">
      <div style="padding:12px 16px;border-right:1px solid var(--bg-rule);">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--pos);margin-bottom:4px;">
          ↑ Beli Terbaik (Anda Jual)
        </p>
        <p style="font-size:14px;font-weight:700;color:var(--ink);margin:0;">{matrixData.bestBuyProvider}</p>
      </div>
      <div style="padding:12px 16px;border-right:1px solid var(--bg-rule);">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--accent);margin-bottom:4px;">
          ↓ Jual Terbaik (Anda Beli)
        </p>
        <p style="font-size:14px;font-weight:700;color:var(--ink);margin:0;">{matrixData.bestSellProvider}</p>
      </div>
      <div style="padding:12px 16px;">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink-4);margin-bottom:4px;">
          Spread Terendah
        </p>
        <p style="font-size:14px;font-weight:700;color:var(--ink);margin:0;">{matrixData.lowestSpreadProvider}</p>
      </div>
    </div>
  {/if}

  <!-- Table or skeleton -->
  {#if isLoading}
    <TableSkeleton rows={6} />
  {:else if matrixData}
    <div style="overflow-x:auto;border:1px solid var(--bg-rule);border-radius:var(--radius);">
      <table class="data-table">
        <thead>
          <tr>
            <th>Bank / Provider</th>
            <th>Tipe Rate</th>
            <th class="right" title="Harga bank membeli valas dari Anda (kurs beli bank = Anda jual)">Kurs Beli ⓘ</th>
            <th class="right" title="Harga bank menjual valas kepada Anda (kurs jual bank = Anda beli)">Kurs Jual ⓘ</th>
            <th class="right">Spread</th>
            <th class="right">%</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredRows as row}
            <tr>
              <td>
                <div style="font-weight:700;color:var(--ink);">{row.providerName}</div>
                <div style="font-size:10px;color:var(--ink-4);margin-top:2px;">
                  Update: {formatTimeAgo(row.updatedAt)}
                </div>
              </td>

              <td>
                <span style="font-size:10px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:var(--ink-4);padding:2px 6px;border:1px solid var(--bg-rule);border-radius:3px;">
                  {row.rateType}
                </span>
              </td>

              <!-- Buy rate: highlight best -->
              <td class="right">
                <span style="
                  font-weight:{row.isBestBuy ? '700' : '500'};
                  color:{row.isBestBuy ? 'var(--pos)' : 'var(--ink-2)'};
                  font-variant-numeric:tabular-nums;
                  font-size:{row.isBestBuy ? '14px' : '13px'};
                ">
                  {formatRupiah(row.buyRate)}
                </span>
                {#if row.isBestBuy}
                  <span class="pill-pos" style="margin-left:4px;font-size:9px;padding:0 5px;">TERBAIK</span>
                {/if}
              </td>

              <!-- Sell rate: highlight best -->
              <td class="right">
                <span style="
                  font-weight:{row.isBestSell ? '700' : '500'};
                  color:{row.isBestSell ? 'var(--accent)' : 'var(--ink-2)'};
                  font-variant-numeric:tabular-nums;
                  font-size:{row.isBestSell ? '14px' : '13px'};
                ">
                  {formatRupiah(row.sellRate)}
                </span>
                {#if row.isBestSell}
                  <span class="pill-neutral" style="margin-left:4px;font-size:9px;padding:0 5px;">TERMURAH</span>
                {/if}
              </td>

              <!-- Spread -->
              <td class="right" style="color:{row.isLowestSpread ? 'var(--pos)' : 'var(--ink-3)'};font-variant-numeric:tabular-nums;">
                {formatRupiah(row.spread)}
              </td>

              <!-- Spread % -->
              <td class="right" style="color:var(--ink-4);font-variant-numeric:tabular-nums;font-size:11px;">
                {formatPercent(row.spreadPercent)}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Glossary note -->
    <p style="font-size:11px;color:var(--ink-4);border-top:1px solid var(--bg-rule);padding-top:10px;line-height:1.6;">
      <strong style="color:var(--ink-3);">Petunjuk Baca:</strong>
      <em>Kurs Jual</em> berlaku saat Anda <em>membeli</em> valas dari bank.
      <em>Kurs Beli</em> berlaku saat Anda <em>menjual</em> valas ke bank.
      Kurs dapat berubah sewaktu-waktu sesuai kebijakan masing-masing provider.
    </p>
  {/if}
</div>

<style>
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
