<script lang="ts">
  import { ratesState } from '../state/ratesState.svelte';
  import { globeState } from '../state/globeState.svelte';
  import {
    EXTENDED_COUNTRIES_DATA,
    getCountryByCurrency,
  } from '../data/countrySpatialData';
  import {
    formatRupiah,
    formatPercent,
    formatDateTimeIndo,
  } from '../formatters/currency';
  import {
    Search,
    TrendingUp,
    TrendingDown,
    Globe,
    ArrowLeftRight,
    RefreshCw,
    SlidersHorizontal,
  } from 'lucide-svelte';

  // Local state
  let searchQuery = $state<string>('');
  let selectedContinent = $state<string>('all');
  let sortColumn = $state<'code' | 'country' | 'rate' | 'change' | 'spread'>('rate');
  let sortDirection = $state<'asc' | 'desc'>('desc');

  const continents = [
    { id: 'all', label: 'Semua Benua' },
    { id: 'Asia', label: 'Asia' },
    { id: 'Europe', label: 'Eropa' },
    { id: 'Americas', label: 'Amerika' },
    { id: 'Africa', label: 'Afrika' },
    { id: 'Oceania', label: 'Oseania' },
  ];

  // Combined country + rate list
  const matrixData = $derived.by(() => {
    return EXTENDED_COUNTRIES_DATA.map((c) => {
      const live = ratesState.getRate(c.currencyCode);
      const middleRate = live?.middleRate ?? c.defaultRate;
      const buyRate = live?.buyRate ?? c.defaultBuyRate;
      const sellRate = live?.sellRate ?? c.defaultSellRate;
      const spread = live?.spread ?? (sellRate - buyRate);
      const spreadPercent = live?.spreadPercent ?? (middleRate > 0 ? (spread / middleRate) * 100 : 0);
      const change24h = live?.change24h ?? c.defaultChange24h;

      return {
        iso3: c.iso3,
        countryName: c.countryName,
        currencyCode: c.currencyCode.toUpperCase(),
        currencyName: c.currencyName,
        flagEmoji: c.flagEmoji,
        continent: c.continent || c.region,
        buyRate,
        sellRate,
        middleRate,
        spread,
        spreadPercent,
        change24h,
      };
    });
  });

  // Filtered and sorted data
  const filteredData = $derived.by(() => {
    let result = matrixData;

    // Filter continent
    if (selectedContinent !== 'all') {
      result = result.filter(
        (item) => item.continent.toLowerCase() === selectedContinent.toLowerCase()
      );
    }

    // Filter search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.currencyCode.toLowerCase().includes(q) ||
          item.currencyName.toLowerCase().includes(q) ||
          item.countryName.toLowerCase().includes(q) ||
          item.iso3.toLowerCase().includes(q)
      );
    }

    // Sort
    return [...result].sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortColumn) {
        case 'code':
          valA = a.currencyCode;
          valB = b.currencyCode;
          break;
        case 'country':
          valA = a.countryName;
          valB = b.countryName;
          break;
        case 'rate':
          valA = a.middleRate;
          valB = b.middleRate;
          break;
        case 'change':
          valA = a.change24h;
          valB = b.change24h;
          break;
        case 'spread':
          valA = a.spreadPercent;
          valB = b.spreadPercent;
          break;
        default:
          valA = a.middleRate;
          valB = b.middleRate;
      }

      if (typeof valA === 'string') {
        return sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
  });

  function handleSort(col: 'code' | 'country' | 'rate' | 'change' | 'spread') {
    if (sortColumn === col) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = col;
      sortDirection = 'desc';
    }
  }

  function handleSelectCountry(iso3: string) {
    globeState.selectCountry(iso3);
    globeState.setViewMode('globe');
  }

  function handleConvert(currencyCode: string) {
    globeState.setViewMode('converter');
  }
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
  <!-- Section Title & Info -->
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
    <div>
      <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">
        Tabel Matriks Kurs Dunia
      </h1>
      <p class="text-sm text-slate-400 mt-1">
        Perbandingan nilai tukar side-by-side 195+ mata uang dunia terhadap Rupiah (IDR).
      </p>
    </div>

    <div class="flex items-center gap-2">
      <button
        onclick={() => ratesState.fetchRates()}
        class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-all cursor-pointer disabled:opacity-50"
        disabled={ratesState.isLoading}
      >
        <RefreshCw class="w-3.5 h-3.5 {ratesState.isLoading ? 'animate-spin text-indigo-400' : ''}" />
        <span>Muat Ulang</span>
      </button>
    </div>
  </div>

  <!-- Filter & Search Bar -->
  <div class="flex flex-col sm:flex-row items-center gap-3 mb-6">
    <!-- Search Input -->
    <div class="relative w-full sm:max-w-md">
      <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
      <input
        type="text"
        placeholder="Cari mata uang, negara, atau kode (USD, JPY, EUR)..."
        bind:value={searchQuery}
        class="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
      />
      {#if searchQuery}
        <button
          onclick={() => (searchQuery = '')}
          class="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-300"
        >
          Bersihkan
        </button>
      {/if}
    </div>

    <!-- Continent Tabs -->
    <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full py-1">
      {#each continents as c}
        <button
          onclick={() => (selectedContinent = c.id)}
          class="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer {selectedContinent === c.id
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'}"
        >
          {c.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Table Card -->
  <div class="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
    {#if ratesState.isLoading}
      <!-- Shimmer Skeleton Loading State -->
      <div class="p-6 space-y-4">
        {#each Array(8) as _}
          <div class="h-12 w-full rounded-xl bg-slate-800/40 animate-shimmer"></div>
        {/each}
      </div>
    {:else}
      <div class="overflow-x-auto no-scrollbar">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th
                onclick={() => handleSort('code')}
                class="p-4 cursor-pointer hover:text-white transition-colors"
              >
                Mata Uang {sortColumn === 'code' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th
                onclick={() => handleSort('country')}
                class="p-4 cursor-pointer hover:text-white transition-colors"
              >
                Negara {sortColumn === 'country' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th class="p-4 text-right">Kurs Beli</th>
              <th class="p-4 text-right">Kurs Jual</th>
              <th
                onclick={() => handleSort('rate')}
                class="p-4 text-right cursor-pointer hover:text-white transition-colors text-indigo-300"
              >
                Kurs Tengah (IDR) {sortColumn === 'rate' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th
                onclick={() => handleSort('spread')}
                class="p-4 text-right cursor-pointer hover:text-white transition-colors"
              >
                Spread {sortColumn === 'spread' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th
                onclick={() => handleSort('change')}
                class="p-4 text-center cursor-pointer hover:text-white transition-colors"
              >
                24h Trend {sortColumn === 'change' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th class="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-medium">
            {#if filteredData.length === 0}
              <tr>
                <td colspan="8" class="p-12 text-center text-slate-500">
                  Tidak ada mata uang yang cocok dengan pencarian "{searchQuery}"
                </td>
              </tr>
            {:else}
              {#each filteredData as row (row.iso3 + row.currencyCode)}
                <tr class="hover:bg-slate-800/40 transition-colors group">
                  <!-- Currency Code & Name -->
                  <td class="p-4">
                    <div class="flex items-center gap-2.5">
                      <span class="text-2xl">{row.flagEmoji}</span>
                      <div>
                        <span class="font-bold text-white tracking-wide">{row.currencyCode}</span>
                        <span class="text-xs text-slate-400 block truncate max-w-[150px]">
                          {row.currencyName}
                        </span>
                      </div>
                    </div>
                  </td>

                  <!-- Country Name & Continent -->
                  <td class="p-4 text-slate-300">
                    <div>
                      <span>{row.countryName}</span>
                      <span class="text-[10px] text-slate-500 block uppercase font-mono">
                        {row.continent} • {row.iso3}
                      </span>
                    </div>
                  </td>

                  <!-- Buy Rate -->
                  <td class="p-4 text-right font-mono text-slate-300">
                    {formatRupiah(row.buyRate, { showFraction: row.buyRate < 100 })}
                  </td>

                  <!-- Sell Rate -->
                  <td class="p-4 text-right font-mono text-slate-300">
                    {formatRupiah(row.sellRate, { showFraction: row.sellRate < 100 })}
                  </td>

                  <!-- Middle Rate (Highlighted) -->
                  <td class="p-4 text-right font-mono font-bold text-white text-base">
                    {formatRupiah(row.middleRate, { showFraction: row.middleRate < 100 })}
                  </td>

                  <!-- Spread -->
                  <td class="p-4 text-right font-mono text-xs text-slate-400">
                    <span>{formatRupiah(row.spread, { showFraction: true })}</span>
                    <span class="text-[10px] text-slate-500 block">({row.spreadPercent.toFixed(2)}%)</span>
                  </td>

                  <!-- 24h Trend Badge -->
                  <td class="p-4 text-center">
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold {row.change24h >= 0
                        ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                        : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'}"
                    >
                      {#if row.change24h >= 0}
                        <TrendingUp class="w-3 h-3" />
                      {:else}
                        <TrendingDown class="w-3 h-3" />
                      {/if}
                      {formatPercent(row.change24h)}
                    </span>
                  </td>

                  <!-- Actions -->
                  <td class="p-4 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                      <button
                        onclick={() => handleSelectCountry(row.iso3)}
                        class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all cursor-pointer"
                        title="Lihat di 3D Globe"
                      >
                        <Globe class="w-3.5 h-3.5" />
                      </button>

                      <button
                        onclick={() => handleConvert(row.currencyCode)}
                        class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all cursor-pointer"
                        title="Buka Konverter"
                      >
                        <ArrowLeftRight class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
