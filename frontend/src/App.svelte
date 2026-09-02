<script lang="ts">
  import { onMount } from 'svelte';
  import { Bell, X, Check } from 'lucide-svelte';
  import Navbar from '$lib/components/Navbar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import WorldRateMap from '$lib/features/map/WorldRateMap.svelte';
  import GlobalMoversTicker from '$lib/features/map/GlobalMoversTicker.svelte';
  import CurrencyConverter from '$lib/features/converter/CurrencyConverter.svelte';
  import GoogleRateChart from '$lib/features/chart/GoogleRateChart.svelte';
  import CurrencyComparisonMatrix from '$lib/features/matrix/CurrencyComparisonMatrix.svelte';
  import RateCard from '$lib/features/card/RateCard.svelte';
  import { apiClient } from '$lib/api/client';
  import { t, subscribeLocale, getLocale, type SupportedLocale } from '$lib/i18n';

  let currentLang = $state<SupportedLocale>(getLocale());
  let activeTab = $state('map');
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

  const mainTabs = $derived([
    { id: 'map',       label: t('tabs.map') },
    { id: 'chart',     label: t('tabs.chart') },
    { id: 'matrix',    label: t('tabs.matrix') },
    { id: 'converter', label: t('tabs.converter') },
    { id: 'cards',     label: t('tabs.cards') },
  ]);

  function handleMapCurrencySelect(currencyCode: string) {
    converterFromCurrency = currencyCode;
    activeTab = 'chart';
  }

  function handleMatrixCurrencySelect(currencyCode: string) {
    converterFromCurrency = currencyCode;
    activeTab = 'converter';
  }

  function handleMatrixOpenChart(currencyCode: string) {
    converterFromCurrency = currencyCode;
    activeTab = 'chart';
  }

  function handleTickerCurrencySelect(currencyCode: string) {
    converterFromCurrency = currencyCode;
    if (activeTab !== 'map' && activeTab !== 'matrix' && activeTab !== 'converter' && activeTab !== 'chart') {
      activeTab = 'chart';
    }
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

<!-- Shell: warm paper ground, ink text -->
<div style="min-height:100vh;display:flex;flex-direction:column;background:var(--bg);color:var(--ink);">
  <Navbar />

  <main style="flex:1;max-width:1280px;width:100%;margin:0 auto;padding:0 24px 64px;">

    <!-- ── Masthead ──────────────────────────────────────────────────────── -->
    <div style="
      padding: 32px 0 24px;
      border-bottom: 2px solid var(--ink);
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 24px;
      flex-wrap: wrap;
    ">
      <!-- Left: editorial headline -->
      <div>
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-4);margin-bottom:6px;">
          {t('masthead.badge')}
        </p>
        <h1 style="
          font-family: var(--font-serif);
          font-size: clamp(26px, 5vw, 44px);
          font-weight: 400;
          font-style: italic;
          color: var(--ink);
          line-height: 1.15;
          letter-spacing: -0.01em;
          margin: 0;
        ">
          {t('masthead.titleItalic')}<br>
          <span style="font-style:normal;font-weight:700;color:var(--ink);">{t('masthead.titleBold')}</span>
        </h1>
        <p style="margin-top:10px;font-size:13px;color:var(--ink-3);max-width:580px;line-height:1.55;">
          {t('masthead.description')}
        </p>
      </div>

      <!-- Right: CTA alert signup -->
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;flex-shrink:0;">
        <button
          class="btn btn-primary"
          onclick={() => (isAlertModalOpen = true)}
          style="display:flex;align-items:center;gap:6px;"
        >
          <Bell style="width:13px;height:13px;" />
          {t('masthead.ctaAlert')}
        </button>
        <span style="font-size:10px;color:var(--ink-4);">{t('masthead.ctaAlertSubtext')}</span>
      </div>
    </div>

    <!-- ── Global Movers Ticker ──────────────────────────────────────────── -->
    <div style="border-bottom:1px solid var(--bg-rule);overflow:hidden;">
      <GlobalMoversTicker onSelectCurrency={handleTickerCurrencySelect} />
    </div>

    <!-- ── Section navigation (underline tabs, not pills) ─────────────────── -->
    <nav
      aria-label="Navigasi Bagian"
      style="display:flex;gap:28px;overflow-x:auto;border-bottom:1px solid var(--bg-rule);padding-bottom:0;margin-bottom:0;-webkit-overflow-scrolling:touch;scrollbar-width:none;"
    >
      {#each mainTabs as tab}
        <button
          class="nav-tab {activeTab === tab.id ? 'active' : ''}"
          onclick={() => (activeTab = tab.id)}
        >
          {tab.label}
        </button>
      {/each}
    </nav>

    <!-- ── Active view ───────────────────────────────────────────────────── -->
    <section style="padding-top:28px;">
      {#if activeTab === 'map'}
        <WorldRateMap onSelectCurrency={handleMapCurrencySelect} />
      {:else if activeTab === 'chart'}
        <GoogleRateChart
          initialCurrency={converterFromCurrency}
          showCurrencySelector={true}
          onSelectCurrency={(c) => { converterFromCurrency = c; }}
        />
      {:else if activeTab === 'matrix'}
        <CurrencyComparisonMatrix
          onSelectCurrency={handleMatrixCurrencySelect}
          onOpenChart={handleMatrixOpenChart}
        />
      {:else if activeTab === 'converter'}
        <CurrencyConverter initialFromCurrency={converterFromCurrency} />
      {:else if activeTab === 'cards'}
        <RateCard />
      {/if}
    </section>

    <!-- ── Editorial footer strip — 3 columns, hairline ruled ─────────────── -->
    <div style="
      margin-top: 64px;
      padding-top: 32px;
      border-top: 2px solid var(--ink);
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 32px 48px;
    ">
      <!-- Col 1 -->
      <div>
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-4);margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--bg-rule);">
          {t('footerStrip.col1Title')}
        </p>
        <p style="font-size:13px;color:var(--ink-3);line-height:1.6;">
          {t('footerStrip.col1Desc')}
        </p>
      </div>

      <!-- Col 2 -->
      <div>
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-4);margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--bg-rule);">
          {t('footerStrip.col2Title')}
        </p>
        <p style="font-size:13px;color:var(--ink-3);line-height:1.6;">
          {t('footerStrip.col2Desc')}
        </p>
      </div>

      <!-- Col 3 -->
      <div>
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-4);margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--bg-rule);">
          {t('footerStrip.col3Title')}
        </p>
        <p style="font-size:13px;color:var(--ink-3);line-height:1.6;">
          {t('footerStrip.col3Desc')}
        </p>
      </div>
    </div>

  </main>

  <!-- ── Rate Alert Modal ─────────────────────────────────────────────────── -->
  {#if isAlertModalOpen}
    <!-- Backdrop -->
    <div
      role="presentation"
      style="position:fixed;inset:0;z-index:60;background:rgba(26,18,9,0.5);display:flex;align-items:center;justify-content:center;padding:16px;"
      onclick={() => (isAlertModalOpen = false)}
      onkeydown={(e) => e.key === 'Escape' && (isAlertModalOpen = false)}
    >
      <!-- Dialog panel -->
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
        tabindex="-1"
        style="
          position:relative;
          width:100%;
          max-width:400px;
          background:var(--bg-raised);
          border:1px solid var(--bg-rule);
          border-radius:var(--radius-lg);
          padding:28px;
          box-shadow: 0 8px 40px rgba(26,18,9,0.14);
        "
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.key === 'Escape' && (isAlertModalOpen = false)}
      >
        <!-- Close -->
        <button
          type="button"
          aria-label={t('common.close')}
          onclick={() => (isAlertModalOpen = false)}
          style="position:absolute;top:16px;right:16px;background:none;border:none;cursor:pointer;color:var(--ink-4);padding:4px;border-radius:4px;transition:color 120ms;"
          onmouseenter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
          onmouseleave={(e) => (e.currentTarget.style.color = 'var(--ink-4)')}
        >
          <X style="width:16px;height:16px;" />
        </button>

        <!-- Header -->
        <div style="margin-bottom:20px;border-bottom:1px solid var(--bg-rule);padding-bottom:16px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <Bell style="width:14px;height:14px;color:var(--signal);" />
            <h3 id="alert-modal-title" style="font-size:15px;font-weight:700;color:var(--ink);margin:0;">
              {t('alert.modalTitle')}
            </h3>
          </div>
          <p style="font-size:12px;color:var(--ink-3);margin:0;">
            {t('alert.modalSubtitle')}
          </p>
        </div>

        {#if alertMessage}
          <div style="display:flex;align-items:flex-start;gap:10px;padding:12px;background:var(--pos-bg);border:1px solid var(--pos-rule);border-radius:var(--radius);">
            <Check style="width:14px;height:14px;color:var(--pos);flex-shrink:0;margin-top:1px;" />
            <span style="font-size:13px;color:var(--pos);">{alertMessage}</span>
          </div>
        {:else}
          <form onsubmit={handleCreateAlert} style="display:flex;flex-direction:column;gap:14px;">

            <!-- Email -->
            <div>
              <label for="alert-email-input" style="display:block;font-size:11px;font-weight:600;color:var(--ink-3);margin-bottom:5px;text-transform:uppercase;letter-spacing:0.06em;">
                {t('alert.emailLabel')}
              </label>
              <input id="alert-email-input" type="email" required placeholder={t('alert.emailPlaceholder')} bind:value={alertEmail} class="field" />
            </div>

            <!-- Currency + Condition -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <label for="alert-currency-select" style="display:block;font-size:11px;font-weight:600;color:var(--ink-3);margin-bottom:5px;text-transform:uppercase;letter-spacing:0.06em;">
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
                <label for="alert-condition-select" style="display:block;font-size:11px;font-weight:600;color:var(--ink-3);margin-bottom:5px;text-transform:uppercase;letter-spacing:0.06em;">
                  {t('alert.conditionLabel')}
                </label>
                <select id="alert-condition-select" bind:value={alertCondition} class="field">
                  <option value="below">{t('alert.conditionBelow')}</option>
                  <option value="above">{t('alert.conditionAbove')}</option>
                </select>
              </div>
            </div>

            <!-- Target rate -->
            <div>
              <label for="alert-target-rate-input" style="display:block;font-size:11px;font-weight:600;color:var(--ink-3);margin-bottom:5px;text-transform:uppercase;letter-spacing:0.06em;">
                {t('alert.targetRateLabel')}
              </label>
              <input id="alert-target-rate-input" type="number" required step="any" placeholder={t('alert.targetRatePlaceholder')} bind:value={alertTargetRate} class="field" />
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:4px;" disabled={isAlertSubmitting}>
              {isAlertSubmitting ? t('alert.submittingButton') : t('alert.submitButton')}
            </button>
          </form>
        {/if}
      </div>
    </div>
  {/if}

  <Footer />
</div>
