<script lang="ts">
  import { geoStore } from '../geoStore.svelte';
  import { X, Globe2, Compass, TrendingUp, TrendingDown } from 'lucide-svelte';
  import { apiClient } from '$lib/api/client';
  import type { HistoricalTrendResponse } from '$lib/api/types';
  import { formatRupiah, formatPercent } from '$lib/formatters/currency';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();

  const country = $derived(geoStore.selectedCountry);
  const activeApp = $derived(geoStore.activeApp);
  const appData = $derived(geoStore.currentAppData[country.iso3]);

  const widget = $derived(
    activeApp?.renderInspector
      ? activeApp.renderInspector(country as any, appData, geoStore.currentAppData)
      : null
  );

  // Mini Trend Chart State & Derivations
  let trendRange = $state<'7d' | '30d'>('7d');
  let isTrendLoading = $state(false);
  let trendData = $state<HistoricalTrendResponse | null>(null);
  let hoveredPoint = $state<{ date: string; rate: number; x: number; y: number; point: any } | null>(null);

  const hasCurrencyTrend = $derived(
    Boolean(country?.currencyCode && (geoStore.activeAppId === 'fx-rates' || country.currencyCode !== 'IDR'))
  );

  $effect(() => {
    const code = country?.currencyCode;
    const range = trendRange;
    const eligible = hasCurrencyTrend;

    if (eligible && code) {
      isTrendLoading = true;
      apiClient.getHistoricalRates(code, range)
        .then((data) => {
          trendData = data;
        })
        .catch((err) => {
          console.error('Failed to load inspector trend:', err);
          trendData = null;
        })
        .finally(() => {
          isTrendLoading = false;
        });
    } else {
      trendData = null;
      isTrendLoading = false;
    }
  });

  const svgWidth = 320;
  const svgHeight = 70;
  const padX = 8;
  const padY = 8;

  const chartPoints = $derived.by(() => {
    if (!trendData || !trendData.points || trendData.points.length === 0) return [];
    const pts = trendData.points;
    const rates = pts.map((p) => p.middleRate);
    const minVal = Math.min(...rates);
    const maxVal = Math.max(...rates);
    const rangeVal = maxVal - minVal || 1;

    const plotW = svgWidth - padX * 2;
    const plotH = svgHeight - padY * 2;

    return pts.map((p, idx) => {
      const x = padX + (idx / (pts.length - 1)) * plotW;
      const y = svgHeight - padY - ((p.middleRate - minVal) / rangeVal) * plotH;
      return { x, y, point: p };
    });
  });

  const pathD = $derived.by(() => {
    if (chartPoints.length === 0) return '';
    return chartPoints.reduce((acc, curr, i) => {
      return i === 0 ? `M ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}` : `${acc} L ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
    }, '');
  });

  const areaD = $derived.by(() => {
    if (chartPoints.length === 0) return '';
    const first = chartPoints[0];
    const last = chartPoints[chartPoints.length - 1];
    const bottomY = svgHeight - padY;
    return `${pathD} L ${last.x.toFixed(1)} ${bottomY} L ${first.x.toFixed(1)} ${bottomY} Z`;
  });

  const isPositiveChange = $derived((trendData?.summary.changePeriodPercent ?? 0) >= 0);
  const minRate = $derived.by(() => {
    if (!trendData || !trendData.points.length) return 0;
    return Math.min(...trendData.points.map((p) => p.middleRate));
  });
  const maxRate = $derived.by(() => {
    if (!trendData || !trendData.points.length) return 0;
    return Math.max(...trendData.points.map((p) => p.middleRate));
  });

  function handleClose() {
    if (onClose) {
      onClose();
    } else {
      geoStore.isInspectorOpen = false;
    }
  }
</script>

{#if geoStore.isInspectorOpen && country}
  <!-- Slide-Over Docked Panel (Right Side on Desktop / Bottom Sheet on Mobile) -->
  <aside
    class="absolute right-0 top-0 bottom-0 z-30 w-full sm:w-96 md:w-[420px] bg-slate-900/95 border-l border-slate-700/80 backdrop-blur-xl shadow-2xl flex flex-col justify-between transition-all duration-300 animate-in slide-in-from-right"
    aria-label="Panel Inspeksi Negara"
  >
    <!-- Header -->
    <div class="p-6 border-b border-slate-800/80">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <span class="text-4xl shadow-sm">{country.flagEmoji}</span>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-bold text-white tracking-tight">
                {country.countryName}
              </h2>
              <span class="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-300 border border-slate-700">
                {country.iso3}
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              {country.capital} • {country.region}
            </p>
          </div>
        </div>

        <button
          type="button"
          class="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          onclick={handleClose}
          aria-label="Tutup Panel"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Active App Tagline Badge -->
      <div class="mt-4 flex items-center justify-between rounded-xl bg-slate-950/60 px-3 py-2 border border-slate-800/60 text-xs">
        <span class="font-medium text-emerald-400 flex items-center gap-1.5">
          <Globe2 class="h-3.5 w-3.5" /> {activeApp.name}
        </span>
        <span class="text-slate-500 font-mono text-[11px]">
          Lat: {country.lat.toFixed(1)}° | Lon: {country.lng.toFixed(1)}°
        </span>
      </div>
    </div>

    <!-- Body / Dynamic Widget Content -->
    <div class="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
      {#if widget}
        <!-- Hero Primary Value Card -->
        <div class="rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-slate-700/80 p-5 shadow-lg relative overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {widget.title}
            </span>
            {#if widget.badge}
              <span
                class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold border {widget.badge.variant === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : widget.badge.variant === 'warning'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : widget.badge.variant === 'danger'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'}"
              >
                {widget.badge.text}
              </span>
            {/if}
          </div>

          {#if widget.primaryValue}
            <div class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              {widget.primaryValue}
            </div>
          {/if}

          {#if widget.subtitle}
            <p class="text-xs text-slate-400 mt-1">
              {widget.subtitle}
            </p>
          {/if}
        </div>

        <!-- Stats Grid -->
        {#if widget.statsGrid && widget.statsGrid.length > 0}
          <div class="grid grid-cols-2 gap-3">
            {#each widget.statsGrid as stat}
              <div class="rounded-xl bg-slate-950/50 border border-slate-800/80 p-3.5">
                <span class="text-[11px] text-slate-400 block font-medium">
                  {stat.label}
                </span>
                <span class="text-sm font-bold text-slate-200 mt-0.5 block font-mono">
                  {stat.value}
                </span>
              </div>
            {/each}
          </div>
        {/if}
      {:else}
        <div class="rounded-xl bg-slate-950/40 p-6 text-center text-slate-400 text-xs">
          Memuat data statistik negara...
        </div>
      {/if}

      <!-- Mini Trend Chart against IDR -->
      {#if hasCurrencyTrend}
        <div class="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3.5 space-y-2.5">
          <!-- Card Header & Range Toggle -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              {#if isPositiveChange}
                <TrendingUp class="h-3.5 w-3.5 text-emerald-400" />
              {:else}
                <TrendingDown class="h-3.5 w-3.5 text-rose-400" />
              {/if}
              <span class="text-xs font-semibold text-slate-200">
                Tren Kurs ({country.currencyCode}/IDR)
              </span>
            </div>

            <!-- Range Toggle Buttons -->
            <div class="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[10px]">
              <button
                type="button"
                onclick={() => (trendRange = '7d')}
                class="px-2 py-0.5 rounded font-bold transition cursor-pointer {trendRange === '7d'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'}"
              >
                7H
              </button>
              <button
                type="button"
                onclick={() => (trendRange = '30d')}
                class="px-2 py-0.5 rounded font-bold transition cursor-pointer {trendRange === '30d'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'}"
              >
                30H
              </button>
            </div>
          </div>

          <!-- Loading Shimmer State -->
          {#if isTrendLoading}
            <div class="h-20 w-full rounded-xl bg-slate-900/60 border border-slate-800/60 animate-shimmer flex items-center justify-center">
              <span class="text-[11px] text-slate-500">Memuat riwayat kurs...</span>
            </div>
          {:else if chartPoints.length > 0 && trendData}
            <!-- Trend Summary Stats -->
            <div class="flex items-center justify-between text-[11px]">
              <div class="flex items-center gap-2">
                <span class="text-slate-300 font-mono font-bold">
                  {formatRupiah(chartPoints[chartPoints.length - 1].point.middleRate)}
                </span>
                <span
                  class="rounded px-1.5 py-0.5 text-[10px] font-bold {isPositiveChange
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}"
                >
                  {formatPercent(trendData.summary.changePeriodPercent)}
                </span>
              </div>
              <div class="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                <span>Min: {formatRupiah(minRate)}</span>
                <span>•</span>
                <span>Maks: {formatRupiah(maxRate)}</span>
              </div>
            </div>

            <!-- SVG Sparkline Area -->
            <div
              role="region"
              aria-label="Grafik Tren Nilai Tukar"
              class="relative w-full overflow-hidden rounded-lg bg-slate-900/40 p-1 cursor-crosshair"
              onpointermove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const relX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, (relX - padX) / (rect.width - padX * 2)));
                const idx = Math.round(ratio * (chartPoints.length - 1));
                if (chartPoints[idx]) {
                  const pt = chartPoints[idx];
                  hoveredPoint = { date: pt.point.date, rate: pt.point.middleRate, x: pt.x, y: pt.y, point: pt.point };
                }
              }}
              onpointerleave={() => (hoveredPoint = null)}
            >
              <svg
                viewBox="0 0 {svgWidth} {svgHeight}"
                class="w-full h-16 overflow-visible pointer-events-none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="inspector-trend-grad-{country.iso3}" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stop-color={isPositiveChange ? '#10b981' : '#f43f5e'}
                      stop-opacity="0.35"
                    />
                    <stop
                      offset="100%"
                      stop-color={isPositiveChange ? '#10b981' : '#f43f5e'}
                      stop-opacity="0.0"
                    />
                  </linearGradient>
                </defs>

                <!-- Area Fill -->
                <path
                  d={areaD}
                  fill="url(#inspector-trend-grad-{country.iso3})"
                />

                <!-- Stroke Line -->
                <path
                  d={pathD}
                  fill="none"
                  stroke={isPositiveChange ? '#10b981' : '#f43f5e'}
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />

                <!-- Interactive Points -->
                {#each chartPoints as pt}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint?.point.date === pt.point.date ? 4.5 : 2}
                    class="transition-all {hoveredPoint?.point.date === pt.point.date
                      ? isPositiveChange ? 'fill-emerald-300 stroke-white' : 'fill-rose-300 stroke-white'
                      : isPositiveChange ? 'fill-emerald-400' : 'fill-rose-400'}"
                    stroke-width="1.5"
                  />
                {/each}
              </svg>

              <!-- Hover Tooltip -->
              {#if hoveredPoint}
                <div
                  class="absolute top-1 left-2 pointer-events-none rounded bg-slate-950/90 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-200 shadow-md font-mono flex items-center gap-1.5"
                >
                  <span class="text-slate-400">{hoveredPoint.date}:</span>
                  <span class="font-bold text-white">{formatRupiah(hoveredPoint.rate)}</span>
                </div>
              {/if}
            </div>
          {:else}
            <div class="p-3 text-center text-xs text-slate-500">
              Data historis belum tersedia untuk mata uang ini.
            </div>
          {/if}
        </div>
      {/if}

      <!-- Geographic Coordinates Box -->
      <div class="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 text-xs text-slate-400 space-y-1.5">
        <div class="flex items-center gap-1.5 font-medium text-slate-300">
          <Compass class="h-3.5 w-3.5 text-emerald-400" /> Informasi Geografis Spasial
        </div>
        <div class="flex justify-between text-[11px]">
          <span>Zona Waktu:</span>
          <span class="font-mono text-slate-300">UTC{country.utcOffset >= 0 ? '+' : ''}{country.utcOffset}:00</span>
        </div>
        <div class="flex justify-between text-[11px]">
          <span>Mata Uang Resmi:</span>
          <span class="font-mono text-slate-300">{country.currencyCode} - {country.currencyName}</span>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
      <button
        type="button"
        class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-md shadow-emerald-950/50 transition-all flex items-center justify-center gap-2"
        onclick={() => geoStore.closeInspector()}
      >
        Lanjutkan Eksplorasi Globe
      </button>
    </div>
  </aside>
{/if}

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.4);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(51, 65, 85, 0.6);
    border-radius: 9999px;
  }
</style>
