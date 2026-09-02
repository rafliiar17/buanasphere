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

<!-- Trend Chart: editorial time-series panel -->
<div style="display:flex;flex-direction:column;gap:20px;">

  <!-- Section header -->
  <div style="border-bottom:2px solid var(--ink);padding-bottom:14px;display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;">
    <div>
      <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-4);margin-bottom:4px;">
        Histori Nilai Tukar Tengah (Middle Rate)
      </p>
      <h2 style="font-size:20px;font-weight:700;color:var(--ink);margin:0;">
        Tren Pergerakan Kurs — {selectedCurrency}/IDR
      </h2>
    </div>

    <!-- Controls: currency + range -->
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <select
        bind:value={selectedCurrency}
        onchange={() => handleCurrencyChange(selectedCurrency)}
        class="field"
        style="width:auto;padding:5px 10px;font-size:12px;"
      >
        {#each SUPPORTED_CURRENCIES.filter(c => c.code !== 'IDR') as curr}
          <option value={curr.code}>{curr.flag} {curr.code}</option>
        {/each}
      </select>

      <!-- Range underline tabs -->
      <div style="display:flex;gap:0;border-bottom:1px solid var(--bg-rule);">
        {#each ranges as r}
          <button
            type="button"
            onclick={() => handleRangeChange(r.id)}
            style="
              position:relative;padding:6px 12px;
              font-size:12px;font-weight:{selectedRange === r.id ? '700' : '500'};
              color:{selectedRange === r.id ? 'var(--ink)' : 'var(--ink-3)'};
              background:none;border:none;cursor:pointer;
              transition:color 120ms;
            "
          >
            {r.label}
            {#if selectedRange === r.id}
              <span style="position:absolute;bottom:-1px;left:0;right:0;height:2px;background:var(--accent);"></span>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  </div>

  {#if isLoading}
    <!-- Chart skeleton -->
    <div style="border:1px solid var(--bg-rule);border-radius:var(--radius);padding:16px;">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
        {#each [1,2,3,4] as _}
          <div style="padding:12px;border:1px solid var(--bg-rule);border-radius:var(--radius-sm);">
            <div style="height:9px;width:70px;border-radius:2px;margin-bottom:8px;" class="animate-shimmer"></div>
            <div style="height:16px;width:100px;border-radius:2px;" class="animate-shimmer"></div>
          </div>
        {/each}
      </div>
      <div style="height:200px;border-radius:2px;" class="animate-shimmer"></div>
    </div>
  {:else if trendData}

    <!-- KPI strip: 4 cells, hairline ruled -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));border:1px solid var(--bg-rule);border-radius:var(--radius);">
      <div style="padding:12px 16px;border-right:1px solid var(--bg-rule);">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink-4);margin-bottom:4px;">Kurs Terkini</p>
        <p style="font-size:15px;font-weight:700;color:var(--ink);margin:0;font-variant-numeric:tabular-nums;">{formatRupiah(trendData.summary.current)}</p>
      </div>
      <div style="padding:12px 16px;border-right:1px solid var(--bg-rule);">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink-4);margin-bottom:4px;">Perubahan {selectedRange}</p>
        <p style="font-size:15px;font-weight:700;margin:0;font-variant-numeric:tabular-nums;color:{isPositiveChange ? 'var(--signal)' : 'var(--pos)'};">
          {isPositiveChange ? '↑' : '↓'} {formatPercent(trendData.summary.changePeriodPercent)}
        </p>
      </div>
      <div style="padding:12px 16px;border-right:1px solid var(--bg-rule);">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink-4);margin-bottom:4px;">Tertinggi</p>
        <p style="font-size:15px;font-weight:700;color:var(--ink);margin:0;font-variant-numeric:tabular-nums;">{formatRupiah(trendData.summary.max)}</p>
      </div>
      <div style="padding:12px 16px;">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink-4);margin-bottom:4px;">Terendah</p>
        <p style="font-size:15px;font-weight:700;color:var(--ink);margin:0;font-variant-numeric:tabular-nums;">{formatRupiah(trendData.summary.min)}</p>
      </div>
    </div>

    <!-- SVG chart on warm paper -->
    <div style="position:relative;width:100%;border:1px solid var(--bg-rule);border-radius:var(--radius);overflow:hidden;background:var(--bg-raised);padding:8px 4px;">
      <!-- Tooltip -->
      {#if hoveredPoint && hoveredPos}
        <div
          style="
            position:absolute;z-index:10;pointer-events:none;
            left:{hoveredPos.x}px;top:{hoveredPos.y}px;
            transform:translateX(-50%) translateY(calc(-100% - 8px));
            background:var(--ink);color:var(--accent-fg);
            border-radius:var(--radius-sm);padding:8px 12px;
            font-size:11px;white-space:nowrap;
            box-shadow:0 4px 16px rgba(26,18,9,0.2);
          "
        >
          <div style="color:rgba(255,255,255,0.6);margin-bottom:2px;">{hoveredPoint.date}</div>
          <div style="font-size:13px;font-weight:700;font-variant-numeric:tabular-nums;">{formatRupiah(hoveredPoint.middleRate)}</div>
          <div style="color:rgba(255,255,255,0.5);margin-top:2px;display:flex;gap:10px;">
            <span>Beli: {formatRupiah(hoveredPoint.buyRate, { showFraction: false })}</span>
            <span>Jual: {formatRupiah(hoveredPoint.sellRate, { showFraction: false })}</span>
          </div>
        </div>
      {/if}

      <svg viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`} style="width:100%;height:224px;overflow:visible;">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color={isPositiveChange ? '#C41E3A' : '#1B5E20'} stop-opacity="0.15" />
            <stop offset="100%" stop-color={isPositiveChange ? '#C41E3A' : '#1B5E20'} stop-opacity="0.0" />
          </linearGradient>
        </defs>

        <!-- Grid lines -->
        {#each [0.2, 0.4, 0.6, 0.8] as ratio}
          {@const yVal = svgDimensions.padding + ratio * (svgDimensions.height - svgDimensions.padding * 2)}
          <line
            x1={svgDimensions.padding}
            y1={yVal}
            x2={svgDimensions.width - svgDimensions.padding}
            y2={yVal}
            stroke="var(--bg-rule)"
            stroke-dasharray="4 4"
            stroke-width="1"
          />
        {/each}

        <!-- Area fill -->
        {#if areaD}
          <path d={areaD} fill="url(#chartGradient)" />
        {/if}

        <!-- Trend line -->
        {#if pathD}
          <path
            d={pathD}
            fill="none"
            stroke={isPositiveChange ? 'var(--signal)' : 'var(--pos)'}
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        {/if}

        <!-- Interactive points -->
        {#each chartPoints as cp}
          <circle
            cx={cp.x}
            cy={cp.y}
            r="3"
            role="graphics-symbol"
            aria-label="{cp.point.date}: {cp.point.middleRate}"
            style="fill:{isPositiveChange ? 'var(--signal)' : 'var(--pos)'};stroke:var(--bg-raised);stroke-width:2;cursor:pointer;"
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
</div>
