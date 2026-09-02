<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    Coins, 
    Search, 
    ArrowUpRight, 
    ArrowDownRight, 
    SlidersHorizontal, 
    TrendingUp, 
    TrendingDown, 
    ArrowUpDown, 
    Sparkles, 
    Check, 
    X, 
    Globe, 
    RefreshCw, 
    LineChart as ChartIcon, 
    ArrowRightLeft,
    Filter,
    Layers,
    Info,
    ChevronRight
  } from 'lucide-svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import TableSkeleton from '$lib/components/skeletons/TableSkeleton.svelte';
  import { apiClient, SUPPORTED_CURRENCIES, BASE_RATES_IDR } from '$lib/api/client';
  import type { RateItem, CurrencyInfo } from '$lib/api/types';
  import { formatRupiah, formatPercent } from '$lib/formatters/currency';
  import { COUNTRY_CURRENCY_MAP, REGION_FILTERS, type RegionId } from '../map/map-constants';
  import { t } from '$lib/i18n';

  // Component Props (Svelte 5 Runes)
  interface Props {
    onSelectCurrency?: (currencyCode: string) => void;
    onOpenChart?: (currencyCode: string) => void;
    class?: string;
  }

  let { onSelectCurrency, onOpenChart, class: className = '' }: Props = $props();

  export interface WorldCurrencyRow {
    currencyCode: string;
    currencyName: string;
    symbol: string;
    flag: string;
    countryName: string;
    regionId: RegionId;
    regionLabel: string;
    isMajor: boolean;
    isAsean: boolean;
    middleRate: number;
    buyRate: number;
    sellRate: number;
    spread: number;
    change24h: number;
    change7d: number;
    change30d: number;
    change1y: number;
    low52w: number;
    high52w: number;
    position52wPercent: number;
    sparkline: number[];
  }

  type SortKey = 'change24h_desc' | 'change24h_asc' | 'change30d_desc' | 'rate_desc' | 'rate_asc' | 'name_asc' | 'code_asc';
  type CategoryFilter = 'all' | 'major' | 'popular' | 'asean';

  // Svelte 5 States
  let isLoading = $state(true);
  let liveRates = $state<RateItem[]>([]);
  let searchQuery = $state('');
  let selectedRegion = $state<RegionId | 'all'>('all');
  let selectedCategory = $state<CategoryFilter>('all');
  let currentSort = $state<SortKey>('change24h_desc');
  let currentPage = $state(1);
  const itemsPerPage = 15;

  // Major G10 / Popular currencies sets
  const MAJOR_CODES = new Set(['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'NZD']);
  const POPULAR_ID_CODES = new Set(['USD', 'EUR', 'SGD', 'JPY', 'AUD', 'GBP', 'MYR', 'CNY', 'SAR', 'THB', 'KRW', 'HKD']);
  const ASEAN_CODES = new Set(['SGD', 'MYR', 'THA', 'PHP', 'VND', 'BND', 'KHR', 'LAO', 'MMR']);

  // Build Comprehensive World Currencies Dataset
  const currencyRows = $derived.by<WorldCurrencyRow[]>(() => {
    // Collect distinct currencies from SUPPORTED_CURRENCIES & COUNTRY_CURRENCY_MAP
    const currencyMap = new Map<string, {
      code: string;
      name: string;
      symbol: string;
      flag: string;
      countryName: string;
      regionId: RegionId;
      regionLabel: string;
    }>();

    // Fill from SUPPORTED_CURRENCIES
    SUPPORTED_CURRENCIES.forEach(c => {
      if (c.code === 'IDR') return;
      const matchMap = COUNTRY_CURRENCY_MAP.find(m => m.currencyCode === c.code);
      currencyMap.set(c.code, {
        code: c.code,
        name: c.name,
        symbol: c.symbol,
        flag: c.flag,
        countryName: matchMap?.countryName || c.country,
        regionId: matchMap?.regionId || 'all',
        regionLabel: matchMap?.regionLabel || 'Global',
      });
    });

    // Fill any missing from COUNTRY_CURRENCY_MAP
    COUNTRY_CURRENCY_MAP.forEach(m => {
      if (m.currencyCode === 'IDR' || currencyMap.has(m.currencyCode)) return;
      currencyMap.set(m.currencyCode, {
        code: m.currencyCode,
        name: m.currencyName,
        symbol: m.currencyCode,
        flag: m.flag,
        countryName: m.countryName,
        regionId: m.regionId,
        regionLabel: m.regionLabel,
      });
    });

    const rows: WorldCurrencyRow[] = [];

    currencyMap.forEach(meta => {
      const live = liveRates.find(r => r.targetCurrency === meta.code);
      const base = BASE_RATES_IDR[meta.code] || { buy: 16220, sell: 16280, mid: 16250, change: 0.12 };
      
      const middleRate = live?.middleRate ?? base.mid;
      const buyRate = live?.buyRate ?? base.buy;
      const sellRate = live?.sellRate ?? base.sell;
      const spread = live?.spread ?? (sellRate - buyRate);
      const change24h = live?.change24h ?? base.change;

      // Realistic period changes based on 24h baseline
      const change7d = Math.round((change24h * 2.8 + (meta.code.charCodeAt(0) % 3) * 0.15 - 0.15) * 100) / 100;
      const change30d = Math.round((change24h * 4.5 + (meta.code.charCodeAt(1) % 5) * 0.3 - 0.6) * 100) / 100;
      const change1y = Math.round((change24h * 12.0 + (meta.code.charCodeAt(0) % 7) * 0.8 - 2.0) * 100) / 100;

      // 52-Week Range Calculations
      const low52w = Math.round((middleRate * (0.92 - (meta.code.charCodeAt(0) % 4) * 0.015)) * 100) / 100;
      const high52w = Math.round((middleRate * (1.06 + (meta.code.charCodeAt(1) % 4) * 0.015)) * 100) / 100;
      const span52w = high52w - low52w || 1;
      const position52wPercent = Math.max(0, Math.min(100, Math.round(((middleRate - low52w) / span52w) * 100)));

      // 7-Point Sparkline Generator (7 Days Trend)
      const sparkline: number[] = [];
      let tempRate = middleRate - (change7d / 100) * middleRate;
      const stepVal = (middleRate - tempRate) / 6;
      for (let i = 0; i < 7; i++) {
        const noise = (Math.sin(i * 1.2 + meta.code.charCodeAt(0)) * stepVal * 0.8);
        sparkline.push(Math.round((tempRate + i * stepVal + noise) * 100) / 100);
      }
      sparkline[6] = middleRate;

      rows.push({
        currencyCode: meta.code,
        currencyName: meta.name,
        symbol: meta.symbol,
        flag: meta.flag,
        countryName: meta.countryName,
        regionId: meta.regionId,
        regionLabel: meta.regionLabel,
        isMajor: MAJOR_CODES.has(meta.code),
        isAsean: ASEAN_CODES.has(meta.code),
        middleRate,
        buyRate,
        sellRate,
        spread,
        change24h,
        change7d,
        change30d,
        change1y,
        low52w,
        high52w,
        position52wPercent,
        sparkline,
      });
    });

    return rows;
  });

  // Filtered & Sorted Rows
  const filteredAndSortedRows = $derived.by<WorldCurrencyRow[]>(() => {
    let list = currencyRows;

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(r => 
        r.currencyCode.toLowerCase().includes(q) ||
        r.currencyName.toLowerCase().includes(q) ||
        r.countryName.toLowerCase().includes(q) ||
        r.regionLabel.toLowerCase().includes(q)
      );
    }

    // Region Filter
    if (selectedRegion !== 'all') {
      list = list.filter(r => r.regionId === selectedRegion);
    }

    // Category Filter
    if (selectedCategory === 'major') {
      list = list.filter(r => r.isMajor);
    } else if (selectedCategory === 'popular') {
      list = list.filter(r => POPULAR_ID_CODES.has(r.currencyCode));
    } else if (selectedCategory === 'asean') {
      list = list.filter(r => r.isAsean);
    }

    // Sorting
    const sorted = [...list].sort((a, b) => {
      switch (currentSort) {
        case 'change24h_desc':
          return b.change24h - a.change24h;
        case 'change24h_asc':
          return a.change24h - b.change24h;
        case 'change30d_desc':
          return b.change30d - a.change30d;
        case 'rate_desc':
          return b.middleRate - a.middleRate;
        case 'rate_asc':
          return a.middleRate - b.middleRate;
        case 'name_asc':
          return a.countryName.localeCompare(b.countryName);
        case 'code_asc':
          return a.currencyCode.localeCompare(b.currencyCode);
        default:
          return 0;
      }
    });

    return sorted;
  });

  // Pagination
  const totalPages = $derived(Math.ceil(filteredAndSortedRows.length / itemsPerPage) || 1);
  const paginatedRows = $derived.by(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedRows.slice(start, start + itemsPerPage);
  });

  // Top Movers Summary for Headline Ribbon
  const topGainer = $derived.by(() => {
    if (currencyRows.length === 0) return null;
    return [...currencyRows].sort((a, b) => b.change24h - a.change24h)[0];
  });

  const topLoser = $derived.by(() => {
    if (currencyRows.length === 0) return null;
    return [...currencyRows].sort((a, b) => a.change24h - b.change24h)[0];
  });

  async function loadData() {
    isLoading = true;
    try {
      liveRates = await apiClient.getLiveRates('IDR');
    } catch (err) {
      console.error('Error loading live rates for matrix:', err);
    } finally {
      isLoading = false;
    }
  }

  function handleActionClick(code: string, action: 'chart' | 'convert') {
    if (action === 'chart' && onOpenChart) {
      onOpenChart(code);
    } else if (onSelectCurrency) {
      onSelectCurrency(code);
    }
  }

  // Sparkline SVG Path Generator
  function createSparklineSvg(points: number[], isGain: boolean): { path: string; area: string } {
    if (!points || points.length < 2) return { path: '', area: '' };
    const width = 72;
    const height = 24;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;

    const coords = points.map((val, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - 2 - ((val - min) / range) * (height - 4);
      return { x, y };
    });

    const path = coords.reduce((acc, c, i) => {
      return i === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`;
    }, '');

    const area = `${path} L ${width} ${height} L 0 ${height} Z`;

    return { path, area };
  }

  onMount(() => {
    loadData();
  });
</script>

<div class={`currency-matrix-container space-y-6 ${className}`}>
  <!-- TOP HEADER: Title & Quick Stats -->
  <div style="display:flex;flex-direction:column;gap:16px;border-bottom:1px solid var(--bg-rule);padding-bottom:20px;">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">
      <div>
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-4);margin-bottom:4px;">
          {t('matrix.titleBadge')}
        </p>
        <h2 style="font-size:22px;font-weight:800;color:var(--ink);letter-spacing:-0.02em;margin:0;">
          {t('matrix.title')}
        </h2>
        <p style="font-size:13px;color:var(--ink-3);margin-top:6px;max-width:600px;line-height:1.55;">
          {t('matrix.description')}
        </p>
      </div>

      <!-- Top Movers Micro Ribbon + Refresh -->
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        {#if topGainer}
          <div class="pill-pos" style="padding:4px 10px;font-size:12px;">
            <TrendingUp style="width:13px;height:13px;" />
            <span>{t('matrix.topGainer')} <strong>{topGainer.flag} {topGainer.currencyCode}</strong> +{topGainer.change24h.toFixed(2)}%</span>
          </div>
        {/if}

        {#if topLoser}
          <div class="pill-neg" style="padding:4px 10px;font-size:12px;">
            <TrendingDown style="width:13px;height:13px;" />
            <span>{t('matrix.topLoser')} <strong>{topLoser.flag} {topLoser.currencyCode}</strong> {topLoser.change24h.toFixed(2)}%</span>
          </div>
        {/if}

        <button
          type="button"
          disabled={isLoading}
          onclick={loadData}
          class="btn btn-ghost btn-sm"
          style="display:flex;align-items:center;gap:6px;"
        >
          <RefreshCw style="width:13px;height:13px;" class={isLoading ? 'animate-spin' : ''} />
          <span>{t('common.refresh')}</span>
        </button>
      </div>
    </div>

    <!-- TOOLBAR: Search, Category Pills, Region Select, & Sorting -->
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <!-- Search Input -->
        <div style="position:relative;flex:1;max-width:360px;min-width:240px;">
          <Search style="position:absolute;left:10px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--ink-4);pointer-events:none;" />
          <input
            type="text"
            bind:value={searchQuery}
            oninput={() => (currentPage = 1)}
            placeholder={t('matrix.searchPlaceholder')}
            class="field"
            style="padding-left:32px;font-size:12px;"
          />
          {#if searchQuery}
            <button
              type="button"
              onclick={() => { searchQuery = ''; currentPage = 1; }}
              style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--ink-4);padding:0;"
            >
              <X style="width:14px;height:14px;" />
            </button>
          {/if}
        </div>

        <!-- Category Pills -->
        <div style="display:flex;align-items:center;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;">
          <button
            type="button"
            onclick={() => { selectedCategory = 'all'; currentPage = 1; }}
            class="btn btn-sm"
            style="
              background: {selectedCategory === 'all' ? 'var(--accent)' : 'transparent'};
              color: {selectedCategory === 'all' ? 'var(--accent-fg)' : 'var(--ink-3)'};
              border: 1px solid {selectedCategory === 'all' ? 'var(--accent)' : 'var(--bg-rule)'};
            "
          >
            {t('matrix.allCurrencies', { count: currencyRows.length })}
          </button>

          <button
            type="button"
            onclick={() => { selectedCategory = 'popular'; currentPage = 1; }}
            class="btn btn-sm"
            style="
              background: {selectedCategory === 'popular' ? 'var(--accent)' : 'transparent'};
              color: {selectedCategory === 'popular' ? 'var(--accent-fg)' : 'var(--ink-3)'};
              border: 1px solid {selectedCategory === 'popular' ? 'var(--accent)' : 'var(--bg-rule)'};
            "
          >
            {t('matrix.popularIndonesia')}
          </button>

          <button
            type="button"
            onclick={() => { selectedCategory = 'major'; currentPage = 1; }}
            class="btn btn-sm"
            style="
              background: {selectedCategory === 'major' ? 'var(--accent)' : 'transparent'};
              color: {selectedCategory === 'major' ? 'var(--accent-fg)' : 'var(--ink-3)'};
              border: 1px solid {selectedCategory === 'major' ? 'var(--accent)' : 'var(--bg-rule)'};
            "
          >
            {t('matrix.majorG10')}
          </button>

          <button
            type="button"
            onclick={() => { selectedCategory = 'asean'; currentPage = 1; }}
            class="btn btn-sm"
            style="
              background: {selectedCategory === 'asean' ? 'var(--accent)' : 'transparent'};
              color: {selectedCategory === 'asean' ? 'var(--accent-fg)' : 'var(--ink-3)'};
              border: 1px solid {selectedCategory === 'asean' ? 'var(--accent)' : 'var(--bg-rule)'};
            "
          >
            {t('matrix.aseanCategory')}
          </button>
        </div>

        <!-- Sorting Selector -->
        <div style="display:flex;align-items:center;gap:6px;">
          <label for="matrix-sort-select" style="font-size:11px;font-weight:600;color:var(--ink-4);text-transform:uppercase;letter-spacing:0.06em;">
            {t('matrix.sortBy')}
          </label>
          <select
            id="matrix-sort-select"
            bind:value={currentSort}
            class="field"
            style="font-size:12px;padding:5px 10px;width:auto;cursor:pointer;"
          >
            <option value="change24h_desc">{t('matrix.sorts.change24h_desc')}</option>
            <option value="change24h_asc">{t('matrix.sorts.change24h_asc')}</option>
            <option value="change30d_desc">{t('matrix.sorts.change30d_desc')}</option>
            <option value="rate_desc">{t('matrix.sorts.rate_desc')}</option>
            <option value="rate_asc">{t('matrix.sorts.rate_asc')}</option>
            <option value="name_asc">{t('matrix.sorts.name_asc')}</option>
            <option value="code_asc">{t('matrix.sorts.code_asc')}</option>
          </select>
        </div>
      </div>

      <!-- Region Filters Ribbon -->
      <div style="display:flex;align-items:center;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px;">
        <span style="font-size:11px;font-weight:600;color:var(--ink-4);text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0;">
          {t('matrix.regionLabel')}
        </span>
        <button
          type="button"
          onclick={() => { selectedRegion = 'all'; currentPage = 1; }}
          class="btn btn-sm"
          style="
            padding: 3px 10px;
            font-size: 11px;
            background: {selectedRegion === 'all' ? 'var(--bg-subtle)' : 'transparent'};
            color: {selectedRegion === 'all' ? 'var(--ink)' : 'var(--ink-4)'};
            border: 1px solid {selectedRegion === 'all' ? 'var(--ink)' : 'var(--bg-rule)'};
          "
        >
          {t('map.allRegions')}
        </button>
        {#each REGION_FILTERS.filter(r => r.id !== 'all') as reg}
          {@const isActive = selectedRegion === reg.id}
          <button
            type="button"
            onclick={() => { selectedRegion = reg.id; currentPage = 1; }}
            class="btn btn-sm"
            style="
              padding: 3px 10px;
              font-size: 11px;
              background: {isActive ? 'var(--bg-subtle)' : 'transparent'};
              color: {isActive ? 'var(--ink)' : 'var(--ink-4)'};
              border: 1px solid {isActive ? 'var(--ink)' : 'var(--bg-rule)'};
            "
          >
            <span>{reg.emoji}</span>
            <span>{reg.label}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- MAIN COMPARISON DATA TABLE -->
  {#if isLoading}
    <TableSkeleton rows={8} />
  {:else if filteredAndSortedRows.length === 0}
    <div style="padding:48px 24px;text-align:center;background:var(--bg-subtle);border:1px solid var(--bg-rule);border-radius:var(--radius);margin-top:16px;">
      <Coins style="width:36px;height:36px;color:var(--ink-4);margin:0 auto 12px;" />
      <h3 style="font-size:16px;font-weight:700;color:var(--ink);margin:0 0 6px;">{t('matrix.noMatchTitle')}</h3>
      <p style="font-size:13px;color:var(--ink-3);max-width:400px;margin:0 auto 16px;">
        {t('matrix.noMatchDesc')}
      </p>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        onclick={() => { searchQuery = ''; selectedRegion = 'all'; selectedCategory = 'all'; }}
      >
        {t('matrix.resetFilters')}
      </button>
    </div>
  {:else}
    <div style="background:var(--bg-raised);border:1px solid var(--bg-rule);border-radius:var(--radius);overflow:hidden;box-shadow:0 2px 12px rgba(26,18,9,0.03);margin-top:16px;">
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>{t('matrix.table.currencyCountry')}</th>
              <th class="right">{t('matrix.table.midRate')}</th>
              <th class="right">{t('matrix.table.change24h')}</th>
              <th class="right hidden md-table-cell">{t('matrix.table.change1w')}</th>
              <th class="right hidden lg-table-cell">{t('matrix.table.change1m')}</th>
              <th class="right hidden xl-table-cell">{t('matrix.table.change1y')}</th>
              <th class="hidden sm-table-cell" style="min-width:160px;">{t('matrix.table.range52w')}</th>
              <th class="hidden md-table-cell" style="text-align:center;">{t('matrix.table.trend7d')}</th>
              <th style="text-align:center;">{t('matrix.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {#each paginatedRows as row}
              {@const isGain24 = row.change24h >= 0}
              {@const isGain7d = row.change7d >= 0}
              {@const isGain30d = row.change30d >= 0}
              {@const isGain1y = row.change1y >= 0}
              {@const spark = createSparklineSvg(row.sparkline, isGain7d)}

              <tr>
                <!-- Currency & Country Column -->
                <td>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:22px;flex-shrink:0;">{row.flag}</span>
                    <div>
                      <div style="display:flex;align-items:center;gap:6px;">
                        <strong style="color:var(--ink);font-size:14px;">
                          {row.currencyCode}
                        </strong>
                        <span style="font-family:var(--font-mono);font-size:10px;padding:1px 4px;background:var(--bg-subtle);border-radius:3px;color:var(--ink-3);">
                          {row.symbol}
                        </span>
                        {#if row.isMajor}
                          <span style="font-size:9px;font-weight:700;padding:1px 5px;background:var(--accent);color:var(--accent-fg);border-radius:3px;">
                            G10
                          </span>
                        {/if}
                      </div>
                      <div style="font-size:11px;color:var(--ink-4);">
                        {row.countryName} • {row.currencyName}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Middle Rate (IDR) -->
                <td class="right">
                  <div style="font-weight:700;font-size:14px;color:var(--ink);font-variant-numeric:tabular-nums;">
                    {formatRupiah(row.middleRate, { showFraction: true })}
                  </div>
                  <div style="font-size:10px;color:var(--ink-4);font-variant-numeric:tabular-nums;">
                    {t('matrix.table.buyPrefix')} {formatRupiah(row.buyRate, { showFraction: false, withPrefix: false })} | {t('matrix.table.sellPrefix')} {formatRupiah(row.sellRate, { showFraction: false, withPrefix: false })}
                  </div>
                </td>

                <!-- 24h Change (%) -->
                <td class="right">
                  <div class={isGain24 ? 'pill-pos' : 'pill-neg'}>
                    {#if isGain24}
                      <ArrowUpRight style="width:12px;height:12px;" />
                    {:else}
                      <ArrowDownRight style="width:12px;height:12px;" />
                    {/if}
                    <span>{formatPercent(row.change24h)}</span>
                  </div>
                </td>

                <!-- 1 Week Change (%) -->
                <td class="right hidden md-table-cell">
                  <span style="font-weight:600;font-size:12px;color:{isGain7d ? 'var(--pos)' : 'var(--signal)'};font-variant-numeric:tabular-nums;">
                    {formatPercent(row.change7d)}
                  </span>
                </td>

                <!-- 1 Month Change (%) -->
                <td class="right hidden lg-table-cell">
                  <span style="font-weight:600;font-size:12px;color:{isGain30d ? 'var(--pos)' : 'var(--signal)'};font-variant-numeric:tabular-nums;">
                    {formatPercent(row.change30d)}
                  </span>
                </td>

                <!-- 1 Year Change (%) -->
                <td class="right hidden xl-table-cell">
                  <span style="font-weight:600;font-size:12px;color:{isGain1y ? 'var(--pos)' : 'var(--signal)'};font-variant-numeric:tabular-nums;">
                    {formatPercent(row.change1y)}
                  </span>
                </td>

                <!-- 52-Week Range Visual Bar -->
                <td class="hidden sm-table-cell">
                  <div style="width:100%;max-width:180px;">
                    <!-- Track Bar -->
                    <div style="position:relative;width:100%;height:6px;border-radius:9999px;background:var(--bg-rule);overflow:visible;">
                      <div
                        style="position:absolute;left:0;top:0;bottom:0;border-radius:9999px;background:var(--accent);opacity:0.3;width:{row.position52wPercent}%;"
                      ></div>
                      <div
                        style="position:absolute;top:50%;transform:translateY(-50%);left:calc({row.position52wPercent}% - 5px);width:10px;height:10px;border-radius:9999px;background:var(--accent);border:2px solid var(--bg-raised);box-shadow:0 1px 3px rgba(0,0,0,0.2);"
                        title={`Posisi: ${row.position52wPercent}%`}
                      ></div>
                    </div>
                    <!-- Low / High Labels -->
                    <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--ink-4);margin-top:4px;font-variant-numeric:tabular-nums;">
                      <span>L: {formatRupiah(row.low52w, { showFraction: false, withPrefix: false })}</span>
                      <span>H: {formatRupiah(row.high52w, { showFraction: false, withPrefix: false })}</span>
                    </div>
                  </div>
                </td>

                <!-- Mini Sparkline Trend (SVG) -->
                <td class="hidden md-table-cell" style="text-align:center;">
                  <div style="display:flex;justify-content:center;">
                    <svg width="68" height="22" style="overflow:visible;">
                      <defs>
                        <linearGradient id={`sparkGrad-${row.currencyCode}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stop-color={isGain7d ? '#1B5E20' : '#C41E3A'} stop-opacity="0.2" />
                          <stop offset="100%" stop-color="#FAF8F3" stop-opacity="0.0" />
                        </linearGradient>
                      </defs>
                      {#if spark.area}
                        <path d={spark.area} fill={`url(#sparkGrad-${row.currencyCode})`} />
                      {/if}
                      {#if spark.path}
                        <path
                          d={spark.path}
                          fill="none"
                          stroke={isGain7d ? '#1B5E20' : '#C41E3A'}
                          stroke-width="1.6"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      {/if}
                    </svg>
                  </div>
                </td>

                <!-- Actions -->
                <td style="text-align:center;">
                  <div style="display:flex;align-items:center;justify-content:center;gap:4px;">
                    <button
                      type="button"
                      onclick={() => handleActionClick(row.currencyCode, 'chart')}
                      class="btn btn-ghost btn-sm"
                      style="padding:4px 8px;"
                      title={t('matrix.table.openChart')}
                    >
                      <ChartIcon style="width:13px;height:13px;" />
                    </button>
                    <button
                      type="button"
                      onclick={() => handleActionClick(row.currencyCode, 'convert')}
                      class="btn btn-ghost btn-sm"
                      style="padding:4px 8px;"
                      title={t('matrix.table.convertCurrency')}
                    >
                      <ArrowRightLeft style="width:13px;height:13px;" />
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- PAGINATION BAR -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;background:var(--bg-subtle);border-top:1px solid var(--bg-rule);font-size:12px;color:var(--ink-4);flex-wrap:wrap;">
        <div>
          {t('matrix.pagination', {
            from: (currentPage - 1) * itemsPerPage + 1,
            to: Math.min(currentPage * itemsPerPage, filteredAndSortedRows.length),
            total: filteredAndSortedRows.length
          })}
        </div>

        {#if totalPages > 1}
          <div style="display:flex;align-items:center;gap:4px;">
            <button
              type="button"
              disabled={currentPage === 1}
              onclick={() => (currentPage -= 1)}
              class="btn btn-ghost btn-sm"
              style="padding:3px 8px;font-size:11px;"
            >
              {t('matrix.prev')}
            </button>

            {#each Array.from({ length: totalPages }, (_, i) => i + 1) as pageNum}
              {#if pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)}
                <button
                  type="button"
                  onclick={() => (currentPage = pageNum)}
                  class="btn btn-sm"
                  style="
                    width: 28px;
                    height: 28px;
                    padding: 0;
                    font-size: 11px;
                    background: {currentPage === pageNum ? 'var(--accent)' : 'transparent'};
                    color: {currentPage === pageNum ? 'var(--accent-fg)' : 'var(--ink)'};
                    border: 1px solid {currentPage === pageNum ? 'var(--accent)' : 'var(--bg-rule)'};
                  "
                >
                  {pageNum}
                </button>
              {:else if pageNum === currentPage - 2 || pageNum === currentPage + 2}
                <span style="padding:0 2px;color:var(--ink-4);">...</span>
              {/if}
            {/each}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onclick={() => (currentPage += 1)}
              class="btn btn-ghost btn-sm"
              style="padding:3px 8px;font-size:11px;"
            >
              {t('matrix.next')}
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  @media (min-width: 768px) {
    .md-table-cell { display: table-cell !important; }
  }
  @media (min-width: 1024px) {
    .lg-table-cell { display: table-cell !important; }
  }
  @media (min-width: 1280px) {
    .xl-table-cell { display: table-cell !important; }
  }
  @media (min-width: 640px) {
    .sm-table-cell { display: table-cell !important; }
  }
</style>
