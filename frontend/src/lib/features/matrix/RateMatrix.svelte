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

<div class="space-y-4">
  <!-- Header & Filter Bar -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
