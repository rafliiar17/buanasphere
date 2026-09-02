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
    ExternalLink,
    Building2,
    Calculator,
    Search,
    Compass,
    Activity,
    ArrowUpRight,
    Landmark,
    Maximize2
  } from 'lucide-svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import MapSkeleton from '$lib/components/skeletons/MapSkeleton.svelte';
  import { apiClient, SUPPORTED_CURRENCIES } from '$lib/api/client';
  import type { RateItem, RateMatrixResponse } from '$lib/api/types';
  import { formatRupiah, formatPercent, formatDateTimeIndo, formatCurrency } from '$lib/formatters/currency';

  // Component Props (Svelte 5 Runes)
  interface Props {
    onSelectCurrency?: (currencyCode: string) => void;
    class?: string;
  }

  let { onSelectCurrency, class: className = '' }: Props = $props();

  // Types
  type MetricType = 'rate' | 'change';
  type RegionId = 'all' | 'asean' | 'east_asia' | 'europe' | 'americas' | 'middle_east' | 'oceania';

  interface RegionFilter {
    id: RegionId;
    label: string;
    emoji: string;
    lon: number;
    lat: number;
    zoom: number;
    iso3List?: string[];
  }

  interface MapCountryData {
    iso3: string;
    countryName: string;
    currencyCode: string;
    currencyName: string;
    flag: string;
    regionId: RegionId;
    buyRate: number;
    sellRate: number;
    middleRate: number;
    spread: number;
    spreadPercent: number;
    change24h: number;
    rateType?: string;
    isEurozone?: boolean;
  }

  // Region Definitions
  const REGION_FILTERS: RegionFilter[] = [
    { id: 'all', label: 'Global / Semua', emoji: '🌏', lon: 0, lat: 20, zoom: 1 },
    { id: 'asean', label: 'ASEAN / Asia Tenggara', emoji: '🌴', lon: 115, lat: 5, zoom: 3.5, iso3List: ['IDN', 'SGP', 'MYS', 'THA', 'PHL', 'VNM'] },
    { id: 'east_asia', label: 'Asia Timur', emoji: '🏯', lon: 125, lat: 35, zoom: 3.0, iso3List: ['JPN', 'CHN', 'HKG', 'KOR'] },
    { id: 'europe', label: 'Eropa', emoji: '🏰', lon: 15, lat: 52, zoom: 2.8, iso3List: ['DEU', 'FRA', 'ITA', 'ESP', 'NLD', 'BEL', 'GBR', 'CHE'] },
    { id: 'americas', label: 'Amerika', emoji: '🗽', lon: -80, lat: 10, zoom: 1.8, iso3List: ['USA', 'CAN', 'BRA'] },
    { id: 'middle_east', label: 'Timur Tengah', emoji: '🕌', lon: 48, lat: 26, zoom: 3.8, iso3List: ['SAU', 'ARE'] },
    { id: 'oceania', label: 'Oceania / Pasifik', emoji: '🦘', lon: 145, lat: -28, zoom: 2.8, iso3List: ['AUS', 'NZD', 'NZL'] },
  ];

  // Svelte 5 States
  let activeMetric = $state<MetricType>('rate');
  let activeRegion = $state<RegionId>('all');
  let selectedCurrencyCode = $state<string>('USD');
  let isLoading = $state(true);
  let liveRates = $state<RateItem[]>([]);
  let bankMatrix = $state<RateMatrixResponse | null>(null);
  let isMatrixLoading = $state(false);
  let searchQuery = $state('');

  // Quick Convert Mini State
  let convertAmount = $state<number>(100);
  let convertDirection = $state<'foreign_to_idr' | 'idr_to_foreign'>('foreign_to_idr');

  let plotContainer = $state<HTMLDivElement | null>(null);
  let plotlyModule: any = null;
  let resizeObserver: ResizeObserver | null = null;

  // Expanded Country ISO3 Mapping
  const COUNTRY_CURRENCY_MAP: Array<{
    iso3: string;
    countryName: string;
    currencyCode: string;
    currencyName: string;
    flag: string;
    regionId: RegionId;
    isEurozone?: boolean;
    defaultRate: { buy: number; sell: number; mid: number; change: number };
  }> = [
    // Americas
    { iso3: 'USA', countryName: 'Amerika Serikat', currencyCode: 'USD', currencyName: 'US Dollar', flag: '🇺🇸', regionId: 'americas', defaultRate: { buy: 16220, sell: 16280, mid: 16250, change: 0.15 } },
    { iso3: 'CAN', countryName: 'Kanada', currencyCode: 'CAD', currencyName: 'Canadian Dollar', flag: '🇨🇦', regionId: 'americas', defaultRate: { buy: 11820, sell: 11950, mid: 11885, change: 0.10 } },
    { iso3: 'BRA', countryName: 'Brasil', currencyCode: 'BRL', currencyName: 'Brazilian Real', flag: '🇧🇷', regionId: 'americas', defaultRate: { buy: 2820, sell: 2890, mid: 2855, change: -0.35 } },

    // ASEAN
    { iso3: 'IDN', countryName: 'Indonesia (Base)', currencyCode: 'IDR', currencyName: 'Indonesian Rupiah', flag: '🇮🇩', regionId: 'asean', defaultRate: { buy: 1, sell: 1, mid: 1, change: 0.00 } },
    { iso3: 'SGP', countryName: 'Singapura', currencyCode: 'SGD', currencyName: 'Singapore Dollar', flag: '🇸🇬', regionId: 'asean', defaultRate: { buy: 12180, sell: 12260, mid: 12220, change: 0.08 } },
    { iso3: 'MYS', countryName: 'Malaysia', currencyCode: 'MYR', currencyName: 'Malaysian Ringgit', flag: '🇲🇾', regionId: 'asean', defaultRate: { buy: 3660, sell: 3710, mid: 3685, change: 0.05 } },
    { iso3: 'THA', countryName: 'Thailand', currencyCode: 'THB', currencyName: 'Thai Baht', flag: '🇹🇭', regionId: 'asean', defaultRate: { buy: 470, sell: 490, mid: 480, change: 0.18 } },
    { iso3: 'PHL', countryName: 'Filipina', currencyCode: 'PHP', currencyName: 'Philippine Peso', flag: '🇵🇭', regionId: 'asean', defaultRate: { buy: 282, sell: 288, mid: 285, change: 0.02 } },
    { iso3: 'VNM', countryName: 'Vietnam', currencyCode: 'VND', currencyName: 'Vietnamese Dong (100)', flag: '🇻🇳', regionId: 'asean', defaultRate: { buy: 63.5, sell: 65.0, mid: 64.25, change: -0.01 } },

    // East Asia
    { iso3: 'JPN', countryName: 'Jepang', currencyCode: 'JPY', currencyName: 'Japanese Yen (100)', flag: '🇯🇵', regionId: 'east_asia', defaultRate: { buy: 107.5, sell: 109.2, mid: 108.35, change: -0.45 } },
    { iso3: 'CHN', countryName: 'Tiongkok', currencyCode: 'CNY', currencyName: 'Chinese Yuan', flag: '🇨🇳', regionId: 'east_asia', defaultRate: { buy: 2230, sell: 2270, mid: 2250, change: -0.09 } },
    { iso3: 'HKG', countryName: 'Hong Kong', currencyCode: 'HKD', currencyName: 'Hong Kong Dollar', flag: '🇭🇰', regionId: 'east_asia', defaultRate: { buy: 2070, sell: 2110, mid: 2090, change: 0.14 } },
    { iso3: 'KOR', countryName: 'Korea Selatan', currencyCode: 'KRW', currencyName: 'Korean Won (100)', flag: '🇰🇷', regionId: 'east_asia', defaultRate: { buy: 11.75, sell: 11.95, mid: 11.85, change: -0.15 } },

    // Europe (EUR + GBP + CHF)
    { iso3: 'DEU', countryName: 'Jerman', currencyCode: 'EUR', currencyName: 'Euro', flag: '🇩🇪', regionId: 'europe', isEurozone: true, defaultRate: { buy: 17050, sell: 17180, mid: 17115, change: -0.22 } },
    { iso3: 'FRA', countryName: 'Prancis', currencyCode: 'EUR', currencyName: 'Euro', flag: '🇫🇷', regionId: 'europe', isEurozone: true, defaultRate: { buy: 17050, sell: 17180, mid: 17115, change: -0.22 } },
    { iso3: 'ITA', countryName: 'Italia', currencyCode: 'EUR', currencyName: 'Euro', flag: '🇮🇹', regionId: 'europe', isEurozone: true, defaultRate: { buy: 17050, sell: 17180, mid: 17115, change: -0.22 } },
    { iso3: 'ESP', countryName: 'Spanyol', currencyCode: 'EUR', currencyName: 'Euro', flag: '🇪🇸', regionId: 'europe', isEurozone: true, defaultRate: { buy: 17050, sell: 17180, mid: 17115, change: -0.22 } },
    { iso3: 'NLD', countryName: 'Belanda', currencyCode: 'EUR', currencyName: 'Euro', flag: '🇳🇱', regionId: 'europe', isEurozone: true, defaultRate: { buy: 17050, sell: 17180, mid: 17115, change: -0.22 } },
    { iso3: 'BEL', countryName: 'Belgia', currencyCode: 'EUR', currencyName: 'Euro', flag: '🇧🇪', regionId: 'europe', isEurozone: true, defaultRate: { buy: 17050, sell: 17180, mid: 17115, change: -0.22 } },
    { iso3: 'GBR', countryName: 'Inggris', currencyCode: 'GBP', currencyName: 'British Pound', flag: '🇬🇧', regionId: 'europe', defaultRate: { buy: 20550, sell: 20720, mid: 20635, change: -0.12 } },
    { iso3: 'CHE', countryName: 'Swiss', currencyCode: 'CHF', currencyName: 'Swiss Franc', flag: '🇨🇭', regionId: 'europe', defaultRate: { buy: 18200, sell: 18350, mid: 18275, change: -0.05 } },

    // Middle East
    { iso3: 'SAU', countryName: 'Arab Saudi', currencyCode: 'SAR', currencyName: 'Saudi Riyal', flag: '🇸🇦', regionId: 'middle_east', defaultRate: { buy: 4310, sell: 4360, mid: 4335, change: 0.12 } },
    { iso3: 'ARE', countryName: 'Uni Emirat Arab', currencyCode: 'AED', currencyName: 'UAE Dirham', flag: '🇦🇪', regionId: 'middle_east', defaultRate: { buy: 4400, sell: 4450, mid: 4425, change: 0.12 } },

    // Oceania
    { iso3: 'AUS', countryName: 'Australia', currencyCode: 'AUD', currencyName: 'Australian Dollar', flag: '🇦🇺', regionId: 'oceania', defaultRate: { buy: 10380, sell: 10490, mid: 10435, change: 0.31 } },
    { iso3: 'NZL', countryName: 'Selandia Baru', currencyCode: 'NZD', currencyName: 'New Zealand Dollar', flag: '🇳🇿', regionId: 'oceania', defaultRate: { buy: 9720, sell: 9840, mid: 9780, change: 0.22 } },

    // Other Key Markets
    { iso3: 'IND', countryName: 'India', currencyCode: 'INR', currencyName: 'Indian Rupee', flag: '🇮🇳', regionId: 'east_asia', defaultRate: { buy: 192, sell: 196, mid: 194, change: 0.05 } },
    { iso3: 'ZAF', countryName: 'Afrika Selatan', currencyCode: 'ZAR', currencyName: 'South African Rand', flag: '🇿🇦', regionId: 'americas', defaultRate: { buy: 875, sell: 905, mid: 890, change: 0.18 } },
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
        regionId: item.regionId,
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

  // Filtered Country list by search & region
  const filteredQuickList = $derived.by<MapCountryData[]>(() => {
    let list = mapData;
    if (activeRegion !== 'all') {
      const regionObj = REGION_FILTERS.find(r => r.id === activeRegion);
      if (regionObj?.iso3List) {
        list = list.filter(d => regionObj.iso3List!.includes(d.iso3));
      } else {
        list = list.filter(d => d.regionId === activeRegion);
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d => 
        d.currencyCode.toLowerCase().includes(q) ||
        d.currencyName.toLowerCase().includes(q) ||
        d.countryName.toLowerCase().includes(q)
      );
    }
    // Deduplicate currency codes for pills
    const seen = new Set<string>();
    return list.filter(d => {
      if (seen.has(d.currencyCode)) return false;
      seen.add(d.currencyCode);
      return true;
    });
  });

  // Selected Country details
  const selectedCountry = $derived.by<MapCountryData>(() => {
    const found = mapData.find(d => d.currencyCode === selectedCurrencyCode);
    return found || mapData[0];
  });

  // Quick converted result
  const calculatedConvertResult = $derived.by<{ value: number; formatted: string }>(() => {
    if (!selectedCountry) return { value: 0, formatted: '0' };
    const amt = Number(convertAmount) || 0;
    if (convertDirection === 'foreign_to_idr') {
      const val = amt * selectedCountry.middleRate;
      return { value: val, formatted: formatRupiah(val, { showFraction: true }) };
    } else {
      const val = selectedCountry.middleRate > 0 ? amt / selectedCountry.middleRate : 0;
      return { 
        value: val, 
        formatted: `${formatCurrency(val, selectedCountry.currencyCode, { maxDecimals: 4 })} ${selectedCountry.currencyCode}` 
      };
    }
  });

  // Fetch bank matrix quotes for inspector
  async function loadBankMatrixForSelectedCurrency(code: string) {
    if (!code || code === 'IDR') {
      bankMatrix = null;
      return;
    }
    isMatrixLoading = true;
    try {
      bankMatrix = await apiClient.getRateMatrix(code);
    } catch (err) {
      console.error('Error fetching bank matrix for currency:', code, err);
    } finally {
      isMatrixLoading = false;
    }
  }

  // Load initial map data
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
      setTimeout(() => {
        renderPlotlyMap();
        loadBankMatrixForSelectedCurrency(selectedCurrencyCode);
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
    const regionObj = REGION_FILTERS.find(r => r.id === activeRegion) || REGION_FILTERS[0];

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
          scale: regionObj.zoom,
        },
        center: {
          lon: regionObj.lon,
          lat: regionObj.lat,
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
      if (plotContainer && (plotContainer as any).on) {
        (plotContainer as any).removeAllListeners?.('plotly_click');
        (plotContainer as any).on('plotly_click', (data: any) => {
          if (data && data.points && data.points.length > 0) {
            const point = data.points[0];
            const clickedCustom = point.customdata;
            if (clickedCustom && clickedCustom.code) {
              handleSelectCurrency(clickedCustom.code);
            }
          }
        });
      }
    });
  }

  function handleSelectCurrency(code: string) {
    selectedCurrencyCode = code;
    loadBankMatrixForSelectedCurrency(code);
  }

  function handleRegionSelect(regionId: RegionId) {
    activeRegion = regionId;
    renderPlotlyMap();
  }

  function handleConvertFullClick() {
    if (onSelectCurrency && selectedCountry) {
      onSelectCurrency(selectedCountry.currencyCode);
    }
  }

  function toggleMetric(metric: MetricType) {
    activeMetric = metric;
    renderPlotlyMap();
  }

  function setPresetAmount(val: number) {
    convertAmount = val;
  }

  function toggleConvertDirection() {
    convertDirection = convertDirection === 'foreign_to_idr' ? 'idr_to_foreign' : 'foreign_to_idr';
  }

  onMount(() => {
    loadDataAndRenderMap();

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

  // Reactively update when metric or selected currency changes
  $effect(() => {
    if (!isLoading && plotlyModule && plotContainer) {
      // Map render triggered when dependencies change
    }
  });
</script>

{#if isLoading}
  <MapSkeleton class={className} />
{:else}
  <div class={`relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-950 p-4 sm:p-6 lg:p-7 shadow-2xl backdrop-blur-md space-y-6 ${className}`}>
    <!-- Top decorative light accents -->
    <div class="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Hero Header Section -->
    <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
      <div class="space-y-1.5 max-w-2xl">
        <div class="flex items-center gap-2.5 flex-wrap">
          <div class="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
            <Globe class="w-5 h-5" />
          </div>
          <h2 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Peta Kurs Valuta Asing Dunia
          </h2>
          <Badge variant="success" size="sm" class="flex items-center gap-1.5 shadow-sm">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Live Global Edge
          </Badge>
        </div>
        <p class="text-xs sm:text-sm text-slate-300">
          Visualisasi geografis real-time nilai tukar valas terhadap Rupiah (IDR). Klik negara mana pun pada peta untuk inspeksi nilai kurs, konversi kilat, dan komparasi bank langsung.
        </p>
      </div>

      <!-- Metric Toggle Buttons -->
      <div class="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/90 border border-slate-800/80 shrink-0 self-start lg:self-auto shadow-inner">
        <button
          type="button"
          onclick={() => toggleMetric('rate')}
          class={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeMetric === 'rate'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-400/30'
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
              ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-950/60 ring-1 ring-indigo-400/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <TrendingUp class="w-3.5 h-3.5" />
          <span>Performa 24 Jam (%)</span>
        </button>
      </div>
    </div>

    <!-- Region Quick Filter Bar -->
    <div class="space-y-2">
      <div class="flex items-center justify-between text-xs text-slate-400">
        <span class="font-bold flex items-center gap-1.5 text-slate-300">
          <Compass class="w-4 h-4 text-emerald-400" />
          Fokus Kawasan / Region:
        </span>
        <span class="text-[11px] hidden sm:inline">Pilih kawasan untuk auto-zoom peta</span>
      </div>

      <div class="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        {#each REGION_FILTERS as reg}
          {@const isActive = activeRegion === reg.id}
          <button
            type="button"
            onclick={() => handleRegionSelect(reg.id)}
            class={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 shrink-0 cursor-pointer border ${
              isActive
                ? 'bg-gradient-to-r from-emerald-600/30 to-teal-600/30 border-emerald-500/60 text-emerald-200 shadow-md ring-1 ring-emerald-500/30'
                : 'bg-slate-950/70 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 hover:border-slate-700'
            }`}
          >
            <span>{reg.emoji}</span>
            <span>{reg.label}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Quick Currency Selection Strip -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
      <span class="text-slate-400 font-semibold shrink-0 flex items-center gap-1">
        <Layers class="w-3.5 h-3.5 text-indigo-400" />
        Mata Uang:
      </span>
      {#each filteredQuickList as curr}
        {@const isSelected = selectedCurrencyCode === curr.currencyCode}
        <button
          type="button"
          onclick={() => handleSelectCurrency(curr.currencyCode)}
          class={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all duration-150 shrink-0 cursor-pointer border ${
            isSelected
              ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-500/40'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
          }`}
        >
          <span>{curr.flag}</span>
          <span>{curr.currencyCode}</span>
          {#if isSelected}
            <Check class="w-3 h-3 text-emerald-400" />
          {/if}
        </button>
      {/each}
    </div>

    <!-- Main Hero Stage: Map Visualizer (Left) & Side Inspector Card (Right) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <!-- Left: Interactive Plotly Map Container (7 cols) -->
      <div class="lg:col-span-7 xl:col-span-7 space-y-3">
        <div class="relative w-full rounded-2xl bg-slate-950/90 border border-slate-800/90 overflow-hidden shadow-2xl p-2 sm:p-3">
          <!-- Sub-header indicator overlay -->
          <div class="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/85 border border-slate-700/60 text-[11px] font-medium text-slate-300 backdrop-blur-md shadow-lg">
            <Info class="w-3.5 h-3.5 text-cyan-400" />
            <span>Mode: <strong class="text-emerald-400">{activeMetric === 'rate' ? 'Kurs Nominal' : 'Tren 24 Jam'}</strong></span>
          </div>

          <div
            bind:this={plotContainer}
            class="w-full h-[400px] sm:h-[480px] lg:h-[540px]"
          ></div>
        </div>
      </div>

      <!-- Right: Integrated Country Inspector & Action Panel (5 cols) -->
      <div class="lg:col-span-5 xl:col-span-5 space-y-4">
        {#if selectedCountry}
          {@const curr = selectedCountry}
          {@const isPositive = curr.change24h >= 0}
          <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900/90 to-slate-950 border border-emerald-500/30 p-4 sm:p-5 shadow-2xl space-y-4.5">
            <!-- Decorative corner light -->
            <div class="absolute -top-16 -right-16 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <!-- Inspector Header: Country & Currency -->
            <div class="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3.5">
              <div class="flex items-center gap-3">
                <span class="text-3xl sm:text-4xl">{curr.flag}</span>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="text-lg sm:text-xl font-extrabold text-white">
                      {curr.currencyName}
                    </h3>
                    <Badge variant="default" size="sm" class="bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
                      {curr.currencyCode}
                    </Badge>
                  </div>
                  <p class="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span>{curr.countryName}</span>
                    <span>•</span>
                    <span class="text-slate-300 font-semibold">{curr.iso3}</span>
                  </p>
                </div>
              </div>

              <!-- 24h Change Badge -->
              <div class={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border ${
                isPositive 
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}>
                {#if isPositive}
                  <TrendingUp class="w-3.5 h-3.5" />
                {:else}
                  <TrendingDown class="w-3.5 h-3.5" />
                {/if}
                <span>{formatPercent(curr.change24h)}</span>
              </div>
            </div>

            <!-- Live Rates Summary Cards -->
            <div class="grid grid-cols-2 gap-2.5">
              <!-- Middle Rate -->
              <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-0.5">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kurs Tengah (Mid)</span>
                <div class="text-base sm:text-lg font-black text-emerald-400">
                  {formatRupiah(curr.middleRate, { showFraction: true })}
                </div>
                <span class="text-[10px] text-slate-500">1 {curr.currencyCode} ke IDR</span>
              </div>

              <!-- Spread -->
              <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-0.5">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spread Selisih</span>
                <div class="text-base sm:text-lg font-bold text-cyan-300">
                  {formatRupiah(curr.spread, { showFraction: true })}
                </div>
                <span class="text-[10px] text-slate-500">Margin: {curr.spreadPercent.toFixed(2)}%</span>
              </div>

              <!-- Buy Rate -->
              <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-0.5">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kurs Beli (Buy)</span>
                <div class="text-sm sm:text-base font-bold text-slate-200">
                  {formatRupiah(curr.buyRate, { showFraction: true })}
                </div>
                <span class="text-[10px] text-slate-500">Bank beli dari Anda</span>
              </div>

              <!-- Sell Rate -->
              <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-0.5">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kurs Jual (Sell)</span>
                <div class="text-sm sm:text-base font-bold text-slate-200">
                  {formatRupiah(curr.sellRate, { showFraction: true })}
                </div>
                <span class="text-[10px] text-slate-500">Bank jual ke Anda</span>
              </div>
            </div>

            <!-- Quick Convert Mini Widget -->
            <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Calculator class="w-3.5 h-3.5 text-emerald-400" />
                  Kalkulator Konversi Instan
                </span>
                <button
                  type="button"
                  onclick={toggleConvertDirection}
                  class="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/30 transition cursor-pointer"
                >
                  <ArrowRightLeft class="w-3 h-3" />
                  <span>Tukar Arah</span>
                </button>
              </div>

              <!-- Convert Input & Direction -->
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <div class="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      bind:value={convertAmount}
                      class="w-full bg-slate-900 border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-sm text-white font-bold outline-none"
                      placeholder="Nominal..."
                    />
                    <span class="absolute right-3 top-1.5 text-xs font-bold text-slate-400">
                      {convertDirection === 'foreign_to_idr' ? curr.currencyCode : 'IDR'}
                    </span>
                  </div>
                </div>

                <!-- Preset Amount Buttons -->
                <div class="flex items-center gap-1.5">
                  {#each [1, 10, 50, 100, 1000] as preset}
                    <button
                      type="button"
                      onclick={() => setPresetAmount(preset)}
                      class={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer border ${
                        convertAmount === preset
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
                      }`}
                    >
                      {preset}
                    </button>
                  {/each}
                </div>

                <!-- Instant Result Box -->
                <div class="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-center space-y-0.5">
                  <span class="text-[10px] text-slate-400 uppercase font-semibold">Hasil Estimasi Nilai</span>
                  <div class="text-lg font-black text-emerald-300">
                    {calculatedConvertResult.formatted}
                  </div>
                </div>
              </div>
            </div>

            <!-- Brief Local Bank Comparison Matrix -->
            <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Building2 class="w-3.5 h-3.5 text-indigo-400" />
                  Komparasi Bank Lokal ({curr.currencyCode})
                </span>
                <span class="text-[10px] text-slate-400">BCA vs Mandiri vs BI vs BRI</span>
              </div>

              {#if isMatrixLoading}
                <div class="space-y-1.5 py-1">
                  <div class="h-6 rounded-lg animate-shimmer"></div>
                  <div class="h-6 rounded-lg animate-shimmer"></div>
                  <div class="h-6 rounded-lg animate-shimmer"></div>
                </div>
              {:else if bankMatrix && bankMatrix.rows.length > 0}
                <div class="overflow-hidden rounded-xl border border-slate-800/90">
                  <table class="w-full text-left text-xs">
                    <thead class="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th class="py-1.5 px-2.5">Bank / Sumber</th>
                        <th class="py-1.5 px-2 text-right">Beli (Rp)</th>
                        <th class="py-1.5 px-2 text-right">Jual (Rp)</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/70 text-[11px]">
                      {#each bankMatrix.rows.slice(0, 4) as row}
                        <tr class="hover:bg-slate-900/50 transition">
                          <td class="py-1.5 px-2.5 font-medium text-slate-200 flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                            <span>{row.providerName.split(' ')[0]}</span>
                            {#if row.isBestBuy}
                              <Badge variant="success" size="sm" class="text-[9px] py-0 px-1">Best Beli</Badge>
                            {:else if row.isBestSell}
                              <Badge variant="default" size="sm" class="text-[9px] py-0 px-1 bg-cyan-600/30 text-cyan-300">Best Jual</Badge>
                            {/if}
                          </td>
                          <td class="py-1.5 px-2 text-right font-semibold text-slate-300">
                            {formatRupiah(row.buyRate, { showFraction: false, withPrefix: false })}
                          </td>
                          <td class="py-1.5 px-2 text-right font-semibold text-slate-300">
                            {formatRupiah(row.sellRate, { showFraction: false, withPrefix: false })}
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {:else}
                <p class="text-[11px] text-slate-400 italic text-center py-2">
                  Memuat data komparasi perbankan...
                </p>
              {/if}
            </div>

            <!-- Bottom Action Button -->
            <div class="pt-1">
              <Button
                variant="default"
                size="md"
                onclick={handleConvertFullClick}
                class="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-950/60"
              >
                <ArrowRightLeft class="w-4 h-4" />
                <span>Buka Konverter Lengkap {curr.currencyCode}</span>
              </Button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
