<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    Bell, 
    X, 
    Check, 
    Globe, 
    LineChart, 
    TableProperties, 
    Calculator, 
    Sparkles, 
    Layers,
    ArrowLeft
  } from 'lucide-svelte';
  import Navbar from '$lib/components/Navbar.svelte';
  import WorldRateMap from '$lib/features/map/WorldRateMap.svelte';
  import GlobalMoversTicker from '$lib/features/map/GlobalMoversTicker.svelte';
  import CurrencyConverter from '$lib/features/converter/CurrencyConverter.svelte';
  import GoogleRateChart from '$lib/features/chart/GoogleRateChart.svelte';
  import CurrencyComparisonMatrix from '$lib/features/matrix/CurrencyComparisonMatrix.svelte';
  import RateCard from '$lib/features/card/RateCard.svelte';
  import { apiClient } from '$lib/api/client';
  import { t, subscribeLocale, getLocale, type SupportedLocale } from '$lib/i18n';

  let currentLang = $state<SupportedLocale>(getLocale());
  let activeView = $state<'map' | 'chart' | 'matrix' | 'converter' | 'cards'>('map');
  let converterFromCurrency = $state('USD');
  let isAlertModalOpen = $state(false);
  let alertEmail = $state('');
  let alertCurrency = $state('USD');
  let alertCondition = $state<'above' | 'below'>('below');
  let alertTargetRate = $state<number>(16200);
  let isAlertSubmitting = $state(false);
  let alertMessage = $state<string | null>(null);

  onMount(() => {
    const unsub = subscribeLocale((loc) => {
      currentLang = loc;
    });
    return unsub;
  });

  const viewOptions = $derived.by(() => {
    const _loc = currentLang;
    return [
      { id: 'map',       label: t('tabs.map', undefined, _loc),       icon: Globe },
      { id: 'chart',     label: t('tabs.chart', undefined, _loc),     icon: LineChart },
      { id: 'matrix',    label: t('tabs.matrix', undefined, _loc),    icon: TableProperties },
      { id: 'converter', label: t('tabs.converter', undefined, _loc), icon: Calculator },
      { id: 'cards',     label: t('tabs.cards', undefined, _loc),     icon: Sparkles },
    ];
  });

  function handleMapCurrencySelect(currencyCode: string) {
    converterFromCurrency = currencyCode;
  }

  function handleMatrixCurrencySelect(currencyCode: string) {
    converterFromCurrency = currencyCode;
    activeView = 'converter';
  }

  function handleMatrixOpenChart(currencyCode: string) {
    converterFromCurrency = currencyCode;
    activeView = 'chart';
  }

  function handleTickerCurrencySelect(currencyCode: string) {
    converterFromCurrency = currencyCode;
  }

  async function handleCreateAlert(e: Event) {
    e.preventDefault();
    if (!alertEmail || !alertTargetRate) return;
    isAlertSubmitting = true;
    try {
      const res = await apiClient.createRateAlert({
        email: alertEmail,
        baseCurrency: 'IDR',
        targetCurrency: alertCurrency,
        condition: alertCondition,
        targetRate: Number(alertTargetRate),
      });
      alertMessage = res.message || t('alert.successMessage');
      setTimeout(() => {
        alertMessage = null;
        isAlertModalOpen = false;
      }, 3000);
    } catch (err) {
      console.error('Error creating alert:', err);
    } finally {
      isAlertSubmitting = false;
    }
  }
</script>

<!-- Shell: 100vh Full Viewport Application (Map-First) -->
<div class="h-screen w-screen overflow-hidden flex flex-col bg-[var(--bg)] text-[var(--ink)] select-none">
  
  <!-- Minimalist Top Navigation Header -->
  <Navbar />

  <!-- 100% Viewport Main Work Area -->
  <main class="flex-1 relative w-full h-[calc(100vh-52px)] overflow-hidden">

    {#if activeView === 'map'}
      <!-- 100% Full-Viewport Interactive World Map with Top-Right Floating Controls -->
      <WorldRateMap onSelectCurrency={handleMapCurrencySelect} class="w-full h-full" />

      <!-- Floating Bottom Dock: Ticker & View Selector -->
      <div class="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 z-20 flex flex-col sm:flex-row items-end justify-between gap-3 pointer-events-none">
        
        <!-- Floating Ticker Strip -->
        <div class="pointer-events-auto bg-[var(--bg-raised)]/92 border border-[var(--bg-rule)] rounded-2xl shadow-2xl backdrop-blur-xl px-3 py-1.5 overflow-hidden max-w-xl hidden lg:block">
          <GlobalMoversTicker onSelectCurrency={handleTickerCurrencySelect} />
        </div>

        <!-- Floating Navigation View Pills (Anchored to the very bottom) -->
        <div class="pointer-events-auto flex items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-[var(--bg-raised)]/95 border border-[var(--bg-rule)] shadow-2xl backdrop-blur-xl overflow-x-auto ml-auto">
          {#each viewOptions as opt}
            {@const isActive = activeView === opt.id}
            {@const IconComponent = opt.icon}
            <button
              type="button"
              onclick={() => (activeView = opt.id as any)}
              class={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--bg-subtle)]'
              }`}
            >
              <IconComponent class="w-3.5 h-3.5" />
              <span>{opt.label}</span>
            </button>
          {/each}

          <button
            type="button"
            onclick={() => (isAlertModalOpen = true)}
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--bg-subtle)] hover:bg-[var(--bg-rule)] text-[var(--signal)] border border-[var(--signal-rule)] transition cursor-pointer"
            title={t('masthead.ctaAlert')}
          >
            <Bell class="w-3.5 h-3.5" />
            <span class="hidden md:inline">{t('masthead.ctaAlert')}</span>
          </button>
        </div>
      </div>

    {:else}
      <!-- Overlay View Modal / Slide Container for other views (Chart, Matrix, Converter, Cards) -->
      <div class="absolute inset-0 z-30 bg-[var(--bg)] overflow-y-auto p-4 sm:p-8 flex flex-col space-y-6">
        
        <!-- Back to Map Floating Top Bar -->
        <div class="max-w-8xl w-full mx-auto flex items-center justify-between gap-4 border-b border-[var(--bg-rule)] pb-4">
          <button
            type="button"
            onclick={() => (activeView = 'map')}
            class="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-raised)] border border-[var(--bg-rule)] hover:border-sky-500 text-xs font-bold text-[var(--ink)] shadow-md transition cursor-pointer"
          >
            <ArrowLeft class="w-4 h-4 text-sky-400" />
            <span>{t('common.backToMap')}</span>
          </button>

          <!-- Quick Tab Switcher -->
          <div class="flex items-center gap-1.5 bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--bg-rule)] overflow-x-auto">
            {#each viewOptions as opt}
              {@const isActive = activeView === opt.id}
              {@const IconComponent = opt.icon}
              <button
                type="button"
                onclick={() => (activeView = opt.id as any)}
                class={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-sky-500 text-slate-950 font-extrabold shadow'
                    : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                }`}
              >
                <IconComponent class="w-3.5 h-3.5" />
                <span>{opt.label}</span>
              </button>
            {/each}
          </div>
        </div>

        <!-- Render View Content -->
        <div class="max-w-8xl w-full mx-auto pb-12">
          {#if activeView === 'chart'}
            <GoogleRateChart
              initialCurrency={converterFromCurrency}
              showCurrencySelector={true}
              onSelectCurrency={(c) => { converterFromCurrency = c; }}
            />
          {:else if activeView === 'matrix'}
            <CurrencyComparisonMatrix
              onSelectCurrency={handleMatrixCurrencySelect}
              onOpenChart={handleMatrixOpenChart}
            />
          {:else if activeView === 'converter'}
            <CurrencyConverter initialFromCurrency={converterFromCurrency} />
          {:else if activeView === 'cards'}
            <RateCard />
          {/if}
        </div>
      </div>
    {/if}

  </main>

  <!-- Rate Alert Modal -->
  {#if isAlertModalOpen}
    <div
      role="presentation"
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onclick={() => (isAlertModalOpen = false)}
      onkeydown={(e) => e.key === 'Escape' && (isAlertModalOpen = false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
        tabindex="-1"
        class="relative w-full max-w-md bg-[var(--bg-raised)] border border-[var(--bg-rule)] rounded-2xl p-6 shadow-2xl"
        style="color: var(--ink);"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.key === 'Escape' && (isAlertModalOpen = false)}
      >
        <button
          type="button"
          aria-label={t('common.close')}
          onclick={() => (isAlertModalOpen = false)}
          class="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--ink-4)] hover:text-[var(--ink)] hover:bg-[var(--bg-subtle)] transition cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>

        <div class="mb-5 pb-4 border-b border-[var(--bg-rule)]">
          <div class="flex items-center gap-2 mb-1">
            <Bell class="w-4 h-4 text-rose-400" />
            <h3 id="alert-modal-title" class="text-base font-bold text-[var(--ink)]">
              {t('alert.modalTitle')}
            </h3>
          </div>
          <p class="text-xs text-[var(--ink-4)]">
            {t('alert.modalSubtitle')}
          </p>
        </div>

        {#if alertMessage}
          <div class="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            <Check class="w-4 h-4 shrink-0 mt-0.5" />
            <span>{alertMessage}</span>
          </div>
        {:else}
          <form onsubmit={handleCreateAlert} class="space-y-3.5">
            <div>
              <label for="alert-email-input" class="block text-[11px] font-bold text-[var(--ink-3)] uppercase tracking-wider mb-1">
                {t('alert.emailLabel')}
              </label>
              <input id="alert-email-input" type="email" required placeholder={t('alert.emailPlaceholder')} bind:value={alertEmail} class="field" />
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <label for="alert-currency-select" class="block text-[11px] font-bold text-[var(--ink-3)] uppercase tracking-wider mb-1">
                  {t('alert.currencyLabel')}
                </label>
                <select id="alert-currency-select" bind:value={alertCurrency} class="field">
                  <option value="USD">🇺🇸 USD</option>
                  <option value="EUR">🇪🇺 EUR</option>
                  <option value="SGD">🇸🇬 SGD</option>
                  <option value="JPY">🇯🇵 JPY</option>
                  <option value="AUD">🇦🇺 AUD</option>
                  <option value="GBP">🇬🇧 GBP</option>
                  <option value="SAR">🇸🇦 SAR</option>
                  <option value="MYR">🇲🇾 MYR</option>
                  <option value="CNY">🇨🇳 CNY</option>
                </select>
              </div>

              <div>
                <label for="alert-condition-select" class="block text-[11px] font-bold text-[var(--ink-3)] uppercase tracking-wider mb-1">
                  {t('alert.conditionLabel')}
                </label>
                <select id="alert-condition-select" bind:value={alertCondition} class="field">
                  <option value="below">{t('alert.conditionBelow')}</option>
                  <option value="above">{t('alert.conditionAbove')}</option>
                </select>
              </div>
            </div>

            <div>
              <label for="alert-target-rate-input" class="block text-[11px] font-bold text-[var(--ink-3)] uppercase tracking-wider mb-1">
                {t('alert.targetRateLabel')}
              </label>
              <input id="alert-target-rate-input" type="number" required step="any" placeholder={t('alert.targetRatePlaceholder')} bind:value={alertTargetRate} class="field font-mono" />
            </div>

            <button type="submit" class="btn btn-primary w-full mt-2" disabled={isAlertSubmitting}>
              {isAlertSubmitting ? t('alert.submittingButton') : t('alert.submitButton')}
            </button>
          </form>
        {/if}
      </div>
    </div>
  {/if}

</div>
