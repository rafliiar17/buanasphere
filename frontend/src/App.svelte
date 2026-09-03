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
  import GlobeLandingPage from '$lib/components/GlobeLandingPage.svelte';
  import WorldRateMap from '$lib/features/map/WorldRateMap.svelte';
  import CurrencyConverter from '$lib/features/converter/CurrencyConverter.svelte';
  import GoogleRateChart from '$lib/features/chart/GoogleRateChart.svelte';
  import CurrencyComparisonMatrix from '$lib/features/matrix/CurrencyComparisonMatrix.svelte';
  import RateCard from '$lib/features/card/RateCard.svelte';
  import GlobalAppSplashScreen from '$lib/components/GlobalAppSplashScreen.svelte';
  import GeoAppLauncherModal from '$lib/framework/geoglobe/ui/GeoAppLauncherModal.svelte';
  import KursBottomDock from '$lib/apps/kurs/KursBottomDock.svelte';
  import TimeBottomDock from '$lib/apps/time/TimeBottomDock.svelte';
  import FlightBottomDock from '$lib/apps/flight/FlightBottomDock.svelte';
  import PassportBottomDock from '$lib/apps/passport/PassportBottomDock.svelte';
  import { geoStore } from '$lib/framework/geoglobe/geoStore.svelte';
  import { isLandingPath } from '$lib/framework/geoglobe/router';
  import { apiClient } from '$lib/api/client';
  import { t, subscribeLocale, getLocale, type SupportedLocale } from '$lib/i18n';

  // Detect if we're on the root landing page (globe.arafz.id/)
  const isLanding = typeof window !== 'undefined' ? isLandingPath(window.location.pathname) : false;

  let currentLang = $state<SupportedLocale>(getLocale());
  let isAppInitialLoading = $state(true);

  const activeApp = $derived(geoStore.activeApp);
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
    const timer = setTimeout(() => {
      isAppInitialLoading = false;
    }, 900);
    return () => {
      unsub();
      clearTimeout(timer);
    };
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

<svelte:head>
  {#if isLanding}
    <title>Globe — Platform Informasi Dunia Real-Time | globe.arafz.id</title>
  {:else}
    <title>{activeApp.name} — {activeApp.tagline} | globe.arafz.id</title>
  {/if}
</svelte:head>

{#if isLanding}
  <!-- Root Landing Page: Pilih Aplikasi -->
  <GlobeLandingPage />
{:else}
<!-- Shell: 100vh Full Viewport Application (Map-First) -->
<div class="h-screen w-screen overflow-hidden flex flex-col bg-[var(--bg)] text-[var(--ink)] select-none">
  
  <!-- Global App Initial Loading Splash Screen -->
  <GlobalAppSplashScreen isReady={!isAppInitialLoading} />

  <!-- Minimalist Top Navigation Header -->
  <Navbar />

  <!-- 100% Viewport Main Work Area -->
  <main class="flex-1 relative w-full h-[calc(100vh-52px)] overflow-hidden">

    {#if activeView === 'map'}
      <!-- 100% Full-Viewport Interactive World Map with Top-Right Floating Controls -->
      <WorldRateMap onSelectCurrency={handleMapCurrencySelect} class="w-full h-full" />

      <!-- Floating Bottom Dock (Polymorphic per Micro-App - ADR 0040) -->
      {#if geoStore.activeApp?.BottomDockComponent}
        {@const CustomBottomDock = geoStore.activeApp.BottomDockComponent}
        <CustomBottomDock />
      {:else if geoStore.activeAppId === 'world-time'}
        <TimeBottomDock />
      {:else if geoStore.activeAppId === 'remittance-flow'}
        <FlightBottomDock />
      {:else if geoStore.activeAppId === 'passport-power'}
        <PassportBottomDock />
      {:else if geoStore.activeAppId === 'fx-rates'}
        <KursBottomDock
          {activeView}
          onSelectView={(v) => (activeView = v)}
          onSelectCurrency={handleTickerCurrencySelect}
          onOpenAlertModal={() => (isAlertModalOpen = true)}
        />
      {:else}
        <!-- Sleek minimal dock for plug-and-play apps without dedicated dock -->
        <div class="fixed bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div class="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg text-[11px] text-slate-400">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="font-medium text-slate-300">{activeApp.name}</span>
            <span class="text-slate-600">•</span>
            <span>{activeApp.tagline}</span>
          </div>
        </div>
      {/if}

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

  <!-- GeoGlobe Pluggable Micro-App Launcher Modal -->
  <GeoAppLauncherModal />

</div>
{/if}

