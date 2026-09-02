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
    ChevronDown,
    ChevronUp
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
  import { getTheme, subscribeTheme, type Theme } from '$lib/theme';
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
  let isControlsCollapsed = $state(false);
  let searchQuery = $state('');
  let highlightedIndex = $state(0);
  let isLoading = $state(true);
  let liveRates = $state<RateItem[]>([]);
  let bankMatrix = $state<RateMatrixResponse | null>(null);
  let isMatrixLoading = $state(false);

  // Quick Convert Mini State
  let convertAmount = $state<number>(100);
  let convertDirection = $state<'foreign_to_idr' | 'idr_to_foreign'>('foreign_to_idr');

  let currentTheme = $state<Theme>(getTheme());
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
      };
    });
  });

  // Autocomplete search suggestions with live reactive filtering
  const searchResults = $derived.by<MapCountryData[]>(() => {
    const raw = searchQuery.trim().toLowerCase();
    if (!raw) {
      return mapData.slice(0, 8);
    }
    return mapData.filter(d => 
      d.countryName.toLowerCase().includes(raw) ||
      d.currencyCode.toLowerCase().includes(raw) ||
      d.currencyName.toLowerCase().includes(raw) ||
      d.iso3.toLowerCase().includes(raw) ||
      d.regionLabel.toLowerCase().includes(raw)
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

    const isDark = currentTheme === 'dark';
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
      changeColor: d.change24h >= 0 ? '#10b981' : '#ef4444',
    }));

    // Color Scales
    const rateColorScale: Array<[number, string]> = [
      [0.0, isDark ? '#042f2e' : '#ccfbf1'],   // teal
      [0.15, isDark ? '#065f46' : '#99f6e4'],  // emerald
      [0.35, isDark ? '#0d9488' : '#2dd4bf'],  // teal
      [0.60, isDark ? '#06b6d4' : '#06b6d4'],  // cyan
      [0.85, isDark ? '#3b82f6' : '#2563eb'],  // blue
      [1.0, isDark ? '#6366f1' : '#4f46e5'],   // indigo
    ];

    const changeColorScale: Array<[number, string]> = [
      [0.0, '#ef4444'],   // bright red (melemah)
      [0.35, isDark ? '#991b1b' : '#f87171'],  // red
      [0.48, isDark ? '#1e293b' : '#e2e8f0'],  // neutral
      [0.52, isDark ? '#1e293b' : '#e2e8f0'],  // neutral
      [0.65, isDark ? '#065f46' : '#34d399'],  // emerald
      [1.0, '#10b981'],   // bright emerald (menguat)
    ];

    const isRateMetric = activeMetric === 'rate';
    const regionObj = REGION_FILTERS.find(r => r.id === activeRegion) || REGION_FILTERS[0];

    const labelCurrency = t('common.currency');
    const labelMid = t('common.mid');
    const labelBuy = t('common.buy');
    const labelSell = t('common.sell');
    const labelChange24h = t('common.change24h');
    const labelInspect = t('map.inspectCountry');

    const trace = {
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
      colorscale: isRateMetric ? rateColorScale : changeColorScale,
      zmin: isRateMetric ? undefined : -1.0,
      zmax: isRateMetric ? undefined : 1.0,
      zmid: isRateMetric ? undefined : 0,
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
        coastlinecolor: isDark ? '#475569' : '#94a3b8',
        coastlinewidth: 0.9,
        showland: true,
        landcolor: isDark ? '#0f172a' : '#f8fafc',
        showocean: true,
        oceancolor: isDark ? '#080d1a' : '#e2e8f0',
        showlakes: true,
        lakecolor: isDark ? '#080d1a' : '#e2e8f0',
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

    plotlyModule.react(plotContainer, [trace], layout, config).then(() => {
      if (plotContainer && (plotContainer as any).on) {
        (plotContainer as any).removeAllListeners?.('plotly_click');
        (plotContainer as any).on('plotly_click', (data: any) => {
          if (data && data.points && data.points.length > 0) {
            const point = data.points[0];
            const custom = point.customdata;
            if (custom) {
              selectedCurrencyCode = custom.code;
              selectedCountryIso3 = custom.iso3;
              isInspectorOpen = true;
              loadBankMatrixForSelectedCurrency(custom.code);
              onSelectCurrency?.(custom.code);
            }
          }
        });
      }
    });
  }

  function handleOpenInspector(code: string, iso3: string) {
    selectedCurrencyCode = code;
    selectedCountryIso3 = iso3;
    isInspectorOpen = true;
    loadBankMatrixForSelectedCurrency(code);
    onSelectCurrency?.(code);
  }

  function handleCloseInspector() {
    isInspectorOpen = false;
  }

  function toggleMetric(metric: MetricType) {
    if (activeMetric === metric) return;
    activeMetric = metric;
    renderPlotlyMap();
  }

  function handleRegionSelect(regionId: RegionId) {
    activeRegion = regionId;
    renderPlotlyMap();
  }

  function handleResetView() {
    activeRegion = 'all';
    searchQuery = '';
    renderPlotlyMap();
  }

  function handleSelectFromSearch(item: MapCountryData) {
    selectedCurrencyCode = item.currencyCode;
    selectedCountryIso3 = item.iso3;
    searchQuery = item.countryName;
    isSearchDropdownOpen = false;
    isInspectorOpen = true;
    
    // If country belongs to a specific region, focus the map
    if (item.regionId && item.regionId !== 'all') {
      activeRegion = item.regionId;
      renderPlotlyMap();
    }

    loadBankMatrixForSelectedCurrency(item.currencyCode);
    onSelectCurrency?.(item.currencyCode);
  }

  function handleSearchKeyDown(e: KeyboardEvent) {
    if (!isSearchDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        isSearchDropdownOpen = true;
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (searchResults.length > 0) {
        highlightedIndex = (highlightedIndex + 1) % searchResults.length;
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (searchResults.length > 0) {
        highlightedIndex = (highlightedIndex - 1 + searchResults.length) % searchResults.length;
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0 && searchResults[highlightedIndex]) {
        handleSelectFromSearch(searchResults[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      isSearchDropdownOpen = false;
    }
  }

  function toggleConvertDirection() {
    convertDirection = convertDirection === 'foreign_to_idr' ? 'idr_to_foreign' : 'foreign_to_idr';
  }

  function setPresetAmount(amt: number) {
    convertAmount = amt;
  }

  onMount(() => {
    loadDataAndRenderMap();

    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef && !searchContainerRef.contains(e.target as Node)) {
        isSearchDropdownOpen = false;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        isSearchDropdownOpen = false;
        isInspectorOpen = false;
      }
    };

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

    const unsubTheme = subscribeTheme((th) => {
      currentTheme = th;
      if (plotContainer && plotlyModule) {
        renderPlotlyMap();
      }
    });

    return () => {
      unsubTheme();
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
  <!-- Full-Screen 100vh Map-First Terminal Container -->
  <div class={`relative w-full h-full min-h-[calc(100vh-52px)] overflow-hidden bg-[var(--bg)] ${className}`}>

    <!-- 100% Full-Viewport Plotly Choropleth World Map Canvas -->
    <div
      bind:this={plotContainer}
      class="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      style="z-index: 1;"
    ></div>

    <!-- ── Top-Left Floating Live Status Pill ──────────────────────────────── -->
    <div class="absolute top-4 left-4 z-10 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[var(--bg-raised)]/85 border border-[var(--bg-rule)] text-xs font-semibold text-[var(--ink)] backdrop-blur-xl shadow-xl">
      <div class="flex items-center gap-2">
        <span class="relative flex h-2.5 w-2.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span class="font-bold tracking-tight">Kurs.World</span>
        <span class="text-[10px] text-[var(--ink-4)] font-normal">• 195+ {t('map.quickSelection')}</span>
      </div>
    </div>

    <!-- ── Top-Right Floating Controls Card ("Inputan di Kanan Atas") ─────── -->
    <div
      class="absolute top-4 right-4 z-20 w-[92vw] sm:w-[380px] max-w-sm bg-[var(--bg-raised)]/92 border border-[var(--bg-rule)] rounded-2xl shadow-2xl backdrop-blur-2xl p-4 transition-all duration-200"
      style="color: var(--ink);"
    >
      <!-- Panel Header & Collapse Toggle -->
      <div class="flex items-center justify-between pb-3 border-b border-[var(--bg-rule)]">
        <div class="flex items-center gap-2">
          <SlidersHorizontal class="w-4 h-4 text-sky-400" />
          <span class="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">{t('map.countryInspector')}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            onclick={handleResetView}
            class="p-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-rule)] text-[var(--ink-3)] hover:text-[var(--ink)] transition text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
            title="Reset Zoom & Center"
          >
            <RotateCcw class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onclick={() => (isControlsCollapsed = !isControlsCollapsed)}
            class="p-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-rule)] text-[var(--ink-3)] hover:text-[var(--ink)] transition cursor-pointer"
            aria-label="Toggle Panel"
          >
            {#if isControlsCollapsed}
              <ChevronDown class="w-4 h-4" />
            {:else}
              <ChevronUp class="w-4 h-4" />
            {/if}
          </button>
        </div>
      </div>

      {#if !isControlsCollapsed}
        <div class="mt-3.5 space-y-3.5">
          <!-- 1. Search Autocomplete Bar with Live Filtering -->
          <div class="relative" bind:this={searchContainerRef}>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-4)]">
                <Search class="w-3.5 h-3.5" />
              </div>
              <input
                bind:this={searchInputRef}
                type="text"
                bind:value={searchQuery}
                oninput={(e) => {
                  searchQuery = (e.target as HTMLInputElement).value;
                  isSearchDropdownOpen = true;
                  highlightedIndex = 0;
                }}
                onfocus={() => {
                  isSearchDropdownOpen = true;
                }}
                onkeydown={handleSearchKeyDown}
                placeholder={t('map.searchPlaceholder')}
                class="w-full bg-[var(--bg-subtle)] border border-[var(--bg-rule)] hover:border-[var(--ink-4)] focus:border-sky-500 rounded-xl pl-9 pr-8 py-2 text-xs text-[var(--ink)] placeholder:text-[var(--ink-4)] outline-none transition shadow-inner font-medium"
              />
              {#if searchQuery}
                <button
                  type="button"
                  onclick={() => { searchQuery = ''; searchInputRef?.focus(); }}
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--ink-4)] hover:text-[var(--ink)] cursor-pointer"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              {/if}
            </div>

            <!-- Autocomplete Suggestions Dropdown -->
            {#if isSearchDropdownOpen}
              <div class="absolute top-full left-0 right-0 mt-2 z-50 bg-[var(--bg-raised)] border border-[var(--bg-rule)] rounded-xl shadow-2xl backdrop-blur-2xl max-h-64 overflow-y-auto divide-y divide-[var(--bg-rule)] scrollbar-thin">
                {#if searchResults.length > 0}
                  <div class="px-3 py-1.5 text-[10px] font-bold text-[var(--ink-4)] uppercase tracking-wider bg-[var(--bg-subtle)] flex items-center justify-between">
                    <span>{searchQuery ? `${searchResults.length} Negara Ditemukan` : 'Rekomendasi Negara'}</span>
                    <span class="text-[9px] text-sky-400 font-normal">Tekan Enter ↵</span>
                  </div>
                  {#each searchResults as item, index}
                    {@const isHighlighted = highlightedIndex === index}
                    <button
                      type="button"
                      onclick={() => handleSelectFromSearch(item)}
                      class={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2.5 transition cursor-pointer group ${
                        isHighlighted ? 'bg-sky-500/20 text-sky-200' : 'hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      <div class="flex items-center gap-2.5 min-w-0">
                        <span class="text-xl shrink-0">{item.flag}</span>
                        <div class="truncate">
                          <div class="text-xs font-bold text-[var(--ink)] group-hover:text-sky-400 transition flex items-center gap-1.5">
                            <span>{item.countryName}</span>
                            <span class="text-[9px] font-semibold px-1 py-0.2 rounded bg-[var(--bg-subtle)] text-[var(--ink-3)]">{item.currencyCode}</span>
                          </div>
                          <div class="text-[10px] text-[var(--ink-4)] truncate">
                            {item.currencyName} • {item.regionLabel}
                          </div>
                        </div>
                      </div>
                      <div class="text-right shrink-0">
                        <div class="text-xs font-bold text-emerald-400 font-mono">
                          {formatRupiah(item.middleRate, { showFraction: true })}
                        </div>
                        <div class={`text-[10px] font-semibold ${item.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatPercent(item.change24h)}
                        </div>
                      </div>
                    </button>
                  {/each}
                {:else}
                  <div class="px-4 py-5 text-center text-xs text-[var(--ink-4)]">
                    <Search class="w-5 h-5 mx-auto mb-1.5 opacity-40 text-sky-400" />
                    <p class="font-bold text-[var(--ink)]">Tidak ada negara ditemukan</p>
                    <p class="text-[11px] mt-0.5">Tidak ada hasil untuk "{searchQuery}"</p>
                  </div>
                {/if}
              </div>
            {/if}
          </div>

          <!-- 2. Metric Switcher Toggle -->
          <div class="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)]">
            <button
              type="button"
              onclick={() => toggleMetric('rate')}
              class={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeMetric === 'rate'
                  ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
              }`}
            >
              <Coins class="w-3.5 h-3.5" />
              <span>{t('map.modeRate')}</span>
            </button>
            <button
              type="button"
              onclick={() => toggleMetric('change')}
              class={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeMetric === 'change'
                  ? 'bg-indigo-500 text-white shadow-md font-extrabold'
                  : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
              }`}
            >
              <TrendingUp class="w-3.5 h-3.5" />
              <span>{t('map.modeChange')}</span>
            </button>
          </div>

          <!-- 3. Region Filter Selector (Scrollable Chips) -->
          <div class="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
            {#each REGION_FILTERS as reg}
              {@const isActive = activeRegion === reg.id}
              <button
                type="button"
                onclick={() => handleRegionSelect(reg.id)}
                class={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 cursor-pointer border ${
                  isActive
                    ? 'bg-sky-500/20 border-sky-500/60 text-sky-300 ring-1 ring-sky-500/40'
                    : 'bg-[var(--bg-subtle)] border-[var(--bg-rule)] text-[var(--ink-3)] hover:text-[var(--ink)]'
                }`}
              >
                <span>{reg.emoji}</span>
                <span>{reg.label}</span>
              </button>
            {/each}
          </div>

          <!-- 4. Quick Mini Converter Box -->
          <div class="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)] space-y-2">
            <div class="flex items-center justify-between text-[11px] text-[var(--ink-4)] font-semibold">
              <span class="flex items-center gap-1 text-[var(--ink)]">
                <Calculator class="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('converter.title')}</span>
              </span>
              <button
                type="button"
                onclick={toggleConvertDirection}
                class="hover:text-sky-400 flex items-center gap-1 transition cursor-pointer"
              >
                <ArrowRightLeft class="w-3 h-3" />
                <span>{convertDirection === 'foreign_to_idr' ? `${selectedCountry.currencyCode} ➔ IDR` : `IDR ➔ ${selectedCountry.currencyCode}`}</span>
              </button>
            </div>

            <!-- Input & Live Result Row -->
            <div class="flex items-center gap-2">
              <div class="relative flex-1">
                <input
                  type="number"
                  bind:value={convertAmount}
                  min="1"
                  step="any"
                  class="w-full bg-[var(--bg-raised)] border border-[var(--bg-rule)] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[var(--ink)] outline-none focus:border-sky-500 font-mono"
                />
                <span class="absolute right-2 top-1.5 text-[10px] text-[var(--ink-4)] font-bold">
                  {convertDirection === 'foreign_to_idr' ? selectedCountry.currencyCode : 'IDR'}
                </span>
              </div>
              <div class="flex-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 text-right truncate font-mono">
                {calculatedConvertResult.formatted}
              </div>
            </div>

            <!-- Inspect Selected Country Action Button -->
            <button
              type="button"
              onclick={() => (isInspectorOpen = true)}
              class="w-full py-2 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{selectedCountry.flag} {t('map.inspectCountry')}: {selectedCountry.countryName}</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      {/if}
    </div>

    <!-- ── Interactive Slide-Over Country Inspector Drawer ────────────────── -->
    {#if isInspectorOpen && selectedCountry}
      {@const curr = selectedCountry}
      {@const isPositive = curr.change24h >= 0}

      <!-- Backdrop -->
      <div
        role="button"
        tabindex="0"
        aria-label={t('common.close')}
        onclick={handleCloseInspector}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCloseInspector(); }}
        class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
      ></div>

      <!-- Slide-Over Drawer Panel -->
      <aside
        aria-label={t('map.countryInspector')}
        class="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md md:max-w-lg bg-[var(--bg-raised)] border-l border-[var(--bg-rule)] shadow-2xl backdrop-blur-2xl p-5 sm:p-6 overflow-y-auto transform transition-transform duration-300 flex flex-col justify-between space-y-5"
        style="color: var(--ink);"
      >
        <div class="space-y-5">
          <!-- Inspector Header -->
          <div class="flex items-start justify-between gap-3 border-b border-[var(--bg-rule)] pb-4">
            <div class="flex items-center gap-3">
              <span class="text-4xl">{curr.flag}</span>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-xl font-bold text-[var(--ink)]">
                    {curr.countryName}
                  </h3>
                  <span class="text-xs font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    {curr.currencyCode}
                  </span>
                </div>
                <p class="text-xs text-[var(--ink-4)] mt-0.5">
                  {curr.currencyName} • {curr.regionLabel}
                </p>
              </div>
            </div>

            <button
              type="button"
              onclick={handleCloseInspector}
              class="p-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-rule)] text-[var(--ink-3)] hover:text-[var(--ink)] transition cursor-pointer"
              aria-label={t('common.close')}
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Key Rate Statistics Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div class="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)]">
              <span class="text-[10px] uppercase font-bold text-[var(--ink-4)]">{t('matrix.table.midRate')}</span>
              <div class="text-base font-extrabold text-emerald-400 mt-0.5 font-mono">
                {formatRupiah(curr.middleRate, { showFraction: true })}
              </div>
            </div>

            <div class="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)]">
              <span class="text-[10px] uppercase font-bold text-[var(--ink-4)]">{t('matrix.table.change24h')}</span>
              <div class={`text-base font-extrabold mt-0.5 flex items-center gap-1 font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {#if isPositive}
                  <TrendingUp class="w-4 h-4" />
                {:else}
                  <TrendingDown class="w-4 h-4" />
                {/if}
                <span>{formatPercent(curr.change24h)}</span>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)] col-span-2 sm:col-span-1">
              <span class="text-[10px] uppercase font-bold text-[var(--ink-4)]">Spread</span>
              <div class="text-base font-bold text-sky-400 mt-0.5 font-mono">
                {formatRupiah(curr.spread)}
              </div>
            </div>
          </div>

          <!-- Google Finance-Style Trend Chart Mini -->
          <div class="border border-[var(--bg-rule)] rounded-2xl bg-[var(--bg-subtle)] p-3">
            <GoogleRateChart
              initialCurrency={curr.currencyCode}
              showCurrencySelector={false}
            />
          </div>

          <!-- Quick Converter in Inspector -->
          <div class="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)] space-y-3">
            <div class="flex items-center justify-between text-xs font-bold text-[var(--ink)]">
              <span>{t('converter.title')} ({curr.currencyCode} ↔ IDR)</span>
              <button
                type="button"
                onclick={toggleConvertDirection}
                class="text-sky-400 hover:text-sky-300 flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <ArrowRightLeft class="w-3 h-3" />
                <span>{convertDirection === 'foreign_to_idr' ? `${curr.currencyCode} ➔ IDR` : `IDR ➔ ${curr.currencyCode}`}</span>
              </button>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <input
                type="number"
                bind:value={convertAmount}
                min="1"
                class="w-full bg-[var(--bg-raised)] border border-[var(--bg-rule)] rounded-xl px-3 py-2 text-sm font-bold text-[var(--ink)] font-mono outline-none focus:border-sky-500"
              />
              <div class="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm font-bold text-emerald-400 flex items-center justify-end font-mono truncate">
                {calculatedConvertResult.formatted}
              </div>
            </div>

            <!-- Preset Nominals -->
            <div class="flex items-center gap-1.5 flex-wrap pt-1">
              {#each PRESET_AMOUNTS as preset}
                <button
                  type="button"
                  onclick={() => setPresetAmount(preset)}
                  class={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border cursor-pointer ${
                    convertAmount === preset
                      ? 'bg-sky-500 text-slate-950 border-sky-400'
                      : 'bg-[var(--bg-raised)] border-[var(--bg-rule)] text-[var(--ink-3)] hover:text-[var(--ink)]'
                  }`}
                >
                  {preset.toLocaleString('id-ID')}
                </button>
              {/each}
            </div>
          </div>
        </div>

        <!-- Drawer Footer -->
        <div class="pt-4 border-t border-[var(--bg-rule)] flex items-center justify-between text-xs text-[var(--ink-4)]">
          <span>🕒 {formatDateTimeIndo(new Date())}</span>
          <button
            type="button"
            onclick={handleCloseInspector}
            class="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-rule)] text-[var(--ink)] font-bold transition cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </aside>
    {/if}

  </div>
{/if}
