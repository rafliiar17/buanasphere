<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    LineChart as ChartIcon, 
    TrendingUp, 
    TrendingDown, 
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Minus
  } from 'lucide-svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import CardSkeleton from '$lib/components/skeletons/CardSkeleton.svelte';
  import { apiClient, SUPPORTED_CURRENCIES } from '$lib/api/client';
  import type { HistoricalTrendResponse, HistoricalPoint } from '$lib/api/types';
  import { formatRupiah, formatPercent } from '$lib/formatters/currency';

  // Svelte 5 Runes
  let selectedCurrency = $state('USD');
  let selectedRange = $state<'7d' | '30d' | '90d' | '365d'>('30d');
  let isLoading = $state(true);
  let trendData = $state<HistoricalTrendResponse | null>(null);
  let hoveredPoint = $state<HistoricalPoint | null>(null);
  let hoveredPos = $state<{ x: number; y: number } | null>(null);

  const ranges: Array<{ id: '7d' | '30d' | '90d' | '365d'; label: string }> = [
    { id: '7d', label: '7 Hari' },
    { id: '30d', label: '30 Hari' },
    { id: '90d', label: '3 Bulan' },
    { id: '365d', label: '1 Tahun' },
  ];

  async function loadHistory(curr: string, range: '7d' | '30d' | '90d' | '365d') {
    isLoading = true;
    try {
      trendData = await apiClient.getHistoricalRates(curr, range);
    } catch (e) {
      console.error('Error fetching historical trends:', e);
    } finally {
      isLoading = false;
    }
  }

  function handleCurrencyChange(curr: string) {
    selectedCurrency = curr;
    loadHistory(curr, selectedRange);
  }

  function handleRangeChange(rng: '7d' | '30d' | '90d' | '365d') {
    selectedRange = rng;
    loadHistory(selectedCurrency, rng);
  }

  // Derived calculations for SVG graph path
  const svgDimensions = { width: 800, height: 260, padding: 40 };

  const chartPoints = $derived.by(() => {
    if (!trendData || trendData.points.length === 0) return [];
    const points = trendData.points;
    const rates = points.map(p => p.middleRate);
    const minVal = Math.min(...rates);
    const maxVal = Math.max(...rates);
    const rangeVal = maxVal - minVal || 1;

    const plotW = svgDimensions.width - svgDimensions.padding * 2;
    const plotH = svgDimensions.height - svgDimensions.padding * 2;

    return points.map((p, idx) => {
      const x = svgDimensions.padding + (idx / (points.length - 1)) * plotW;
      const y = svgDimensions.height - svgDimensions.padding - ((p.middleRate - minVal) / rangeVal) * plotH;
      return { x, y, point: p };
    });
  });

  const pathD = $derived.by(() => {
    if (chartPoints.length === 0) return '';
    return chartPoints.reduce((acc, curr, i) => {
      return i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, '');
  });

  const areaD = $derived.by(() => {
    if (chartPoints.length === 0) return '';
    const first = chartPoints[0];
    const last = chartPoints[chartPoints.length - 1];
    const bottomY = svgDimensions.height - svgDimensions.padding;
    return `${pathD} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  });

  const isPositiveChange = $derived((trendData?.summary.changePeriodPercent ?? 0) >= 0);

  onMount(() => {
    loadHistory(selectedCurrency, selectedRange);
  });
</script>

<Card class="space-y-5">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
    <div>
      <div class="flex items-center gap-2">
        <h3 class="text-lg font-bold text-slate-100 flex items-center gap-2">
          <ChartIcon class="w-5 h-5 text-indigo-400" />
          Grafik Tren Pergerakan Kurs
        </h3>
        <Badge variant={isPositiveChange ? 'destructive' : 'success'} size="sm">
          {selectedCurrency}/IDR
        </Badge>
      </div>
      <p class="text-xs text-slate-400 mt-0.5">
        Histori nilai tukar tengah (Middle Rate) berdasarkan data Bank Sentral
      </p>
    </div>

    <!-- Range & Currency Selectors -->
    <div class="flex flex-wrap items-center gap-2">
      <!-- Currency select -->
      <select
        bind:value={selectedCurrency}
        onchange={() => handleCurrencyChange(selectedCurrency)}
        class="bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 rounded-xl px-3 py-1.5 focus:border-indigo-500 outline-none cursor-pointer"
      >
        {#each SUPPORTED_CURRENCIES.filter(c => c.code !== 'IDR') as curr}
          <option value={curr.code}>{curr.flag} {curr.code}</option>
        {/each}
      </select>

      <!-- Timeframe range pills -->
      <div class="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
        {#each ranges as r}
          {@const isActive = selectedRange === r.id}
          <button
            type="button"
            class={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
            onclick={() => handleRangeChange(r.id)}
          >
            {r.label}
          </button>
        {/each}
      </div>
    </div>
  </div>

  {#if isLoading}
    <CardSkeleton type="chart" />
  {:else if trendData}
    <!-- Summary Metrics -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <span class="text-[11px] text-slate-400 font-medium">Kurs Terkini</span>
        <div class="text-base font-bold text-slate-100 mt-0.5">
          {formatRupiah(trendData.summary.current)}
        </div>
      </div>
      <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <span class="text-[11px] text-slate-400 font-medium">Perubahan ({selectedRange})</span>
        <div class={`text-base font-bold mt-0.5 flex items-center gap-1 ${isPositiveChange ? 'text-rose-400' : 'text-emerald-400'}`}>
          {#if isPositiveChange}
            <ArrowUpRight class="w-4 h-4" />
          {:else}
            <ArrowDownRight class="w-4 h-4" />
          {/if}
          <span>{formatPercent(trendData.summary.changePeriodPercent)}</span>
        </div>
      </div>
      <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <span class="text-[11px] text-slate-400 font-medium">Tertinggi Periode</span>
        <div class="text-base font-bold text-slate-200 mt-0.5">
          {formatRupiah(trendData.summary.max)}
        </div>
      </div>
      <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <span class="text-[11px] text-slate-400 font-medium">Terendah Periode</span>
        <div class="text-base font-bold text-slate-200 mt-0.5">
          {formatRupiah(trendData.summary.min)}
        </div>
      </div>
    </div>

    <!-- SVG Area Chart -->
    <div class="relative w-full overflow-hidden rounded-xl bg-slate-950/80 border border-slate-800 p-2">
      <!-- Tooltip -->
      {#if hoveredPoint && hoveredPos}
        <div 
          class="absolute z-10 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-slate-900/95 border border-indigo-500/40 backdrop-blur-md rounded-xl p-2.5 shadow-xl text-xs"
          style={`left: ${hoveredPos.x}px; top: ${hoveredPos.y}px;`}
        >
          <div class="text-slate-400 font-medium">{hoveredPoint.date}</div>
          <div class="text-sm font-bold text-emerald-400 mt-0.5">
            {formatRupiah(hoveredPoint.middleRate)}
          </div>
          <div class="text-[10px] text-slate-500 mt-0.5 flex gap-2">
            <span>Beli: {formatRupiah(hoveredPoint.buyRate, { showFraction: false })}</span>
            <span>Jual: {formatRupiah(hoveredPoint.sellRate, { showFraction: false })}</span>
          </div>
        </div>
      {/if}

      <svg
        viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
        class="w-full h-56 sm:h-64 overflow-visible"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#6366f1" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#6366f1" stop-opacity="0.0" />
          </linearGradient>
        </defs>

        <!-- Horizontal Grid Lines -->
        {#each [0.2, 0.4, 0.6, 0.8] as ratio}
          {@const yVal = svgDimensions.padding + ratio * (svgDimensions.height - svgDimensions.padding * 2)}
          <line
            x1={svgDimensions.padding}
            y1={yVal}
            x2={svgDimensions.width - svgDimensions.padding}
            y2={yVal}
            stroke="#334155"
            stroke-dasharray="4 4"
            stroke-width="1"
            opacity="0.4"
          />
        {/each}

        <!-- Gradient Area Fill -->
        {#if areaD}
          <path d={areaD} fill="url(#chartGradient)" />
        {/if}

        <!-- Trend Line -->
        {#if pathD}
          <path
            d={pathD}
            fill="none"
            stroke="#818cf8"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        {/if}

        <!-- Interactive Points -->
        {#each chartPoints as cp}
          <circle
            cx={cp.x}
            cy={cp.y}
            r="4"
            role="graphics-symbol"
            aria-label="{cp.point.date}: {cp.point.middleRate}"
            class="fill-indigo-500 stroke-slate-900 stroke-2 hover:r-6 hover:fill-white transition-all cursor-pointer"
            onmouseenter={(e) => {
              const rect = (e.currentTarget as SVGCircleElement).getBoundingClientRect();
              const parentRect = (e.currentTarget as SVGCircleElement).closest('svg')?.parentElement?.getBoundingClientRect();
              if (parentRect) {
                hoveredPos = {
                  x: rect.left - parentRect.left + rect.width / 2,
                  y: rect.top - parentRect.top,
                };
              }
              hoveredPoint = cp.point;
            }}
            onmouseleave={() => {
              hoveredPoint = null;
              hoveredPos = null;
            }}
          />
        {/each}
      </svg>
    </div>
  {/if}
</Card>
