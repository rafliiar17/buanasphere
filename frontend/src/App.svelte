<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    Building2, 
    ArrowRightLeft, 
    LineChart, 
    Share2, 
    Bell, 
    Sparkles, 
    Check, 
    X,
    TrendingUp,
    ShieldCheck,
    Zap,
    Globe,
    Compass,
    Layers,
    Info,
    ArrowUpRight
  } from 'lucide-svelte';
  import Navbar from '$lib/components/Navbar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Tabs from '$lib/components/ui/Tabs.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import RateMatrix from '$lib/features/matrix/RateMatrix.svelte';
  import WorldRateMap from '$lib/features/map/WorldRateMap.svelte';
  import GlobalMoversTicker from '$lib/features/map/GlobalMoversTicker.svelte';
  import CurrencyConverter from '$lib/features/converter/CurrencyConverter.svelte';
  import TrendChart from '$lib/features/chart/TrendChart.svelte';
  import RateCard from '$lib/features/card/RateCard.svelte';
  import { apiClient } from '$lib/api/client';

  // Svelte 5 State: Default to 'map' (Hero World Rate Map)
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
    { id: 'map', label: 'Peta Kurs Dunia', badge: 'Hero / Utama' },
    { id: 'matrix', label: 'Komparasi Kurs Bank', badge: 'Side-by-Side' },
    { id: 'converter', label: 'Kalkulator Konversi', badge: 'Instan' },
    { id: 'chart', label: 'Grafik Tren Historis' },
    { id: 'cards', label: 'Shareable Rate Cards' },
  ];

  function handleMapCurrencySelect(currencyCode: string) {
    converterFromCurrency = currencyCode;
    activeTab = 'converter';
  }

  function handleTickerCurrencySelect(currencyCode: string) {
    converterFromCurrency = currencyCode;
    // If user is on another tab, switch to map or keep on current
    if (activeTab !== 'map' && activeTab !== 'matrix' && activeTab !== 'converter') {
      activeTab = 'map';
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

<div class="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950">
  <!-- Navbar -->
  <Navbar />

  <!-- Main Content Area -->
  <main class="flex-1 max-w-8xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
    <!-- Hero Banner Section -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/20 p-5 sm:p-8 shadow-2xl">
      <div class="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div class="space-y-3 max-w-8xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Zap class="w-3.5 h-3.5" />
            <span>Pusat Data Agregasi Kurs Valas Real-Time Lintas Bank Indonesia</span>
          </div>
          <h1 class="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Eksplorasi Kurs Valas Dunia <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Secara Transparan</span>
          </h1>
          <p class="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            Pantau kurs beli, kurs jual, dan spread harga nyata dari Bank Indonesia (JISDOR), BCA, Bank Mandiri, BRI, BNI, CIMB Niaga, serta money changer tanpa markup tersembunyi.
          </p>
        </div>

        <!-- Quick Rate Alert Button -->
        <div class="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            variant="default"
            size="lg"
            onclick={() => (isAlertModalOpen = true)}
            class="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-950/60"
          >
            <Bell class="w-4 h-4" />
            <span>Pasang Rate Alert Gratis</span>
          </Button>
        </div>
      </div>
    </div>

    <!-- Global Movers Ticker Ribbon Bar -->
    <section aria-label="Global Movers Ticker">
      <GlobalMoversTicker onSelectCurrency={handleTickerCurrencySelect} />
    </section>

    <!-- Main Navigation Tabs -->
    <div class="flex items-center justify-between gap-4 overflow-x-auto pb-1 scrollbar-thin">
      <Tabs tabs={mainTabs} bind:activeTab />
    </div>

    <!-- Active View Section -->
    <section class="transition-all duration-200">
      {#if activeTab === 'map'}
        <WorldRateMap onSelectCurrency={handleMapCurrencySelect} />
      {:else if activeTab === 'matrix'}
        <RateMatrix />
      {:else if activeTab === 'converter'}
        <CurrencyConverter initialFromCurrency={converterFromCurrency} />
      {:else if activeTab === 'chart'}
        <TrendChart />
      {:else if activeTab === 'cards'}
        <RateCard />
      {/if}
    </section>

    <!-- Value Proposition & Educational Insights Strip -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
      <div class="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
        <div class="flex items-center gap-2.5 text-emerald-400">
          <ShieldCheck class="w-5 h-5" />
          <h4 class="text-sm font-bold text-white">Transparansi Tanpa Bias</h4>
        </div>
        <p class="text-xs text-slate-400 leading-relaxed">
          Semua data kurs diambil langsung dari sumber resmi perbankan dan bank sentral secara berkala tanpa intervensi komersial atau markup harga.
        </p>
      </div>

      <div class="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
        <div class="flex items-center gap-2.5 text-cyan-400">
          <Sparkles class="w-5 h-5" />
          <h4 class="text-sm font-bold text-white">Edge-First Sub-50ms</h4>
        </div>
        <p class="text-xs text-slate-400 leading-relaxed">
          Didukung arsitektur Cloudflare Edge Workers dan cache SWR 15 menit untuk waktu muat halaman secepat kilat dari mana pun di seluruh dunia.
        </p>
      </div>

      <div class="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
        <div class="flex items-center gap-2.5 text-indigo-400">
          <Building2 class="w-5 h-5" />
          <h4 class="text-sm font-bold text-white">Perbandingan Cerdas</h4>
        </div>
        <p class="text-xs text-slate-400 leading-relaxed">
          Temukan bank dengan harga beli tertinggi saat ingin menjual valas, dan bank dengan harga jual termurah saat ingin membeli valuta asing.
        </p>
      </div>
    </section>
  </main>

  <!-- Rate Alert Modal Dialog -->
  {#if isAlertModalOpen}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div class="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
        <!-- Close Button -->
        <button
          type="button"
          aria-label="Tutup Dialog"
          onclick={() => (isAlertModalOpen = false)}
          class="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>

        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Bell class="w-4 h-4" />
            </div>
            <h3 class="text-lg font-bold text-white">Pasang Rate Alert Gratis</h3>
          </div>
          <p class="text-xs text-slate-400">
            Dapatkan notifikasi email gratis saat nilai tukar valas mencapai target yang Anda tentukan.
          </p>
        </div>

        {#if alertMessage}
          <div class="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
            <Check class="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{alertMessage}</span>
          </div>
        {:else}
          <form onsubmit={handleCreateAlert} class="space-y-4">
            <!-- Email -->
            <div class="space-y-1.5">
              <label for="alert-email-input" class="text-xs font-semibold text-slate-300">Alamat Email</label>
              <input
                id="alert-email-input"
                type="email"
                required
                placeholder="nama@email.com"
                bind:value={alertEmail}
                class="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none"
              />
            </div>

            <!-- Currency & Condition -->
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label for="alert-currency-select" class="text-xs font-semibold text-slate-300">Mata Uang</label>
                <select
                  id="alert-currency-select"
                  bind:value={alertCurrency}
                  class="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm text-slate-100 outline-none cursor-pointer"
                >
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

              <div class="space-y-1.5">
                <label for="alert-condition-select" class="text-xs font-semibold text-slate-300">Kondisi Pemicu</label>
                <select
                  id="alert-condition-select"
                  bind:value={alertCondition}
                  class="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm text-slate-100 outline-none cursor-pointer"
                >
                  <option value="below">Kurang dari (≤)</option>
                  <option value="above">Lebih dari (≥)</option>
                </select>
              </div>
            </div>

            <!-- Target Rate (IDR) -->
            <div class="space-y-1.5">
              <label for="alert-target-rate-input" class="text-xs font-semibold text-slate-300">Target Nilai Tukar (IDR)</label>
              <input
                id="alert-target-rate-input"
                type="number"
                required
                step="any"
                placeholder="16200"
                bind:value={alertTargetRate}
                class="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none"
              />
            </div>

            <Button
              type="submit"
              variant="default"
              size="md"
              class="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold"
              disabled={isAlertSubmitting}
            >
              {isAlertSubmitting ? 'Mendaftarkan...' : 'Aktifkan Alert Sekarang'}
            </Button>
          </form>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Footer -->
  <Footer />
</div>
