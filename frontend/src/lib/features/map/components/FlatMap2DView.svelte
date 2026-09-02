<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { MapStateStore } from '../mapState.svelte';
  import type { MapCountryData } from '../map-constants';
  import { REGION_FILTERS } from '../map-constants';
  import { getCountryFlagColor } from '../country-flag-colors';
  import { formatRupiah, formatPercent } from '$lib/formatters/currency';
  import { t } from '$lib/i18n';
  import type { Theme } from '$lib/theme';
  import { Loader2 } from 'lucide-svelte';

  interface Props {
    mapData: MapCountryData[];
    mapState: MapStateStore;
    currentTheme: Theme;
    onCountryClick?: (country: MapCountryData) => void;
  }

  let {
    mapData,
    mapState,
    currentTheme,
    onCountryClick,
  }: Props = $props();

  let flatMapContainer = $state<HTMLDivElement | null>(null);
  let plotlyModule: any = null;
  let isLoadingPlotly = $state(true);
  let isPlotRendered = $state(false);
  let resizeObserver: ResizeObserver | null = null;

  async function initPlotly() {
    if (!flatMapContainer) return;
    isLoadingPlotly = true;
    try {
      if (!plotlyModule) {
        // On-Demand Lazy-Loading of heavy Plotly bundle (~4.2MB)
        const plotlyPkg = await import('plotly.js-dist-min');
        plotlyModule = plotlyPkg.default || plotlyPkg;
      }
      renderFlatMap();
    } catch (err) {
      console.error('Failed to load Plotly module on-demand:', err);
    } finally {
      isLoadingPlotly = false;
    }
  }

  function renderFlatMap() {
    if (!flatMapContainer || !plotlyModule || mapData.length === 0) return;

    const isDark = currentTheme === 'dark';
    const dataList = mapData;
    const locations = dataList.map(d => d.iso3);

    const customData = dataList.map(d => ({
      country: d.countryName,
      code: d.currencyCode,
      name: d.currencyName,
      flag: d.flag,
      iso3: d.iso3,
      buyFormatted: formatRupiah(d.buyRate),
      sellFormatted: formatRupiah(d.sellRate),
      midFormatted: formatRupiah(d.middleRate),
      changeFormatted: formatPercent(d.change24h),
      change: d.change24h,
      changeColor: d.change24h >= 0 ? '#10b981' : '#ef4444',
    }));

    const isRateMetric = mapState.activeMetric === 'rate';
    const isFlagMetric = mapState.activeMetric === 'flag';
    const regionObj = REGION_FILTERS.find(r => r.id === mapState.activeRegion) || REGION_FILTERS[0];

    const rateColorScale: Array<[number, string]> = [
      [0.0, isDark ? '#042f2e' : '#ccfbf1'],
      [0.15, isDark ? '#065f46' : '#99f6e4'],
      [0.35, isDark ? '#0d9488' : '#2dd4bf'],
      [0.60, isDark ? '#06b6d4' : '#06b6d4'],
      [0.85, isDark ? '#3b82f6' : '#2563eb'],
      [1.0, isDark ? '#6366f1' : '#4f46e5'],
    ];

    const changeColorScale: Array<[number, string]> = [
      [0.0, '#ef4444'],
      [0.35, isDark ? '#991b1b' : '#f87171'],
      [0.48, isDark ? '#1e293b' : '#e2e8f0'],
      [0.52, isDark ? '#1e293b' : '#e2e8f0'],
      [0.65, isDark ? '#065f46' : '#34d399'],
      [1.0, '#10b981'],
    ];

    // Build discrete color scale for authentic country flag colors
    const flagColors = dataList.map(d => getCountryFlagColor(d.iso3, isDark));
    const flagColorScale: Array<[number, string]> = [];
    const n = dataList.length;
    for (let i = 0; i < n; i++) {
      const c = flagColors[i];
      const low = i / n;
      const high = (i + 1) / n;
      flagColorScale.push([low, c]);
      flagColorScale.push([high, c]);
    }

    const zValues = dataList.map((d, i) => {
      if (mapState.activeMetric === 'rate') return d.middleRate;
      if (mapState.activeMetric === 'change') return d.change24h;
      return i;
    });

    const labelCurrency = t('common.currency');
    const labelMid = t('common.mid');
    const labelBuy = t('common.buy');
    const labelSell = t('common.sell');
    const labelChange24h = t('common.change24h');
    const labelInspect = t('map.inspectCountry');

    const choroplethTrace = {
      type: 'choropleth' as const,
      locationmode: 'ISO-3' as const,
      locations: locations,
      z: zValues,
      customdata: customData,
      hovertemplate: 
        '<extra></extra>' +
        '<span style="font-size: 13px; font-weight: bold; color: ' + (isDark ? '#f8fafc' : '#0f172a') + ';">%{customdata.flag} %{customdata.country} (%{customdata.code})</span><br>' +
        '<span style="font-size: 11px; color: ' + (isDark ? '#94a3b8' : '#475569') + ';">' + labelCurrency + ': %{customdata.name}</span><br>' +
        '<span style="font-size: 12px; font-weight: 600; color: #10b981;">' + labelMid + ': %{customdata.midFormatted}</span><br>' +
        '<span style="font-size: 11px; color: ' + (isDark ? '#cbd5e1' : '#334155') + ';">' + labelBuy + ': %{customdata.buyFormatted} | ' + labelSell + ': %{customdata.sellFormatted}</span><br>' +
        '<span style="font-size: 11px; font-weight: 600; color: %{customdata.changeColor};">' + labelChange24h + ': %{customdata.changeFormatted}</span><br>' +
        '<span style="font-size: 10px; color: #0284c7;">👉 ' + labelInspect + '</span>',
      colorscale: mapState.activeMetric === 'rate' ? rateColorScale : (mapState.activeMetric === 'change' ? changeColorScale : flagColorScale),
      zmin: mapState.activeMetric === 'change' ? -1.0 : (mapState.activeMetric === 'flag' ? 0 : undefined),
      zmax: mapState.activeMetric === 'change' ? 1.0 : (mapState.activeMetric === 'flag' ? n - 1 : undefined),
      zmid: mapState.activeMetric === 'change' ? 0 : undefined,
      showscale: mapState.activeMetric !== 'flag',
      colorbar: {
        title: {
          text: isRateMetric ? 'Kurs (IDR)' : '24h (%)',
          side: 'top' as const,
          font: { color: isDark ? '#94a3b8' : '#475569', size: 11, family: 'Inter, sans-serif' },
        },
        thickness: 12,
        len: 0.55,
        x: 0.02,
        y: 0.30,
        xanchor: 'left' as const,
        tickfont: { color: isDark ? '#94a3b8' : '#475569', size: 9, family: 'Inter, sans-serif' },
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
        bordercolor: isDark ? 'rgba(51, 65, 85, 0.7)' : 'rgba(203, 213, 225, 0.9)',
        borderwidth: 1,
      },
      marker: {
        line: {
          color: isDark ? '#334155' : '#cbd5e1',
          width: 0.8,
        },
      },
    };

    const textTrace = {
      type: 'scattergeo' as const,
      locationmode: 'ISO-3' as const,
      locations: locations,
      mode: 'text' as const,
      text: dataList.map(d => `${d.countryName} (${d.currencyCode})`),
      textposition: 'middle center' as const,
      textfont: {
        family: 'Inter, sans-serif',
        size: 8,
        color: isDark ? 'rgba(255, 255, 255, 0.92)' : 'rgba(15, 23, 42, 0.92)',
      },
      hoverinfo: 'none' as const,
    };

    const traces = mapState.showLabels ? [choroplethTrace, textTrace] : [choroplethTrace];

    const layout = {
      geo: {
        projection: {
          type: 'natural earth' as const,
          scale: regionObj.zoom,
        },
        center: {
          lon: regionObj.lon,
          lat: regionObj.lat,
        },
        showcoastlines: true,
        coastlinecolor: isDark ? '#334155' : '#94a3b8',
        coastlinewidth: 0.8,
        showland: true,
        landcolor: isDark ? '#111827' : '#f1f5f9',
        showocean: true,
        oceancolor: isDark ? '#0b0f19' : '#faf8f3',
        showlakes: true,
        lakecolor: isDark ? '#0b0f19' : '#faf8f3',
        showcountries: true,
        countrycolor: isDark ? '#1e293b' : '#cbd5e1',
        countrywidth: 0.8,
        showframe: false,
        bgcolor: 'rgba(0,0,0,0)',
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      margin: { t: 0, b: 0, l: 0, r: 0 },
      autosize: true,
      font: {
        family: 'Inter, ui-sans-serif, system-ui, sans-serif',
        color: isDark ? '#e2e8f0' : '#1e293b',
      },
    };

    const config = {
      responsive: true,
      displayModeBar: false,
      scrollZoom: true,
    };

    plotlyModule.react(flatMapContainer, traces, layout, config).then(() => {
      isPlotRendered = true;
      if (flatMapContainer && (flatMapContainer as any).on) {
        (flatMapContainer as any).removeAllListeners?.('plotly_click');
        (flatMapContainer as any).on('plotly_click', (data: any) => {
          if (data && data.points && data.points.length > 0) {
            const point = data.points[0];
            const custom = point.customdata;
            if (custom) {
              const country = mapData.find(d => d.iso3 === custom.iso3);
              if (country) {
                onCountryClick?.(country);
              }
            }
          }
        });
      }
    });
  }

  // Reactive effect for theme, metric, region, label updates
  $effect(() => {
    // Track reactive dependencies
    const _theme = currentTheme;
    const _metric = mapState.activeMetric;
    const _region = mapState.activeRegion;
    const _labels = mapState.showLabels;
    const _data = mapData;

    if (plotlyModule && flatMapContainer) {
      renderFlatMap();
    }
  });

  onMount(() => {
    initPlotly();

    // Auto-Resize Observer
    if (flatMapContainer && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (plotlyModule && flatMapContainer) {
          plotlyModule.Plots?.resize(flatMapContainer);
        }
      });
      resizeObserver.observe(flatMapContainer);
    }
  });

  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (flatMapContainer && plotlyModule) {
      try {
        plotlyModule.purge(flatMapContainer);
      } catch {}
    }
  });
</script>

<div class="relative w-full h-full overflow-hidden">
  {#if isLoadingPlotly && !isPlotRendered}
    <div class="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg)]/80 backdrop-blur-sm z-10 gap-3">
      <Loader2 class="w-8 h-8 text-sky-500 animate-spin" />
      <span class="text-xs font-semibold text-[var(--ink-3)]">Memuat Peta Datar 2D (Plotly On-Demand)...</span>
    </div>
  {/if}

  <div
    bind:this={flatMapContainer}
    class="w-full h-full cursor-grab active:cursor-grabbing"
    style="z-index: 1;"
  ></div>
</div>
