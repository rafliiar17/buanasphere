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

    <div>
      <div class="flex items-center gap-2">
        <h2 class="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Building2 class="w-5 h-5 text-indigo-400" />
          Komparasi Kurs Antar Bank & Money Changer
        </h2>
        <span class="text-xs text-slate-400 font-medium">({activeCurrencyInfo.flag} {selectedCurrency}/IDR)</span>
      </div>
      <p class="text-xs text-slate-400 mt-0.5">
        Bandingkan harga beli, harga jual, dan spread secara transparan tanpa markup tersembunyi
      </p>
    </div>

    <!-- Refresh button -->
    <div class="flex items-center gap-2 shrink-0">
      <Button
        variant="outline"
        size="sm"
        disabled={isLoading}
        onclick={() => loadMatrix(selectedCurrency)}
      >
        <RefreshCw class={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        <span>Segarkan Data</span>
      </Button>
    </div>
  </div>

  <!-- Currency Pills Slider -->
  <div class="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
    {#each currencyList as curr}
      {@const isSelected = selectedCurrency === curr.code}
      <button
        type="button"
        class={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
          isSelected
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/60 ring-2 ring-indigo-500/50'
            : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
        }`}
        onclick={() => handleSelectCurrency(curr.code)}
      >
        <span class="text-sm">{curr.flag}</span>
        <span>{curr.code}</span>
      </button>
    {/each}
  </div>

  <!-- Highlights Bar -->
  {#if matrixData && !isLoading}
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <!-- Best Buy (Jual ke Bank) -->
      <div class="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
        <div class="space-y-0.5">
          <span class="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 class="w-3.5 h-3.5" />
            Kurs Beli Terbaik (Anda Jual)
          </span>
          <div class="text-sm font-bold text-slate-100">{matrixData.bestBuyProvider}</div>
        </div>
        <Badge variant="success" size="sm">Tertinggi</Badge>
      </div>

      <!-- Best Sell (Beli dari Bank) -->
      <div class="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-between">
        <div class="space-y-0.5">
          <span class="text-[11px] font-semibold text-indigo-400 flex items-center gap-1">
            <Sparkles class="w-3.5 h-3.5" />
            Kurs Jual Terbaik (Anda Beli)
          </span>
          <div class="text-sm font-bold text-slate-100">{matrixData.bestSellProvider}</div>
        </div>
        <Badge variant="default" size="sm">Termurah</Badge>
      </div>

      <!-- Lowest Spread -->
      <div class="p-3.5 rounded-2xl bg-sky-950/20 border border-sky-500/30 flex items-center justify-between">
        <div class="space-y-0.5">
          <span class="text-[11px] font-semibold text-sky-400 flex items-center gap-1">
            <Info class="w-3.5 h-3.5" />
            Spread Terendah
          </span>
          <div class="text-sm font-bold text-slate-100">{matrixData.lowestSpreadProvider}</div>
        </div>
        <Badge variant="info" size="sm">Paling Hemat</Badge>
      </div>
    </div>
  {/if}

  <!-- Main Table or Shimmer Skeleton -->
  {#if isLoading}
    <TableSkeleton rows={6} />
  {:else if matrixData}
    <div class="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-xl shadow-black/20">
      <table class="w-full text-left text-sm text-slate-300">
        <thead class="border-b border-slate-800 bg-slate-950/70 text-xs font-bold uppercase tracking-wider text-slate-400">
          <tr>
            <th class="px-5 py-4">Bank / Provider</th>
            <th class="px-5 py-4">Tipe Rate</th>
            <th class="px-5 py-4 text-right">
              <span class="inline-flex items-center gap-1">
                Beli (Bank Beli)
                <span title="Harga yang dibayarkan bank jika Anda menukarkan valas ke Rupiah" class="cursor-help text-slate-500">ⓘ</span>
              </span>
            </th>
            <th class="px-5 py-4 text-right">
              <span class="inline-flex items-center gap-1">
                Jual (Bank Jual)
                <span title="Harga yang harus Anda bayar ke bank jika Anda membeli valas dengan Rupiah" class="cursor-help text-slate-500">ⓘ</span>
              </span>
            </th>
            <th class="px-5 py-4 text-right">Spread</th>
            <th class="px-5 py-4 text-center">Status / Highlight</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60 font-medium">
          {#each filteredRows as row}
            <tr class="hover:bg-slate-800/40 transition-colors">
              <!-- Provider Name -->
              <td class="px-5 py-4">
                <div class="font-bold text-slate-100 flex items-center gap-2">
                  <span>{row.providerName}</span>
                </div>
                <div class="text-[11px] text-slate-500 mt-0.5">
                  Update: {formatTimeAgo(row.updatedAt)}
                </div>
              </td>

              <!-- Rate Type -->
              <td class="px-5 py-4 text-xs text-slate-400">
                <span class="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-mono text-[11px]">
                  {row.rateType}
                </span>
              </td>

              <!-- Buy Rate -->
              <td class="px-5 py-4 text-right font-semibold">
                <span class={row.isBestBuy ? 'text-emerald-400 font-extrabold text-base' : 'text-slate-200'}>
                  {formatRupiah(row.buyRate)}
                </span>
              </td>

              <!-- Sell Rate -->
              <td class="px-5 py-4 text-right font-semibold">
                <span class={row.isBestSell ? 'text-indigo-400 font-extrabold text-base' : 'text-slate-200'}>
                  {formatRupiah(row.sellRate)}
                </span>
              </td>

              <!-- Spread -->
              <td class="px-5 py-4 text-right font-mono text-xs">
                <div class={row.isLowestSpread ? 'text-sky-400 font-bold' : 'text-slate-400'}>
                  {formatRupiah(row.spread)}
                </div>
                <div class="text-[10px] text-slate-500">
                  {formatPercent(row.spreadPercent)}
                </div>
              </td>

              <!-- Badges -->
              <td class="px-5 py-4 text-center">
                <div class="flex items-center justify-center gap-1.5 flex-wrap">
                  {#if row.isBestBuy}
                    <Badge variant="success" size="sm">Beli Terbaik</Badge>
                  {/if}
                  {#if row.isBestSell}
                    <Badge variant="default" size="sm">Jual Terbaik</Badge>
                  {/if}
                  {#if row.isLowestSpread}
                    <Badge variant="info" size="sm">Spread Rendah</Badge>
                  {/if}
                  {#if !row.isBestBuy && !row.isBestSell && !row.isLowestSpread}
                    <span class="text-xs text-slate-600">—</span>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <!-- Disclaimer Footer Note -->
  <div class="flex items-start gap-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
    <HelpCircle class="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
    <span>
      <strong>Petunjuk:</strong> Kurs Jual (Sell) berlaku saat Anda <em>membeli</em> valas dari bank. Kurs Beli (Buy) berlaku saat Anda <em>menjual</em> valas ke bank. Kurs dapat berubah sewaktu-waktu sesuai kebijakan masing-masing provider tanpa pemberitahuan sebelumnya.
    </span>
  </div>
</div>
