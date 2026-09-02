<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { 
    Globe, 
    TrendingUp, 
    TrendingDown, 
    Sparkles, 
    ArrowRightLeft, 
    RotateCcw, 
    Check, 
    Info, 
    Coins, 
    Layers, 
    ShieldCheck, 
    ExternalLink 
  } from 'lucide-svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import MapSkeleton from '$lib/components/skeletons/MapSkeleton.svelte';
  import { apiClient, SUPPORTED_CURRENCIES } from '$lib/api/client';
  import type { RateItem } from '$lib/api/types';
  import { formatRupiah, formatPercent, formatDateTimeIndo } from '$lib/formatters/currency';

  // Component Props (Svelte 5 Runes)
  interface Props {
    onSelectCurrency?: (currencyCode: string) => void;
    class?: string;
  }

  let { onSelectCurrency, class: className = '' }: Props = $props();

  // Types
  type MetricType = 'rate' | 'change';

  interface MapCountryData {
    iso3: string;
    countryName: string;
    currencyCode: string;
    currencyName: string;
    flag: string;
    buyRate: number;
    sellRate: number;
    middleRate: number;
    spread: number;
    spreadPercent: number;
    change24h: number;
    rateType?: string;
    isEurozone?: boolean;
  }

  // Svelte 5 States
  let activeMetric = $state<MetricType>('rate');
  let selectedCurrencyCode = $state<string>('USD');
  let isLoading = $state(true);
  let liveRates = $state<RateItem[]>([]);
  let plotContainer = $state<HTMLDivElement | null>(null);
  let plotlyModule: any = null;
  let resizeObserver: ResizeObserver | null = null;
  let mapRenderKey = $state(0);

  // Expanded Country ISO3 Mapping
  const COUNTRY_CURRENCY_MAP: Array<{
    iso3: string;
    countryName: string;
    currencyCode: string;
    currencyName: string;
    flag: string;
    isEurozone?: boolean;
    defaultRate: { buy: number; sell: number; mid: number; change: number };
  }> = [
    // Major Currencies
    { iso3: 'USA', countryName: 'Amerika Serikat', currencyCode: 'USD', currencyName: 'US Dollar', flag: '🇺🇸', defaultRate: { buy: 16220, sell: 16280, mid: 16250, change: 0.15 } },
    { iso3: 'GBR', countryName: 'Inggris', currencyCode: 'GBP', currencyName: 'British Pound', flag: '🇬🇧', defaultRate: { buy: 20550, sell: 20720, mid: 20635, change: -0.12 } },
    { iso3: 'JPN', countryName: 'Jepang', currencyCode: 'JPY', currencyName: 'Japanese Yen (100)', flag: '🇯🇵', defaultRate: { buy: 107.5, sell: 109.2, mid: 108.35, change: -0.45 } },
    { iso3: 'SGP', countryName: 'Singapura', currencyCode: 'SGD', currencyName: 'Singapore Dollar', flag: '🇸🇬', defaultRate: { buy: 12180, sell: 12260, mid: 12220, change: 0.08 } },
    { iso3: 'AUS', countryName: 'Australia', currencyCode: 'AUD', currencyName: 'Australian Dollar', flag: '🇦🇺', defaultRate: { buy: 10380, sell: 10490, mid: 10435, change: 0.31 } },
    { iso3: 'MYS', countryName: 'Malaysia', currencyCode: 'MYR', currencyName: 'Malaysian Ringgit', flag: '🇲🇾', defaultRate: { buy: 3660, sell: 3710, mid: 3685, change: 0.05 } },
    { iso3: 'CHN', countryName: 'Tiongkok', currencyCode: 'CNY', currencyName: 'Chinese Yuan', flag: '🇨🇳', defaultRate: { buy: 2230, sell: 2270, mid: 2250, change: -0.09 } },
    { iso3: 'SAU', countryName: 'Arab Saudi', currencyCode: 'SAR', currencyName: 'Saudi Riyal', flag: '🇸🇦', defaultRate: { buy: 4310, sell: 4360, mid: 4335, change: 0.12 } },
    { iso3: 'THA', countryName: 'Thailand', currencyCode: 'THB', currencyName: 'Thai Baht', flag: '🇹🇭', defaultRate: { buy: 470, sell: 490, mid: 480, change: 0.18 } },
    { iso3: 'HKG', countryName: 'Hong Kong', currencyCode: 'HKD', currencyName: 'Hong Kong Dollar', flag: '🇭🇰', defaultRate: { buy: 2070, sell: 2110, mid: 2090, change: 0.14 } },
    { iso3: 'IDN', countryName: 'Indonesia (Base)', currencyCode: 'IDR', currencyName: 'Indonesian Rupiah', flag: '🇮🇩', defaultRate: { buy: 1, sell: 1, mid: 1, change: 0.00 } },

    // Eurozone Core Members (EUR)
    { iso3: 'DEU', countryName: 'Jerman', currencyCode: 'EUR', currencyName: 'Euro', flag: '🇩🇪', isEurozone: true, defaultRate: { buy: 17050, sell: 17180, mid: 17115, change: -0.22 } },
    { iso3: 'FRA', countryName: 'Prancis', currencyCode: 'EUR', currencyName: 'Euro', flag: '🇫🇷', isEurozone: true, defaultRate: { buy: 17050, sell: 17180, mid: 17115, change: -0.22 } },
    { iso3: 'ITA', countryName: 'Italia', currencyCode: 'EUR', currencyName: 'Euro', flag: '🇮🇹', isEurozone: true, defaultRate: { buy: 17050, sell: 17180, mid: 17115, change: -0.22 } },
    { iso3: 'ESP', countryName: 'Spanyol', currencyCode: 'EUR', currencyName: 'Euro', flag: '🇪🇸', isEurozone: true, defaultRate: { buy: 17050, sell: 17180, mid: 17115, change: -0.22 } },
    { iso3: 'NLD', countryName: 'Belanda', currencyCode: 'EUR', currencyName: 'Euro', flag: '🇳🇱', isEurozone: true, defaultRate: { buy: 17050, sell: 17180, mid: 17115, change: -0.22 } },
    { iso3: 'BEL', countryName: 'Belgia', currencyCode: 'EUR', currencyName: 'Euro', flag: '🇧🇪', isEurozone: true, defaultRate: { buy: 17050, sell: 17180, mid: 17115, change: -0.22 } },
    { iso3: 'AUT', countryName: 'Austria', currencyCode: 'EUR', currencyName: 'Euro', flag: '🇦🇹', isEurozone: true, defaultRate: { buy: 17050, sell: 17180, mid: 17115, change: -0.22 } },
    { iso3: 'IRL', countryName: 'Irlandia', currencyCode: 'EUR', currencyName: 'Euro', flag: '🇮🇪', isEurozone: true, defaultRate: { buy: 17050, sell: 17180, mid: 17115, change: -0.22 } },
    { iso3: 'PRT', countryName: 'Portugal', currencyCode: 'EUR', currencyName: 'Euro', flag: '🇵🇹', isEurozone: true, defaultRate: { buy: 17050, sell: 17180, mid: 17115, change: -0.22 } },
    { iso3: 'GRC', countryName: 'Yunani', currencyCode: 'EUR', currencyName: 'Euro', flag: '🇬🇷', isEurozone: true, defaultRate: { buy: 17050, sell: 17180, mid: 17115, change: -0.22 } },
    { iso3: 'FIN', countryName: 'Finlandia', currencyCode: 'EUR', currencyName: 'Euro', flag: '🇫🇮', isEurozone: true, defaultRate: { buy: 17050, sell: 17180, mid: 17115, change: -0.22 } },

    // Additional Global Economies
    { iso3: 'CAN', countryName: 'Kanada', currencyCode: 'CAD', currencyName: 'Canadian Dollar', flag: '🇨🇦', defaultRate: { buy: 11820, sell: 11950, mid: 11885, change: 0.10 } },
    { iso3: 'CHE', countryName: 'Swiss', currencyCode: 'CHF', currencyName: 'Swiss Franc', flag: '🇨🇭', defaultRate: { buy: 18200, sell: 18350, mid: 18275, change: -0.05 } },
    { iso3: 'NZD', countryName: 'Selandia Baru', currencyCode: 'NZD', currencyName: 'New Zealand Dollar', flag: '🇳🇿', defaultRate: { buy: 9720, sell: 9840, mid: 9780, change: 0.22 } },
    { iso3: 'KOR', countryName: 'Korea Selatan', currencyCode: 'KRW', currencyName: 'Korean Won (100)', flag: '🇰🇷', defaultRate: { buy: 11.75, sell: 11.95, mid: 11.85, change: -0.15 } },
    { iso3: 'IND', countryName: 'India', currencyCode: 'INR', currencyName: 'Indian Rupee', flag: '🇮🇳', defaultRate: { buy: 192, sell: 196, mid: 194, change: 0.05 } },
    { iso3: 'ARE', countryName: 'Uni Emirat Arab', currencyCode: 'AED', currencyName: 'UAE Dirham', flag: '🇦🇪', defaultRate: { buy: 4400, sell: 4450, mid: 4425, change: 0.12 } },
    { iso3: 'PHL', countryName: 'Filipina', currencyCode: 'PHP', currencyName: 'Philippine Peso', flag: '🇵🇭', defaultRate: { buy: 282, sell: 288, mid: 285, change: 0.02 } },
    { iso3: 'VNM', countryName: 'Vietnam', currencyCode: 'VND', currencyName: 'Vietnamese Dong (100)', flag: '🇻🇳', defaultRate: { buy: 63.5, sell: 65.0, mid: 64.25, change: -0.01 } },
    { iso3: 'BRA', countryName: 'Brasil', currencyCode: 'BRL', currencyName: 'Brazilian Real', flag: '🇧🇷', defaultRate: { buy: 2820, sell: 2890, mid: 2855, change: -0.35 } },
    { iso3: 'ZAF', countryName: 'Afrika Selatan', currencyCode: 'ZAR', currencyName: 'South African Rand', flag: '🇿🇦', defaultRate: { buy: 875, sell: 905, mid: 890, change: 0.18 } },
  ];

  // Derived country map records combining API live rates & fallback
  const mapData = $derived.by<MapCountryData[]>(() => {
    return COUNTRY_CURRENCY_MAP.map(item => {
      const live = liveRates.find(r => r.targetCurrency === item.currencyCode);
      const buyRate = live?.buyRate ?? item.defaultRate.buy;
      const sellRate = live?.sellRate ?? item.defaultRate.sell;
      const middleRate = live?.middleRate ?? item.defaultRate.mid;
      const spread = live?.spread ?? (sellRate - buyRate);
      const spreadPercent = live?.spreadPercent ?? ((spread / (middleRate || 1)) * 100);
      const change24h = live?.change24h ?? item.defaultRate.change;

      return {
        iso3: item.iso3,
        countryName: item.countryName,
        currencyCode: item.currencyCode,
        currencyName: item.currencyName,
        flag: item.flag,
        buyRate,
        sellRate,
        middleRate,
        spread,
        spreadPercent,
        change24h,
        rateType: live?.rateType || 'SPECIAL_RATE',
        isEurozone: item.isEurozone,
      };
    });
  });

  // Selected Country details
  const selectedCountry = $derived.by<MapCountryData>(() => {
    const found = mapData.find(d => d.currencyCode === selectedCurrencyCode);
    return found || mapData[0];
  });

  // Quick Currency Buttons list
  const quickCurrencies = [
    { code: 'USD', flag: '🇺🇸', label: 'USD' },
    { code: 'EUR', flag: '🇪🇺', label: 'EUR' },
    { code: 'JPY', flag: '🇯🇵', label: 'JPY' },
    { code: 'SGD', flag: '🇸🇬', label: 'SGD' },
    { code: 'AUD', flag: '🇦🇺', label: 'AUD' },
    { code: 'GBP', flag: '🇬🇧', label: 'GBP' },
    { code: 'CNY', flag: '🇨🇳', label: 'CNY' },
    { code: 'SAR', flag: '🇸🇦', label: 'SAR' },
    { code: 'MYR', flag: '🇲🇾', label: 'MYR' },
    { code: 'THB', flag: '🇹🇭', label: 'THB' },
  ];

  async function loadDataAndRenderMap() {
    isLoading = true;
    try {
      const [rates, plotly] = await Promise.all([
        apiClient.getLiveRates('IDR'),
        import('plotly.js-dist-min'),
      ]);
      liveRates = rates;
      plotlyModule = plotly.default || plotly;
    } catch (err) {
      console.error('Error loading map dependencies:', err);
    } finally {
      isLoading = false;
      // Trigger render after DOM update
      setTimeout(() => {
        renderPlotlyMap();
      }, 50);
    }
  }

  function renderPlotlyMap() {
    if (!plotContainer || !plotlyModule) return;

    const dataList = mapData;
    const locations = dataList.map(d => d.iso3);
    const zValues = dataList.map(d => (activeMetric === 'rate' ? d.middleRate : d.change24h));
    const customData = dataList.map(d => ({
      country: d.countryName,
      code: d.currencyCode,
      name: d.currencyName,
      flag: d.flag,
      buyFormatted: formatRupiah(d.buyRate),
      sellFormatted: formatRupiah(d.sellRate),
      midFormatted: formatRupiah(d.middleRate),
      changeFormatted: formatPercent(d.change24h),
      change: d.change24h,
    }));

    // Color Scales
    const rateColorScale: Array<[number, string]> = [
      [0.0, '#042f2e'],   // dark teal
      [0.15, '#065f46'],  // emerald 800
      [0.35, '#0d9488'],  // teal 600
      [0.60, '#06b6d4'],  // cyan 500
      [0.85, '#3b82f6'],  // blue 500
      [1.0, '#6366f1'],   // indigo 500
    ];

    const changeColorScale: Array<[number, string]> = [
      [0.0, '#ef4444'],   // bright red (melemah)
      [0.35, '#991b1b'],  // dark red
      [0.48, '#1e293b'],  // slate dark (netral)
      [0.52, '#1e293b'],  // slate dark (netral)
      [0.65, '#065f46'],  // dark emerald
      [1.0, '#10b981'],   // bright emerald (menguat)
    ];

    const isRateMetric = activeMetric === 'rate';

    const trace = {
      type: 'choropleth' as const,
      locationmode: 'ISO-3' as const,
      locations: locations,
      z: zValues,
      customdata: customData,
      hovertemplate: 
        '<extra></extra>' +
        '<span style="font-size: 13px; font-weight: bold; color: #f8fafc;">%{customdata.flag} %{customdata.country} (%{customdata.code})</span><br>' +
        '<span style="font-size: 11px; color: #94a3b8;">Mata Uang: %{customdata.name}</span><br>' +
        '<span style="font-size: 12px; font-weight: 600; color: #34d399;">Kurs Tengah: %{customdata.midFormatted}</span><br>' +
        '<span style="font-size: 11px; color: #cbd5e1;">Beli: %{customdata.buyFormatted} | Jual: %{customdata.sellFormatted}</span><br>' +
        '<span style="font-size: 11px; font-weight: 600; color: %{customdata.change >= 0 ? "#34d399" : "#f87171"};">Perubahan 24 Jam: %{customdata.changeFormatted}</span>',
      colorscale: isRateMetric ? rateColorScale : changeColorScale,
      zmin: isRateMetric ? undefined : -1.0,
      zmax: isRateMetric ? undefined : 1.0,
      zmid: isRateMetric ? undefined : 0,
      colorbar: {
        title: {
          text: isRateMetric ? 'Kurs (IDR)' : '24h (%)',
          side: 'top' as const,
          font: { color: '#94a3b8', size: 11, family: 'Inter, sans-serif' },
        },
        thickness: 12,
        len: 0.65,
        x: 0.98,
        y: 0.5,
        tickfont: { color: '#94a3b8', size: 10, family: 'Inter, sans-serif' },
        bgcolor: 'rgba(15, 23, 42, 0.75)',
        bordercolor: 'rgba(51, 65, 85, 0.6)',
        borderwidth: 1,
      },
      marker: {
        line: {
          color: '#334155',
          width: 0.8,
        },
      },
    };

    const layout = {
      geo: {
        projection: {
          type: 'natural earth' as const,
        },
        showcoastlines: true,
        coastlinecolor: '#475569',
        coastlinewidth: 0.8,
        showland: true,
        landcolor: '#0f172a',
        showocean: true,
        oceancolor: '#030712',
        showlakes: true,
        lakecolor: '#030712',
        showcountries: true,
        countrycolor: '#1e293b',
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
        color: '#e2e8f0',
      },
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: [
        'toImage',
        'sendDataToCloud',
        'hoverClosestGeo',
        'hoverClosestGl2d',
        'toggleHover',
        'resetGeo',
      ],
      scrollZoom: false,
    };

    plotlyModule.react(plotContainer, [trace], layout, config).then(() => {
      // Attach click event
      if (plotContainer && (plotContainer as any).on) {
        (plotContainer as any).removeAllListeners?.('plotly_click');
        (plotContainer as any).on('plotly_click', (data: any) => {
          if (data && data.points && data.points.length > 0) {
            const point = data.points[0];
            const clickedCustom = point.customdata;
            if (clickedCustom && clickedCustom.code) {
              selectedCurrencyCode = clickedCustom.code;
            }
          }
        });
      }
    });
  }

  function handleSelectCurrency(code: string) {
    selectedCurrencyCode = code;
  }

  function handleConvertClick() {
    if (onSelectCurrency && selectedCountry) {
      onSelectCurrency(selectedCountry.currencyCode);
    }
  }

  function toggleMetric(metric: MetricType) {
    activeMetric = metric;
    renderPlotlyMap();
  }

  onMount(() => {
    loadDataAndRenderMap();

    // Setup ResizeObserver for responsive resizing
    if (plotContainer) {
      resizeObserver = new ResizeObserver(() => {
        if (plotlyModule && plotContainer) {
          plotlyModule.Plots?.resize(plotContainer);
        }
      });
      resizeObserver.observe(plotContainer);
    }

    const handleWindowResize = () => {
      if (plotlyModule && plotContainer) {
        plotlyModule.Plots?.resize(plotContainer);
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  });

  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (plotContainer && plotlyModule) {
      try {
        plotlyModule.purge(plotContainer);
      } catch {}
    }
  });

  // Re-render when mapData changes
  $effect(() => {
    if (!isLoading && plotlyModule && plotContainer) {
      renderPlotlyMap();
    }
  });
</script>

{#if isLoading}
  <MapSkeleton class={className} />
{:else}
  <div class={`relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-950 p-5 sm:p-7 shadow-2xl backdrop-blur-md space-y-6 ${className}`}>
    <!-- Top decorative accent lights -->
    <div class="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-32 -right-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Header Section -->
    <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
      <div class="space-y-1.5">
        <div class="flex items-center gap-2.5 flex-wrap">
          <div class="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Globe class="w-5 h-5" />
          </div>
          <h2 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Peta Kurs Valuta Asing Dunia
          </h2>
          <Badge variant="success" size="sm" class="flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Real-Time Edge
          </Badge>
        </div>
        <p class="text-xs sm:text-sm text-slate-300">
          Visualisasi geografis nilai tukar valas global terhadap Rupiah (IDR). Klik negara mana pun di peta untuk detail kurs instan.
        </p>
      </div>

      <!-- Metric Toggle Buttons -->
      <div class="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/90 border border-slate-800/80 shrink-0 self-start lg:self-auto">
        <button
          type="button"
          onclick={() => toggleMetric('rate')}
          class={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeMetric === 'rate'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Coins class="w-3.5 h-3.5" />
          <span>Nilai Kurs (Rp)</span>
        </button>

        <button
          type="button"
          onclick={() => toggleMetric('change')}
          class={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeMetric === 'change'
              ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-950/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <TrendingUp class="w-3.5 h-3.5" />
          <span>Perubahan 24 Jam (%)</span>
        </button>
      </div>
    </div>

    <!-- Quick Currency Selector Pills -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 text-xs">
      <span class="text-slate-400 font-semibold shrink-0 flex items-center gap-1">
        <Layers class="w-3.5 h-3.5 text-indigo-400" />
        Pilih Cepat:
      </span>
      {#each quickCurrencies as curr}
        {@const isSelected = selectedCurrencyCode === curr.code}
        <button
          type="button"
          onclick={() => handleSelectCurrency(curr.code)}
          class={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all duration-150 shrink-0 cursor-pointer border ${
            isSelected
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/30'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
          }`}
        >
          <span>{curr.flag}</span>
          <span>{curr.label}</span>
          {#if isSelected}
            <Check class="w-3 h-3 text-emerald-400" />
          {/if}
        </button>
      {/each}
    </div>

    <!-- Interactive Plotly Map Container -->
    <div class="relative w-full rounded-2xl bg-slate-950/90 border border-slate-800/90 overflow-hidden shadow-inner p-2 sm:p-4">
      <!-- Sub-header indicator overlay -->
      <div class="absolute top-4 left-4 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-[11px] font-medium text-slate-300 backdrop-blur-md">
        <Info class="w-3.5 h-3.5 text-cyan-400" />
        <span>Mode: <strong class="text-emerald-400">{activeMetric === 'rate' ? 'Nilai Kurs Nominal' : 'Divergensi Tren 24 Jam'}</strong></span>
      </div>

      <div
        bind:this={plotContainer}
        class="w-full h-[380px] sm:h-[460px] lg:h-[500px]"
      ></div>
    </div>

    <!-- Detailed Selected Currency Card (Card Aksi Cepat) -->
    {#if selectedCountry}
      {@const curr = selectedCountry}
      {@const isPositive = curr.change24h >= 0}
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 p-5 sm:p-6 shadow-xl space-y-4">
        <div class="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <!-- Country & Currency Title Info -->
          <div class="flex items-center gap-3.5">
            <span class="text-3xl sm:text-4xl">{curr.flag}</span>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-lg sm:text-xl font-extrabold text-white">
                  {curr.currencyName} ({curr.currencyCode})
                </h3>
                <Badge variant="outline" size="sm" class="border-slate-700 text-slate-300">
                  {curr.countryName}
                </Badge>
                {#if curr.isEurozone}
                  <Badge variant="default" size="sm" class="bg-blue-600/30 text-blue-300 border border-blue-500/30">
                    Kawasan Euro
                  </Badge>
                {/if}
              </div>
              <p class="text-xs text-slate-400 mt-0.5">
                Basis Konversi: 1 {curr.currencyCode} = {formatRupiah(curr.middleRate)}
              </p>
            </div>
          </div>

          <!-- Quick Converter Action Button -->
          <div class="shrink-0 flex items-center gap-2.5">
            <Button
              variant="default"
              size="md"
              onclick={handleConvertClick}
              class="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-950/60"
            >
              <ArrowRightLeft class="w-4 h-4" />
              <span>Konversi {curr.currencyCode} Sekarang</span>
            </Button>
          </div>
        </div>

        <!-- Metrics Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <!-- Buy Rate -->
          <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
            <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Kurs Beli (Buy)</span>
            <div class="text-base sm:text-lg font-bold text-slate-100">
              {formatRupiah(curr.buyRate)}
            </div>
            <span class="text-[10px] text-slate-500">Bank membeli dari nasabah</span>
          </div>

          <!-- Sell Rate -->
          <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
            <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Kurs Jual (Sell)</span>
            <div class="text-base sm:text-lg font-bold text-slate-100">
              {formatRupiah(curr.sellRate)}
            </div>
            <span class="text-[10px] text-slate-500">Bank menjual ke nasabah</span>
          </div>

          <!-- Spread -->
          <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
            <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Spread Selisih</span>
            <div class="text-base sm:text-lg font-bold text-cyan-400">
              {formatRupiah(curr.spread)}
            </div>
            <span class="text-[10px] text-slate-500">Margin: {curr.spreadPercent.toFixed(2)}%</span>
          </div>

          <!-- 24h Change -->
          <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
            <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Perubahan 24 Jam</span>
            <div class={`text-base sm:text-lg font-bold flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {#if isPositive}
                <TrendingUp class="w-4 h-4" />
              {:else}
                <TrendingDown class="w-4 h-4" />
              {/if}
              <span>{formatPercent(curr.change24h)}</span>
            </div>
            <span class="text-[10px] text-slate-500">Terhadap IDR</span>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}
