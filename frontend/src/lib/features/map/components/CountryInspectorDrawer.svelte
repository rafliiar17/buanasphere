<script lang="ts">
  import { 
    X, 
    TrendingUp, 
    TrendingDown, 
    Calculator, 
    Building2, 
    Clock, 
    ArrowRightLeft, 
    ExternalLink, 
    ArrowUpRight,
    Sparkles,
    ShieldCheck,
    Layers
  } from 'lucide-svelte';
  import { t } from '$lib/i18n';
  import { formatRupiah, formatPercent, formatDateTimeIndo, formatCurrency } from '$lib/formatters/currency';
  import type { MapCountryData } from '../map-constants';
  import type { MapStateStore } from '../mapState.svelte';
  import type { RateMatrixResponse } from '$lib/api/types';
  import GoogleRateChart from '../../chart/GoogleRateChart.svelte';

  const PRESET_AMOUNTS = [1, 10, 50, 100, 1000, 10000];

  const ISO3_TO_ISO2_MAP: Record<string, string> = {
    IDN: 'id', USA: 'us', JPN: 'jp', CHN: 'cn', GBR: 'gb', DEU: 'de', FRA: 'fr', SGP: 'sg',
    AUS: 'au', SAU: 'sa', MYS: 'my', THA: 'th', IND: 'in', BRA: 'br', ZAF: 'za', KOR: 'kr',
    CAN: 'ca', RUS: 'ru', ITA: 'it', ESP: 'es', TUR: 'tr', EGY: 'eg', ARE: 'ae', PHL: 'ph',
    VNM: 'vn', KAZ: 'kz', NLD: 'nl', CHE: 'ch', SWE: 'se', NOR: 'no', DNK: 'dk', POL: 'pl',
    MEX: 'mx', ARG: 'ar', CHL: 'cl', COL: 'co', PER: 'pe', NZL: 'nz', QAT: 'qa', KWD: 'kw',
    OMN: 'om', BHR: 'bh', JOR: 'jo', LBN: 'lb', IRQ: 'iq', ISR: 'il', IRN: 'ir', PAK: 'pk',
    BGD: 'bd', LKA: 'lk', NPL: 'np', MMR: 'mm', KHM: 'kh', LAO: 'la', BRN: 'bn', NGA: 'ng',
    KEN: 'ke', GHA: 'gh', MAR: 'ma', DZA: 'dz', TUN: 'tn', ETH: 'et', TZA: 'tz', UGA: 'ug',
    UKR: 'ua', ROU: 'ro', CZE: 'cz', GRC: 'gr', PRT: 'pt', BEL: 'be', AUT: 'at', IRL: 'ie',
    FIN: 'fi', HUN: 'hu', HRV: 'hr', BGR: 'bg', SRB: 'rs', SVK: 'sk', SVN: 'si', EST: 'ee',
    LVA: 'lv', LTU: 'lt', CYP: 'cy', ISL: 'is', LUX: 'lu', MLT: 'mt', GEO: 'ge', ARM: 'am',
    AZE: 'az', UZB: 'uz', TKM: 'tm', TJK: 'tj', KGZ: 'kg', MNG: 'mn', TWN: 'tw', HKG: 'hk',
    MAC: 'mo', FJI: 'fj', PNG: 'pg', SLB: 'sb', VUT: 'vu', WSM: 'ws', TON: 'to', SOM: 'so',
  };

  interface Props {
    selectedCountry: MapCountryData | null;
    mapState?: MapStateStore;
    bankMatrix?: RateMatrixResponse | null;
    isMatrixLoading?: boolean;
    onClose: () => void;
    onSelectCurrency?: (code: string) => void;
    onOpenFullConverter?: (code: string) => void;
    class?: string;
  }

  let {
    selectedCountry,
    mapState,
    bankMatrix = null,
    isMatrixLoading = false,
    onClose,
    onSelectCurrency,
    onOpenFullConverter,
    class: className = ''
  }: Props = $props();

  let localConvertAmount = $state<number>(100);
  let localConvertDirection = $state<'foreign_to_idr' | 'idr_to_foreign'>('foreign_to_idr');
  let flagImgError = $state<boolean>(false);

  // Sync with mapState if provided
  let effectiveAmount = $derived(mapState ? mapState.convertAmount : localConvertAmount);
  let effectiveDirection = $derived(mapState ? mapState.convertDirection : localConvertDirection);

  function handleSetAmount(amount: number) {
    if (mapState) {
      mapState.setConvertAmount(amount);
    } else {
      localConvertAmount = amount;
    }
  }

  function handleToggleDirection() {
    if (mapState) {
      mapState.toggleConvertDirection();
    } else {
      localConvertDirection = localConvertDirection === 'foreign_to_idr' ? 'idr_to_foreign' : 'foreign_to_idr';
    }
  }

  const calculatedResult = $derived.by(() => {
    if (!selectedCountry) return { value: 0, formatted: '0' };
    const mid = selectedCountry.middleRate || 1;
    const amount = effectiveAmount || 0;

    if (effectiveDirection === 'foreign_to_idr') {
      const val = amount * mid;
      return {
        value: val,
        formatted: formatRupiah(val, { showFraction: val % 1 !== 0, withPrefix: true })
      };
    } else {
      const val = amount / (mid || 1);
      return {
        value: val,
        formatted: formatCurrency(val, selectedCountry.currencyCode, { maxDecimals: 2 })
      };
    }
  });

  const iso2Code = $derived.by(() => {
    if (!selectedCountry) return '';
    return ISO3_TO_ISO2_MAP[selectedCountry.iso3] || selectedCountry.iso3.slice(0, 2).toLowerCase();
  });

  const flagSrc = $derived.by(() => {
    if (!iso2Code) return '';
    return `https://flagcdn.com/w80/${iso2Code}.png`;
  });
</script>

{#if selectedCountry}
  {@const curr = selectedCountry}
  {@const isPositive = curr.change24h >= 0}

  <aside
    aria-label={t('map.countryInspector')}
    class={`w-full md:w-[440px] lg:w-[480px] xl:w-[520px] h-[60vh] md:h-full shrink-0 border-t md:border-t-0 md:border-l border-[var(--bg-rule)] bg-[var(--bg-raised)]/98 backdrop-blur-2xl shadow-2xl flex flex-col justify-between p-5 md:p-6 overflow-y-auto z-30 transition-all duration-300 ease-out ${className}`}
    style="color: var(--ink);"
  >
    <div class="space-y-4">
      <!-- 1. Inspector Header -->
      <div class="flex items-start justify-between gap-3 border-b border-[var(--bg-rule)] pb-3.5">
        <div class="flex items-center gap-3 min-w-0">
          <div class="relative shrink-0 w-12 h-9 rounded-lg overflow-hidden border border-[var(--bg-rule)] shadow-sm flex items-center justify-center bg-[var(--bg-subtle)]">
            {#if !flagImgError && iso2Code}
              <img
                src={flagSrc}
                alt={`Bendera ${curr.countryName}`}
                class="w-full h-full object-cover"
                onerror={() => (flagImgError = true)}
              />
            {:else}
              <span class="text-3xl select-none">{curr.flag}</span>
            {/if}
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-lg md:text-xl font-bold text-[var(--ink)] truncate">
                {curr.countryName}
              </h3>
              <span class="text-xs font-bold px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/30">
                {curr.currencyCode}
              </span>
              <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--ink-4)]">
                {curr.iso3}
              </span>
            </div>
            <p class="text-xs text-[var(--ink-4)] mt-0.5 truncate">
              {curr.currencyName} • {curr.regionLabel}
            </p>
          </div>
        </div>

        <button
          type="button"
          onclick={onClose}
          class="p-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-rule)] text-[var(--ink-3)] hover:text-[var(--ink)] transition cursor-pointer shrink-0"
          aria-label={t('common.close')}
          title="Tutup Panel Inspector"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- 2. Key Live Rates Grid (Mid, Buy, Sell, Spread, 24h Trend) -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <div class="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)] flex flex-col justify-between">
          <span class="text-[10px] uppercase font-bold text-[var(--ink-4)]">{t('matrix.table.midRate')}</span>
          <div class="text-sm md:text-base font-extrabold text-emerald-400 mt-1 font-mono truncate">
            {formatRupiah(curr.middleRate, { showFraction: true })}
          </div>
        </div>

        <div class="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)] flex flex-col justify-between">
          <span class="text-[10px] uppercase font-bold text-[var(--ink-4)]">{t('matrix.table.change24h')}</span>
          <div class={`text-sm md:text-base font-extrabold mt-1 flex items-center gap-1 font-mono truncate ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {#if isPositive}
              <TrendingUp class="w-4 h-4 shrink-0" />
            {:else}
              <TrendingDown class="w-4 h-4 shrink-0" />
            {/if}
            <span>{formatPercent(curr.change24h)}</span>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)] col-span-2 sm:col-span-1 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold text-[var(--ink-4)]">Spread</span>
            <span class="text-[9px] text-[var(--ink-4)]">{formatPercent(curr.spreadPercent)}</span>
          </div>
          <div class="text-sm md:text-base font-bold text-sky-400 mt-1 font-mono truncate">
            {formatRupiah(curr.spread, { showFraction: true })}
          </div>
        </div>
      </div>

      <!-- Buy & Sell Rates Row -->
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)] flex items-center justify-between">
          <span class="text-[10px] font-bold text-[var(--ink-4)] uppercase">{t('matrix.table.buyRate')}</span>
          <span class="text-xs font-bold text-emerald-400 font-mono">{formatRupiah(curr.buyRate, { showFraction: true })}</span>
        </div>
        <div class="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)] flex items-center justify-between">
          <span class="text-[10px] font-bold text-[var(--ink-4)] uppercase">{t('matrix.table.sellRate')}</span>
          <span class="text-xs font-bold text-rose-400 font-mono">{formatRupiah(curr.sellRate, { showFraction: true })}</span>
        </div>
      </div>

      <!-- 3. Google Finance-Style Trend Chart Mini -->
      <div class="border border-[var(--bg-rule)] rounded-2xl bg-[var(--bg-subtle)] p-3">
        <GoogleRateChart
          initialCurrency={curr.currencyCode}
          showCurrencySelector={false}
          compact={true}
          onSelectCurrency={onSelectCurrency}
        />
      </div>

      <!-- 4. Quick Mini Converter Inside Drawer -->
      <div class="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)] space-y-2.5">
        <div class="flex items-center justify-between text-xs font-bold text-[var(--ink)]">
          <span class="flex items-center gap-1.5">
            <Calculator class="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('converter.title')} ({curr.currencyCode} ↔ IDR)</span>
          </span>
          <button
            type="button"
            onclick={handleToggleDirection}
            class="text-sky-400 hover:text-sky-300 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
          >
            <ArrowRightLeft class="w-3 h-3" />
            <span>{effectiveDirection === 'foreign_to_idr' ? `${curr.currencyCode} ➔ IDR` : `IDR ➔ ${curr.currencyCode}`}</span>
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={effectiveAmount}
            oninput={(e) => handleSetAmount(Number((e.target as HTMLInputElement).value) || 0)}
            min="1"
            class="w-full bg-[var(--bg-raised)] border border-[var(--bg-rule)] rounded-xl px-3 py-2 text-xs md:text-sm font-bold text-[var(--ink)] font-mono outline-none focus:border-sky-500"
          />
          <div class="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs md:text-sm font-bold text-emerald-400 flex items-center justify-end font-mono truncate">
            {calculatedResult.formatted}
          </div>
        </div>

        <!-- Preset Nominals -->
        <div class="flex items-center gap-1.5 flex-wrap pt-0.5">
          {#each PRESET_AMOUNTS as preset}
            <button
              type="button"
              onclick={() => handleSetAmount(preset)}
              class={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition border cursor-pointer ${
                effectiveAmount === preset
                  ? 'bg-sky-500 text-slate-950 border-sky-400'
                  : 'bg-[var(--bg-raised)] border-[var(--bg-rule)] text-[var(--ink-3)] hover:text-[var(--ink)]'
              }`}
            >
              {preset.toLocaleString('id-ID')}
            </button>
          {/each}
        </div>
      </div>

      <!-- 5. Bank Comparison Matrix (Local Commercial Banks: BCA, Mandiri, BI JISDOR, BRI) -->
      {#if isMatrixLoading}
        <div class="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)] space-y-2 animate-pulse">
          <div class="h-4 bg-[var(--bg-rule)] rounded w-1/3"></div>
          <div class="h-12 bg-[var(--bg-rule)] rounded-xl"></div>
          <div class="h-12 bg-[var(--bg-rule)] rounded-xl"></div>
        </div>
      {:else if bankMatrix && bankMatrix.rows && bankMatrix.rows.length > 0}
        <div class="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--bg-rule)] space-y-2.5">
          <div class="flex items-center justify-between text-xs font-bold text-[var(--ink)]">
            <span class="flex items-center gap-1.5">
              <Building2 class="w-3.5 h-3.5 text-sky-400" />
              <span>{t('map.bankComparison')}</span>
            </span>
            <span class="text-[10px] text-[var(--ink-4)] font-normal">
              {bankMatrix.rows.length} Bank
            </span>
          </div>

          <div class="divide-y divide-[var(--bg-rule)] text-[11px]">
            {#each bankMatrix.rows.slice(0, 4) as item}
              <div class="py-2 flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <div class="font-bold text-[var(--ink)] truncate flex items-center gap-1.5">
                    <span>{item.providerName}</span>
                    {#if item.isBestBuy}
                      <span class="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                        {t('map.bestBuy')}
                      </span>
                    {/if}
                    {#if item.isBestSell}
                      <span class="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold">
                        {t('map.bestSell')}
                      </span>
                    {/if}
                  </div>
                  <div class="text-[10px] text-[var(--ink-4)]">
                    Spread: {formatRupiah(item.spread, { showFraction: true })}
                  </div>
                </div>
                <div class="text-right shrink-0 font-mono">
                  <div class="text-xs font-bold text-emerald-400">
                    {formatRupiah(item.buyRate, { showFraction: true })}
                  </div>
                  <div class="text-[10px] text-[var(--ink-4)]">
                    Jual: {formatRupiah(item.sellRate, { showFraction: true })}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- 6. Full Converter CTA Button -->
      <a
        href={`/converter?from=${curr.currencyCode}&to=IDR`}
        onclick={(e) => {
          if (onOpenFullConverter) {
            e.preventDefault();
            onOpenFullConverter(curr.currencyCode);
          }
        }}
        class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 cursor-pointer text-center"
      >
        <Sparkles class="w-4 h-4 text-amber-300" />
        <span>Buka Kalkulator Multi-Bank Lengkap ({curr.currencyCode})</span>
        <ArrowUpRight class="w-4 h-4" />
      </a>
    </div>

    <!-- 7. Drawer Footer & Actions -->
    <div class="pt-3 border-t border-[var(--bg-rule)] flex items-center justify-between gap-2 text-xs text-[var(--ink-4)]">
      <div class="flex items-center gap-1.5 truncate">
        <Clock class="w-3.5 h-3.5 shrink-0" />
        <span class="truncate">{formatDateTimeIndo(new Date())}</span>
      </div>
      <button
        type="button"
        onclick={onClose}
        class="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-rule)] text-[var(--ink)] font-bold transition cursor-pointer shrink-0"
      >
        {t('common.close')}
      </button>
    </div>
  </aside>
{/if}
