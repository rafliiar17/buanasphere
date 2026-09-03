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
  import RateAlertModal from '$lib/features/alert/RateAlertModal.svelte';
  import AdminConsole from '$lib/features/admin/AdminConsole.svelte';
  import AboutModal from '$lib/components/AboutModal.svelte';
  import { geoStore } from '$lib/framework/geoglobe/geoStore.svelte';
  import { isLandingPath } from '$lib/framework/geoglobe/router';
  import { apiClient } from '$lib/api/client';
  import { t, subscribeLocale, getLocale, type SupportedLocale } from '$lib/i18n';

  // Detect if we're on /nimda (operator console) or root landing page (globe.arafz.id/)
  const isNimda = typeof window !== 'undefined' && (window.location.pathname === '/nimda' || window.location.pathname === '/nimda/');
  const isLanding = typeof window !== 'undefined' ? isLandingPath(window.location.pathname) : false;

  let currentLang = $state<SupportedLocale>(getLocale());
  let isAppInitialLoading = $state(true);

  const activeApp = $derived(geoStore.activeApp);
  const pageTitle = $derived(
    isLanding
      ? 'Globe — Platform Informasi Dunia Real-Time | globe.arafz.id'
      : `${activeApp.name} — ${activeApp.tagline} | globe.arafz.id`
  );
  const pageDescription = $derived(
    isLanding
      ? 'Eksplorasi bumi 3D interaktif dan platform multi-aplikasi geospatial real-time: nilai tukar kurs, zona waktu dunia, koridor remitansi, dan indeks paspor.'
      : `${activeApp.name}: ${activeApp.tagline}. Visualisasi data geospatial interaktif dan analitik real-time di globe.arafz.id.`
  );
  const canonicalUrl = $derived(
    isLanding
      ? 'https://globe.arafz.id/'
      : `https://globe.arafz.id${activeApp.canonicalPath || ''}`
  );
  let activeView = $state<'map' | 'chart' | 'matrix' | 'converter' | 'cards'>('map');
  let converterFromCurrency = $state('USD');
  let isAlertModalOpen = $state(false);
  let isAboutModalOpen = $state(false);

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
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <link rel="canonical" href={canonicalUrl} />

  <!-- OpenGraph -->
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={pageDescription} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:type" content="website" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={pageDescription} />
</svelte:head>

{#if isNimda}
  <!-- Nimda Edge Operator Console (/nimda) — ADR 0045 -->
  <AdminConsole />
{:else if isLanding}
  <!-- Root Landing Page: Pilih Aplikasi -->
  <GlobeLandingPage />
{:else}
<!-- Shell: 100vh Full Viewport Application (Map-First) -->
<div class="h-screen w-screen overflow-hidden flex flex-col bg-[var(--bg)] text-[var(--ink)] select-none">
  
  <!-- Global App Initial Loading Splash Screen -->
  <GlobalAppSplashScreen isReady={!isAppInitialLoading} />

  <!-- Minimalist Top Navigation Header -->
  <Navbar onOpenAbout={() => (isAboutModalOpen = true)} />

  <!-- 100% Viewport Main Work Area -->
  <main class="flex-1 relative w-full h-[calc(100vh-52px)] overflow-hidden">

    {#if activeView === 'map'}
      <!-- 100% Full-Viewport Interactive World Map with Top-Right Floating Controls -->
      <WorldRateMap onSelectCurrency={handleMapCurrencySelect} class="w-full h-full" />

      <!-- Floating Bottom Dock (Polymorphic per Micro-App - ADR 0040) -->
      {#if geoStore.activeApp?.BottomDockComponent}
        {@const CustomBottomDock = geoStore.activeApp.BottomDockComponent}
        <CustomBottomDock
          {activeView}
          onSelectView={(v: any) => (activeView = v)}
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

  <!-- Rate Alert Modal (ADR 0044 Candidate 4) -->
  <RateAlertModal bind:isOpen={isAlertModalOpen} onClose={() => (isAlertModalOpen = false)} />

  <!-- GeoGlobe Pluggable Micro-App Launcher Modal -->
  <GeoAppLauncherModal />

  <!-- Buanasphere About Modal -->
  <AboutModal isOpen={isAboutModalOpen} onClose={() => (isAboutModalOpen = false)} />

</div>
{/if}

