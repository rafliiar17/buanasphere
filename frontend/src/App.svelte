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
    Zap
  } from 'lucide-svelte';
  import Navbar from '$lib/components/Navbar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Tabs from '$lib/components/ui/Tabs.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import RateMatrix from '$lib/features/matrix/RateMatrix.svelte';
  import CurrencyConverter from '$lib/features/converter/CurrencyConverter.svelte';
  import TrendChart from '$lib/features/chart/TrendChart.svelte';
  import RateCard from '$lib/features/card/RateCard.svelte';
  import { apiClient } from '$lib/api/client';

  // Svelte 5 State
  let activeTab = $state('matrix');
  let isAlertModalOpen = $state(false);
  let alertEmail = $state('');
  let alertCurrency = $state('USD');
  let alertCondition = $state<'above' | 'below'>('below');
  let alertTargetRate = $state<number>(16000);
  let isAlertSubmitting = $state(false);
  let alertMessage = $state<string | null>(null);

  const mainTabs = [
    { id: 'matrix', label: 'Komparasi Kurs Bank', badge: 'Utama' },
    { id: 'converter', label: 'Multi-Source Converter', badge: 'Instan' },
    { id: 'chart', label: 'Grafik Tren Historis' },
    { id: 'cards', label: 'Shareable Rate Cards' },
  ];

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

<div class="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased">
  <!-- Navbar -->
  <Navbar />

  <!-- Main Content Area -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <!-- Hero Banner -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/20 p-6 sm:p-8 shadow-2xl">
      <div class="absolute -top-32 -left-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div class="space-y-3 max-w-2xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Zap class="w-3.5 h-3.5" />
            <span>Agregator Kurs Valas Lintas Bank Terlengkap di Indonesia</span>
          </div>
          <h1 class="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Pantau & Bandingkan Kurs Valas <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Tanpa Markup</span>
          </h1>
          <p class="text-sm text-slate-300 leading-relaxed">
            Dapatkan transparansi penuh harga beli (buy), harga jual (sell), dan spread nilai tukar mata uang asing dari Bank Indonesia (JISDOR), BCA, Mandiri, BRI, BNI, CIMB Niaga, dan money changer.
          </p>
        </div>

        <!-- Quick Rate Alert Button -->
        <div class="shrink-0">
          <Button
            variant="default"
            size="lg"
            onclick={() => (isAlertModalOpen = true)}
            class="w-full sm:w-auto flex items-center gap-2"
          >
            <Bell class="w-4 h-4" />
            <span>Pasang Rate Alert Gratis</span>
          </Button>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center justify-between gap-4 overflow-x-auto pb-1">
      <Tabs tabs={mainTabs} bind:activeTab />
    </div>

    <!-- Active View Content -->
    <section class="transition-all duration-200">
      {#if activeTab === 'matrix'}
        <RateMatrix />
      {:else if activeTab === 'converter'}
        <CurrencyConverter />
      {:else if activeTab === 'chart'}
        <TrendChart />
      {:else if activeTab === 'cards'}
        <RateCard />
      {/if}
    </section>
  </main>

  <!-- Rate Alert Modal Dialog -->
  {#if isAlertModalOpen}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div class="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
        <!-- Close Button -->
        <button
          type="button"
          aria-label="Tutup Dialog"
          onclick={() => (isAlertModalOpen = false)}
          class="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X class="w-5 h-5" />
        </button>

        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <Bell class="w-5 h-5 text-indigo-400" />
            <h3 class="text-lg font-bold text-white">Pasang Rate Alert</h3>
          </div>
          <p class="text-xs text-slate-400">
            Dapatkan notifikasi email gratis saat kurs mencapai target yang Anda inginkan.
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
                class="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none"
              />
            </div>

            <!-- Currency & Condition -->
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label for="alert-currency-select" class="text-xs font-semibold text-slate-300">Mata Uang</label>
                <select
                  id="alert-currency-select"
                  bind:value={alertCurrency}
                  class="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-sm text-slate-100 outline-none cursor-pointer"
                >
                  <option value="USD">🇺🇸 USD</option>
                  <option value="EUR">🇪🇺 EUR</option>
                  <option value="SGD">🇸🇬 SGD</option>
                  <option value="JPY">🇯🇵 JPY</option>
                  <option value="AUD">🇦🇺 AUD</option>
                  <option value="GBP">🇬🇧 GBP</option>
                  <option value="SAR">🇸🇦 SAR</option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label for="alert-condition-select" class="text-xs font-semibold text-slate-300">Kondisi Pemicu</label>
                <select
                  id="alert-condition-select"
                  bind:value={alertCondition}
                  class="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-sm text-slate-100 outline-none cursor-pointer"
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
                class="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none"
              />
            </div>

            <Button
              type="submit"
              variant="default"
              size="md"
              class="w-full mt-2"
              disabled={isAlertSubmitting}
            >
              {isAlertSubmitting ? 'Mendaftarkan...' : 'Aktifkan Alert Gratis'}
            </Button>
          </form>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Footer -->
  <Footer />
</div>
