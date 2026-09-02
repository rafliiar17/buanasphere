<script lang="ts">
  import { onMount } from 'svelte';
  import { Bell, X, Check, TrendingUp, ArrowUpRight } from 'lucide-svelte';
  import Navbar from '$lib/components/Navbar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import WorldRateMap from '$lib/features/map/WorldRateMap.svelte';
  import GlobalMoversTicker from '$lib/features/map/GlobalMoversTicker.svelte';
  import CurrencyConverter from '$lib/features/converter/CurrencyConverter.svelte';
  import GoogleRateChart from '$lib/features/chart/GoogleRateChart.svelte';
  import CurrencyComparisonMatrix from '$lib/features/matrix/CurrencyComparisonMatrix.svelte';
  import RateCard from '$lib/features/card/RateCard.svelte';
  import { apiClient } from '$lib/api/client';

  let activeTab = $state('map');
  let converterFromCurrency = $state('USD');
  let isAlertModalOpen = $state(false);
  let alertEmail = $state('');
  let alertCurrency = $state('USD');
  let alertCondition = $state<'above' | 'below'>('below');
  let alertTargetRate = $state<number>(16200);
  let isAlertSubmitting = $state(false);
  let alertMessage = $state<string | null>(null);

  const mainTabs = [
    { id: 'map',       label: '🗺️ Peta Kurs Dunia' },
    { id: 'chart',     label: '📈 Grafik & Analisis Tren' },
    { id: 'matrix',    label: '📊 Perbandingan Kurs Valas Dunia' },
    { id: 'converter', label: '💱 Kalkulator Konversi' },
    { id: 'cards',     label: '🃏 Rate Cards' },
  ];

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
      alertMessage = res.message;
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
    <!--
      This is the thesis: a data-journalism masthead, not a hero banner.
      It reads like the front page of Bisnis Indonesia. Large ink serif figure
      on the left, operational meta on the right. No glow, no gradient.
    -->
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
          Agregator Informasi Kurs Valas — Indonesia
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
          Kurs Valas Hari Ini,<br>
          <span style="font-style:normal;font-weight:700;color:var(--ink);">Dari Semua Bank Indonesia</span>
        </h1>
        <p style="margin-top:10px;font-size:13px;color:var(--ink-3);max-width:560px;line-height:1.55;">
          Data kurs beli, kurs jual, dan spread nyata dari Bank Indonesia (JISDOR), BCA, Mandiri, BRI, BNI, CIMB Niaga — tanpa markup tersembunyi dan tanpa registrasi wajib.
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
          Pasang Rate Alert
        </button>
        <span style="font-size:10px;color:var(--ink-4);">Notifikasi email gratis</span>
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
          Transparansi Sumber
        </p>
        <p style="font-size:13px;color:var(--ink-3);line-height:1.6;">
          Seluruh data diambil langsung dari publikasi resmi masing-masing bank dan bank sentral. Tidak ada intervensi komersial atau markup harga.
        </p>
      </div>

      <!-- Col 2 -->
      <div>
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-4);margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--bg-rule);">
          Latensi Edge Sub-50ms
        </p>
        <p style="font-size:13px;color:var(--ink-3);line-height:1.6;">
          Cloudflare Workers & KV cache SWR 15 menit. Eksekusi dari titik edge terdekat ke pengguna di seluruh dunia.
        </p>
      </div>

      <!-- Col 3 -->
      <div>
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-4);margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--bg-rule);">
          Perbandingan Cerdas
        </p>
        <p style="font-size:13px;color:var(--ink-3);line-height:1.6;">
          Temukan bank dengan harga beli terbaik saat menjual valas, dan harga jual termurah saat membeli valas.
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
          aria-label="Tutup Dialog"
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
            <h3 id="alert-modal-title" style="font-size:15px;font-weight:700;color:var(--ink);margin:0;">Pasang Rate Alert</h3>
          </div>
          <p style="font-size:12px;color:var(--ink-3);margin:0;">
            Notifikasi email gratis saat nilai tukar mencapai target Anda.
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
                Alamat Email
              </label>
              <input id="alert-email-input" type="email" required placeholder="nama@email.com" bind:value={alertEmail} class="field" />
            </div>

            <!-- Currency + Condition -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <label for="alert-currency-select" style="display:block;font-size:11px;font-weight:600;color:var(--ink-3);margin-bottom:5px;text-transform:uppercase;letter-spacing:0.06em;">
                  Mata Uang
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
                  Kondisi
                </label>
                <select id="alert-condition-select" bind:value={alertCondition} class="field">
                  <option value="below">Kurang dari (≤)</option>
                  <option value="above">Lebih dari (≥)</option>
                </select>
              </div>
            </div>

            <!-- Target rate -->
            <div>
              <label for="alert-target-rate-input" style="display:block;font-size:11px;font-weight:600;color:var(--ink-3);margin-bottom:5px;text-transform:uppercase;letter-spacing:0.06em;">
                Target Nilai Tukar (IDR)
              </label>
              <input id="alert-target-rate-input" type="number" required step="any" placeholder="16200" bind:value={alertTargetRate} class="field" />
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:4px;" disabled={isAlertSubmitting}>
              {isAlertSubmitting ? 'Mendaftarkan...' : 'Aktifkan Alert Sekarang'}
            </button>
          </form>
        {/if}
      </div>
    </div>
  {/if}

  <Footer />
</div>
