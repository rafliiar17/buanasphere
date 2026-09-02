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
    Maximize2,
    X,
    ChevronRight,
    MapPin,
    BarChart3,
    Clock,
    SlidersHorizontal,
    Plus,
    Minus,
    LineChart
  } from 'lucide-svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import MapSkeleton from '$lib/components/skeletons/MapSkeleton.svelte';
  import GoogleRateChart from '../chart/GoogleRateChart.svelte';
  import { apiClient, SUPPORTED_CURRENCIES } from '$lib/api/client';
  import type { RateItem, RateMatrixResponse } from '$lib/api/types';
  import { formatRupiah, formatPercent, formatDateTimeIndo, formatCurrency } from '$lib/formatters/currency';
  import { t } from '$lib/i18n';
  import { 
    type MetricType, 
    type RegionId, 
    type RegionFilter, 
    type MapCountryData, 
    REGION_FILTERS, 
    COUNTRY_CURRENCY_MAP,
    PRESET_AMOUNTS 
  } from './map-constants';

  // Component Props (Svelte 5 Runes)
  interface Props {
    onSelectCurrency?: (currencyCode: string) => void;
    class?: string;
  }

  let { onSelectCurrency, class: className = '' }: Props = $props();

  // Svelte 5 States
  let activeMetric = $state<MetricType>('rate');
  let activeRegion = $state<RegionId>('all');
  let selectedCurrencyCode = $state<string>('USD');
  let selectedCountryIso3 = $state<string>('USA');
  let isInspectorOpen = $state(false);
  let isSearchDropdownOpen = $state(false);
  let searchQuery = $state('');
  let isLoading = $state(true);
  let liveRates = $state<RateItem[]>([]);
  let bankMatrix = $state<RateMatrixResponse | null>(null);
  let isMatrixLoading = $state(false);

  // Quick Convert Mini State
  let convertAmount = $state<number>(100);
  let convertDirection = $state<'foreign_to_idr' | 'idr_to_foreign'>('foreign_to_idr');

  let plotContainer = $state<HTMLDivElement | null>(null);
  let searchInputRef = $state<HTMLInputElement | null>(null);
  let searchContainerRef = $state<HTMLDivElement | null>(null);
  let plotlyModule: any = null;
  let resizeObserver: ResizeObserver | null = null;

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
        regionLabel: item.regionLabel,
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

  // Autocomplete search suggestions
  const searchResults = $derived.by<MapCountryData[]>(() => {
    if (!searchQuery.trim()) {
      return mapData.slice(0, 8);
    }
    const q = searchQuery.toLowerCase().trim();
    return mapData.filter(d => 
      d.countryName.toLowerCase().includes(q) ||
      d.currencyCode.toLowerCase().includes(q) ||
      d.currencyName.toLowerCase().includes(q) ||
      d.iso3.toLowerCase().includes(q) ||
      d.regionLabel.toLowerCase().includes(q)
    );
  });

  // Filtered Country list for region quick strip
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
    if (selectedCountryIso3) {
      const byIso = mapData.find(d => d.iso3 === selectedCountryIso3);
      if (byIso) return byIso;
    }
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

  // Load initial map data & Plotly
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
      iso3: d.iso3,
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
        '<span style="font-size: 11px; font-weight: 600; color: %{customdata.change >= 0 ? "#34d399" : "#f87171"};">Perubahan 24 Jam: %{customdata.changeFormatted}</span><br>' +
        '<span style="font-size: 10px; color: #38bdf8;">👉 Klik negara untuk membuka Country Inspector Modal</span>',
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
        thickness: 14,
        len: 0.70,
        x: 0.98,
        y: 0.5,
        tickfont: { color: '#94a3b8', size: 10, family: 'Inter, sans-serif' },
        bgcolor: 'rgba(15, 23, 42, 0.85)',
        bordercolor: 'rgba(51, 65, 85, 0.7)',
        borderwidth: 1,
      },
      marker: {
        line: {
          color: '#334155',
          width: 0.9,
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
        coastlinewidth: 0.9,
        showland: true,
        landcolor: '#0f172a',
        showocean: true,
        oceancolor: '#020617',
        showlakes: true,
        lakecolor: '#020617',
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
            if (clickedCustom) {
              handleOpenInspector(clickedCustom.code, clickedCustom.iso3);
            }
          }
        });
      }
    });
  }

  function handleOpenInspector(currencyCode: string, iso3?: string) {
    selectedCurrencyCode = currencyCode;
    if (iso3) {
      selectedCountryIso3 = iso3;
    } else {
      const match = mapData.find(d => d.currencyCode === currencyCode);
      if (match) selectedCountryIso3 = match.iso3;
    }
    isInspectorOpen = true;
    isSearchDropdownOpen = false;
    loadBankMatrixForSelectedCurrency(currencyCode);
  }

  function handleCloseInspector() {
    isInspectorOpen = false;
  }

  function handleSelectFromSearch(country: MapCountryData) {
    handleOpenInspector(country.currencyCode, country.iso3);
    searchQuery = '';
    isSearchDropdownOpen = false;
    // Auto-switch region view if specific
    if (country.regionId && activeRegion !== country.regionId) {
      activeRegion = country.regionId;
      renderPlotlyMap();
    }
  }

  function handleRegionSelect(regionId: RegionId) {
    activeRegion = regionId;
    renderPlotlyMap();
  }

  function handleResetView() {
    activeRegion = 'all';
    renderPlotlyMap();
  }

  function handleConvertFullClick() {
    if (onSelectCurrency && selectedCountry) {
      onSelectCurrency(selectedCountry.currencyCode);
      isInspectorOpen = false;
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

  // Keyboard shortcut: Escape closes drawer and search dropdown
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (isSearchDropdownOpen) {
        isSearchDropdownOpen = false;
      } else if (isInspectorOpen) {
        isInspectorOpen = false;
      }
    }
  }

  // Click outside listener for search dropdown
  function handleClickOutside(e: MouseEvent) {
    if (searchContainerRef && !searchContainerRef.contains(e.target as Node)) {
      isSearchDropdownOpen = false;
    }
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
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClickOutside);
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
</script>

{#if isLoading}
  <MapSkeleton class={className} />
{:else}
  <div class={`relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-950 p-4 sm:p-6 lg:p-7 shadow-2xl backdrop-blur-md space-y-5 sm:space-y-6 ${className}`}>
    <!-- Top glowing ambient accents -->
    <div class="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Top Header: Title, Live Pulse & Metric Switcher -->
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
          Visualisasi geografis interaktif 100% Full Width mencakup 195+ negara dunia. Klik negara mana pun pada peta untuk membuka <strong>Country Inspector Drawer</strong>, kalkulator valas instan, dan komparasi bank langsung.
        </p>
      </div>

      <!-- Metric Switcher Toggle & Reset Zoom Controls -->
      <div class="flex items-center gap-2 flex-wrap self-start lg:self-auto">
        <div class="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/90 border border-slate-800/80 shadow-inner">
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

        <!-- Reset View Button -->
        <button
          type="button"
          onclick={handleResetView}
          class="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-semibold shadow-sm transition cursor-pointer"
          title="Reset Zoom & Pusatkan Peta Dunia"
        >
          <RotateCcw class="w-3.5 h-3.5 text-slate-400" />
          <span class="hidden sm:inline">Reset View</span>
        </button>
      </div>
    </div>

    <!-- Top Controls Toolbar: Search Autocomplete & Region Filter Pills -->
    <div class="relative z-20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
      <!-- Search Autocomplete Bar -->
      <div class="relative flex-1 max-w-md" bind:this={searchContainerRef}>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search class="w-4 h-4" />
          </div>
          <input
            bind:this={searchInputRef}
            type="text"
            bind:value={searchQuery}
            onfocus={() => (isSearchDropdownOpen = true)}
            oninput={() => (isSearchDropdownOpen = true)}
            placeholder={t('map.searchPlaceholder')}
            class="w-full bg-slate-950/90 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-2xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 outline-none transition shadow-inner focus:ring-2 focus:ring-emerald-500/20"
          />
          {#if searchQuery}
            <button
              type="button"
              onclick={() => { searchQuery = ''; searchInputRef?.focus(); }}
              class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          {/if}
        </div>

        <!-- Autocomplete Suggestions Dropdown -->
        {#if isSearchDropdownOpen && searchResults.length > 0}
          <div class="absolute top-full left-0 right-0 mt-2 z-50 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl max-h-72 overflow-y-auto divide-y divide-slate-800/80 scrollbar-thin">
            <div class="px-3.5 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/60 flex items-center justify-between">
              <span>{t('common.search')} ({searchResults.length})</span>
              <span class="text-[10px] text-emerald-400 font-normal">{t('map.inspectCountry')}</span>
            </div>
            {#each searchResults as item}
              <button
                type="button"
                onclick={() => handleSelectFromSearch(item)}
                class="w-full text-left px-3.5 py-2.5 hover:bg-slate-800/80 flex items-center justify-between gap-3 transition cursor-pointer group"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <span class="text-2xl shrink-0">{item.flag}</span>
                  <div class="truncate">
                    <div class="text-xs font-bold text-slate-100 group-hover:text-emerald-400 transition flex items-center gap-1.5">
                      <span>{item.countryName}</span>
                      <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{item.currencyCode}</span>
                    </div>
                    <div class="text-[11px] text-slate-400 truncate">
                      {item.currencyName} • {item.regionLabel}
                    </div>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <div class="text-xs font-black text-emerald-400">
                    {formatRupiah(item.middleRate, { showFraction: true })}
                  </div>
                  <div class={`text-[10px] font-semibold flex items-center justify-end gap-0.5 ${item.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <span>{formatPercent(item.change24h)}</span>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Region Quick Filter Bar -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {#each REGION_FILTERS as reg}
          {@const isActive = activeRegion === reg.id}
          <button
            type="button"
            onclick={() => handleRegionSelect(reg.id)}
            class={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 shrink-0 cursor-pointer border ${
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
      <span class="text-slate-400 font-semibold shrink-0 flex items-center gap-1.5">
        <Layers class="w-3.5 h-3.5 text-indigo-400" />
        <span>{t('map.quickSelection')}</span>
      </span>
      {#each filteredQuickList as curr}
        {@const isSelected = selectedCurrencyCode === curr.currencyCode}
        <button
          type="button"
          onclick={() => handleOpenInspector(curr.currencyCode, curr.iso3)}
          class={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold transition-all duration-150 shrink-0 cursor-pointer border ${
            isSelected
              ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm'
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

    <!-- Full-Width Canvas World Map Container (100% Immersive View) -->
    <div class="relative w-full rounded-2xl bg-slate-950/90 border border-slate-800/90 overflow-hidden shadow-2xl p-2 sm:p-3.5">
      <!-- Top floating info status badge -->
      <div class="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/85 border border-slate-700/60 text-[11px] font-medium text-slate-300 backdrop-blur-md shadow-lg">
        <Info class="w-3.5 h-3.5 text-cyan-400" />
        <span>{t('map.modeLabel')} <strong class="text-emerald-400">{activeMetric === 'rate' ? t('map.modeRate') : t('map.modeChange')}</strong></span>
      </div>

      <!-- Bottom Floating Inspector Trigger Pill -->
      <div class="absolute bottom-4 left-4 right-4 sm:right-auto z-10 flex items-center justify-between sm:justify-start gap-3 px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-emerald-500/40 text-xs font-semibold text-slate-200 backdrop-blur-md shadow-2xl">
        <div class="flex items-center gap-2">
          <span class="text-lg">{selectedCountry.flag}</span>
          <div class="flex flex-col">
            <span class="text-[11px] text-slate-400 leading-none">{selectedCountry.countryName} ({selectedCountry.currencyCode})</span>
            <span class="text-xs font-bold text-emerald-400 leading-tight">
              {formatRupiah(selectedCountry.middleRate, { showFraction: true })}
            </span>
          </div>
        </div>
        <button
          type="button"
          onclick={() => (isInspectorOpen = true)}
          class="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow cursor-pointer"
        >
          <span>{t('map.inspectCountry')}</span>
          <ChevronRight class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Plotly Choropleth 100% Full-Width Map Canvas -->
      <div
        bind:this={plotContainer}
        class="w-full h-[520px] sm:h-[580px] lg:h-[640px]"
      ></div>
    </div>
  </div>

  <!-- Interactive Floating Country Inspector Slide-Over Drawer / Modal Sheet -->
  {#if isInspectorOpen && selectedCountry}
    {@const curr = selectedCountry}
    {@const isPositive = curr.change24h >= 0}

    <!-- Backdrop Overlay -->
    <div
      role="button"
      tabindex="0"
      aria-label={t('common.close')}
      onclick={handleCloseInspector}
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCloseInspector(); }}
      class="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300"
    ></div>

    <!-- Slide-Over Drawer Panel -->
    <aside
      aria-label={t('map.countryInspector')}
      class="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md md:max-w-lg lg:max-w-xl bg-gradient-to-b from-slate-900/98 via-slate-950/98 to-slate-950 border-l border-emerald-500/30 shadow-2xl backdrop-blur-2xl p-5 sm:p-7 overflow-y-auto transform transition-transform duration-300 flex flex-col justify-between space-y-6"
    >
      <!-- Top Decorative Accent -->
      <div class="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="space-y-6">
        <!-- Inspector Header: Flag, Name, Currency, Badges, Close Button -->
        <div class="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div class="flex items-center gap-3.5">
            <span class="text-4xl sm:text-5xl">{curr.flag}</span>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {curr.countryName}
                </h3>
                <Badge variant="default" size="sm" class="bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
                  {curr.currencyCode}
                </Badge>
              </div>
              <p class="text-xs sm:text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span class="text-slate-200 font-semibold">{curr.currencyName}</span>
                <span>•</span>
                <span class="text-slate-400">{curr.regionLabel}</span>
                <span>•</span>
                <span class="text-emerald-400 font-mono font-bold">{curr.iso3}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onclick={handleCloseInspector}
            class="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title={t('common.close')}
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- 24h Performance & Key Rate Alert Ribbon -->
        <div class="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/90">
          <div class="flex items-center gap-2">
            <Activity class="w-4 h-4 text-emerald-400" />
            <span class="text-xs font-semibold text-slate-300">{t('map.status24h')}</span>
          </div>
          <div class={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
            isPositive 
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}>
            {#if isPositive}
              <TrendingUp class="w-3.5 h-3.5" />
            {:else}
              <TrendingDown class="w-3.5 h-3.5" />
            {/if}
            <span>{isPositive ? t('map.strengthening') : t('map.weakening')} ({formatPercent(curr.change24h)})</span>
          </div>
        </div>

        <!-- Grid Statistik Kurs: Kurs Tengah, Spread, Kurs Beli, Kurs Jual -->
        <div class="grid grid-cols-2 gap-3">
          <!-- Kurs Tengah (Mid) -->
          <div class="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 space-y-1 shadow-lg">
            <div class="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>{t('map.midRate')}</span>
              <Coins class="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div class="text-lg sm:text-xl font-black text-emerald-400">
              {formatRupiah(curr.middleRate, { showFraction: true })}
            </div>
            <span class="text-[10px] text-slate-500 block">{t('map.midRateDesc', { currency: curr.currencyCode })}</span>
          </div>

          <!-- Spread Margin -->
          <div class="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/30 space-y-1 shadow-lg">
            <div class="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>{t('map.spread')}</span>
              <BarChart3 class="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div class="text-lg sm:text-xl font-black text-cyan-300">
              {formatRupiah(curr.spread, { showFraction: true })}
            </div>
            <span class="text-[10px] text-slate-500 block">{t('map.margin', { percent: curr.spreadPercent.toFixed(2) })}</span>
          </div>

          <!-- Kurs Beli (Bank Beli dari Anda) -->
          <div class="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-1">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{t('map.buyRate')}</span>
            <div class="text-sm sm:text-base font-bold text-slate-200">
              {formatRupiah(curr.buyRate, { showFraction: true })}
            </div>
            <span class="text-[10px] text-slate-500 block">{t('map.buyRateDesc')}</span>
          </div>

          <!-- Kurs Jual (Bank Jual ke Anda) -->
          <div class="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-1">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{t('map.sellRate')}</span>
            <div class="text-sm sm:text-base font-bold text-slate-200">
              {formatRupiah(curr.sellRate, { showFraction: true })}
            </div>
            <span class="text-[10px] text-slate-500 block">{t('map.sellRateDesc')}</span>
          </div>
        </div>

        <!-- Kalkulator Konversi Kilat Valas <-> IDR -->
        <div class="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-3.5 shadow-xl">
          <div class="flex items-center justify-between">
            <span class="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2">
              <Calculator class="w-4 h-4 text-emerald-400" />
              {t('map.quickConvertTitle')}
            </span>
            <button
              type="button"
              onclick={toggleConvertDirection}
              class="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/30 transition cursor-pointer"
            >
              <ArrowRightLeft class="w-3.5 h-3.5" />
              <span>{t('map.switchDirection')}</span>
            </button>
          </div>

          <!-- Input Nominal & Direction -->
          <div class="space-y-2.5">
            <div class="relative">
              <input
                type="number"
                min="0"
                step="any"
                bind:value={convertAmount}
                class="w-full bg-slate-900 border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm sm:text-base text-white font-bold outline-none shadow-inner"
                placeholder={t('map.convertAmountPlaceholder')}
              />
              <span class="absolute right-3.5 top-2 text-xs font-bold text-slate-400">
                {convertDirection === 'foreign_to_idr' ? curr.currencyCode : 'IDR'}
              </span>
            </div>

            <!-- Quick Preset Amount Buttons: 1, 10, 50, 100, 1000, 10000 -->
            <div class="flex items-center gap-1.5 flex-wrap">
              {#each PRESET_AMOUNTS as preset}
                <button
                  type="button"
                  onclick={() => setPresetAmount(preset)}
                  class={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                    convertAmount === preset
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                >
                  {preset.toLocaleString('id-ID')}
                </button>
              {/each}
            </div>

            <!-- Instant Calculated Result Banner -->
            <div class="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-0.5">
              <span class="text-[10px] text-slate-400 uppercase font-semibold">{t('map.estimatedResult')}</span>
              <div class="text-xl sm:text-2xl font-black text-emerald-300">
                {calculatedConvertResult.formatted}
              </div>
            </div>
          </div>
        </div>

        <!-- Grafik Nilai Tukar Interaktif Google-Style untuk Valas Ini -->
        <div class="space-y-2">
          <div class="flex items-center justify-between px-1">
            <span class="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2">
              <LineChart class="w-4 h-4 text-indigo-400" />
              {t('map.chartTrendTitle', { currency: curr.currencyCode })}
            </span>
            <span class="text-[10px] text-emerald-400 font-mono">{t('map.googleCrosshair')}</span>
          </div>

          <GoogleRateChart
            initialCurrency={curr.currencyCode}
            compact={true}
            showCurrencySelector={false}
          />
        </div>
      </div>

      <!-- Action Button at Drawer Bottom -->
      <div class="pt-4 border-t border-slate-800/80">
        <Button
          variant="default"
          size="lg"
          onclick={handleConvertFullClick}
          class="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-xl shadow-emerald-950/70 cursor-pointer"
        >
          <ArrowRightLeft class="w-4 h-4" />
          <span>{t('map.openFullConverter')}</span>
        </Button>
      </div>
    </aside>
  {/if}
{/if}
