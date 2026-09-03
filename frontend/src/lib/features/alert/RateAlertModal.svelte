<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    X, 
    Bell, 
    Check, 
    Trash2, 
    TrendingDown, 
    TrendingUp, 
    ArrowRight, 
    AlertCircle,
    Mail
  } from 'lucide-svelte';
  import { apiClient, SUPPORTED_CURRENCIES, BASE_RATES_IDR } from '$lib/api/client';
  import { formatRupiah, formatPercent } from '$lib/formatters/currency';
  import { t } from '$lib/i18n';

  export interface SavedAlert {
    id: string;
    email: string;
    currency: string;
    condition: 'above' | 'below';
    targetRate: number;
    createdAt: string;
  }

  interface Props {
    isOpen: boolean;
    onClose?: () => void;
    initialCurrency?: string;
  }

  let { isOpen = $bindable(false), onClose, initialCurrency = 'USD' }: Props = $props();

  let alertEmail = $state('');
  let alertCurrency = $state('USD');
  let alertCondition = $state<'above' | 'below'>('below');
  let alertTargetRate = $state<number>(16200);
  let isAlertSubmitting = $state(false);
  let alertMessage = $state<string | null>(null);
  let alertError = $state<string | null>(null);
  let savedAlerts = $state<SavedAlert[]>([]);

  $effect(() => {
    if (initialCurrency) {
      alertCurrency = initialCurrency;
    }
  });

  // Update targetRate when currency changes if targetRate was default
  $effect(() => {
    const base = BASE_RATES_IDR[alertCurrency.toUpperCase()];
    if (base && (!alertTargetRate || alertTargetRate === 16200)) {
      alertTargetRate = Math.round(base.mid);
    }
  });

  const currentRate = $derived.by(() => {
    const base = BASE_RATES_IDR[alertCurrency.toUpperCase()];
    return base ? base.mid : 16000;
  });

  const rateDifference = $derived.by(() => {
    const diff = Number(alertTargetRate || 0) - currentRate;
    const diffPercent = currentRate > 0 ? (diff / currentRate) * 100 : 0;
    return {
      diff,
      diffPercent: Math.round(diffPercent * 10) / 10,
    };
  });

  function loadSavedAlerts() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('kurs_saved_alerts');
        if (stored) {
          savedAlerts = JSON.parse(stored);
        }
      }
    } catch (e) {
      console.error('Failed to load saved alerts from localStorage:', e);
    }
  }

  function persistSavedAlerts(alerts: SavedAlert[]) {
    savedAlerts = alerts;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('kurs_saved_alerts', JSON.stringify(alerts));
      }
    } catch (e) {
      console.error('Failed to persist alerts to localStorage:', e);
    }
  }

  async function handleCreateAlert(e: Event) {
    e.preventDefault();
    if (!alertEmail || !alertTargetRate) return;
    isAlertSubmitting = true;
    alertError = null;

    try {
      const res = await apiClient.createRateAlert({
        email: alertEmail,
        baseCurrency: 'IDR',
        targetCurrency: alertCurrency,
        condition: alertCondition,
        targetRate: Number(alertTargetRate),
      });

      // Save locally
      const newAlert: SavedAlert = {
        id: crypto.randomUUID(),
        email: alertEmail,
        currency: alertCurrency,
        condition: alertCondition,
        targetRate: Number(alertTargetRate),
        createdAt: new Date().toISOString(),
      };
      persistSavedAlerts([newAlert, ...savedAlerts]);

      alertMessage = res.message || t('alert.successMessage');
      setTimeout(() => {
        alertMessage = null;
        handleClose();
      }, 2500);
    } catch (err: any) {
      console.error('Error creating alert:', err);
      alertError = err?.message || 'Gagal mendaftarkan alert. Silakan periksa kembali data Anda.';
    } finally {
      isAlertSubmitting = false;
    }
  }

  function deleteAlert(id: string) {
    const updated = savedAlerts.filter(a => a.id !== id);
    persistSavedAlerts(updated);
  }

  function handleClose() {
    isOpen = false;
    onClose?.();
  }

  onMount(() => {
    loadSavedAlerts();
  });
</script>

{#if isOpen}
  <div
    role="presentation"
    class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
    onclick={handleClose}
    onkeydown={(e) => e.key === 'Escape' && handleClose()}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
      tabindex="-1"
      class="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.key === 'Escape' && handleClose()}
    >
      <!-- Close button -->
      <button
        type="button"
        aria-label={t('common.close')}
        onclick={handleClose}
        class="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
      >
        <X class="w-4 h-4" />
      </button>

      <!-- Modal Header -->
      <div class="flex items-start gap-3 pb-3 border-b border-slate-800">
        <div class="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
          <Bell class="w-5 h-5" />
        </div>
        <div>
          <h3 id="alert-modal-title" class="text-base font-bold text-white tracking-tight">
            {t('alert.modalTitle')}
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">
            {t('alert.modalSubtitle')}
          </p>
        </div>
      </div>

      <!-- Success or Error Feedback -->
      {#if alertMessage}
        <div class="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs animate-in fade-in">
          <Check class="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <span>{alertMessage}</span>
        </div>
      {/if}

      {#if alertError}
        <div class="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs animate-in fade-in">
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <span>{alertError}</span>
        </div>
      {/if}

      <!-- Alert Form -->
      <form onsubmit={handleCreateAlert} class="space-y-4">
        <!-- Email Input -->
        <div>
          <label for="alert-email-input" class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            {t('alert.emailLabel')}
          </label>
          <div class="relative">
            <input
              id="alert-email-input"
              type="email"
              required
              placeholder={t('alert.emailPlaceholder')}
              bind:value={alertEmail}
              class="w-full bg-slate-950/70 border border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-100 rounded-xl px-4 py-2.5 text-sm font-medium transition outline-none pl-10"
            />
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Mail class="w-4 h-4" />
            </div>
          </div>
        </div>

        <!-- Currency Selector -->
        <div>
          <label for="alert-currency-select" class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            {t('alert.currencyLabel')}
          </label>
          <div class="relative">
            <select
              id="alert-currency-select"
              bind:value={alertCurrency}
              class="w-full bg-slate-950/70 border border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-100 rounded-xl px-4 py-2.5 text-sm font-medium transition outline-none appearance-none cursor-pointer pr-10"
            >
              {#each SUPPORTED_CURRENCIES as curr}
                <option value={curr.code} class="bg-slate-900 text-white">
                  {curr.flag} {curr.code} — {curr.name}
                </option>
              {/each}
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Trigger Condition Radio Chips -->
        <div>
          <span class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            {t('alert.conditionLabel')}
          </span>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              onclick={() => (alertCondition = 'below')}
              class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer {alertCondition === 'below'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-inner'
                : 'bg-slate-950/50 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'}"
            >
              <TrendingDown class="w-3.5 h-3.5" />
              <span>Turun di Bawah (≤)</span>
            </button>

            <button
              type="button"
              onclick={() => (alertCondition = 'above')}
              class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer {alertCondition === 'above'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-inner'
                : 'bg-slate-950/50 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'}"
            >
              <TrendingUp class="w-3.5 h-3.5" />
              <span>Naik di Atas (≥)</span>
            </button>
          </div>
        </div>

        <!-- Target Rate Input -->
        <div>
          <label for="alert-target-rate-input" class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            {t('alert.targetRateLabel')}
          </label>
          <input
            id="alert-target-rate-input"
            type="number"
            required
            step="any"
            placeholder={t('alert.targetRatePlaceholder')}
            bind:value={alertTargetRate}
            class="w-full bg-slate-950/70 border border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-100 rounded-xl px-4 py-2.5 text-sm font-mono font-bold transition outline-none"
          />
        </div>

        <!-- Visual Comparison Preview -->
        <div class="rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-4 space-y-3">
          <div class="flex items-center justify-between text-xs">
            <span class="font-semibold text-slate-300">Visual Perbandingan Kurs</span>
            <span
              class="rounded-full px-2 py-0.5 text-[10px] font-bold border {rateDifference.diff >= 0
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}"
            >
              {rateDifference.diff >= 0 ? `+${rateDifference.diffPercent}%` : `${rateDifference.diffPercent}%`}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <span class="text-[10px] text-slate-400 block font-medium">Kurs Saat Ini ({alertCurrency})</span>
              <span class="text-sm font-extrabold font-mono text-white mt-1 block">
                {formatRupiah(currentRate)}
              </span>
            </div>

            <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <span class="text-[10px] text-slate-400 block font-medium">Target Anda</span>
              <span class="text-sm font-extrabold font-mono text-cyan-400 mt-1 block">
                {formatRupiah(Number(alertTargetRate || 0))}
              </span>
            </div>
          </div>

          <p class="text-[11px] text-slate-400">
            🔔 Notifikasi otomatis akan dikirim ke email saat kurs {alertCurrency} {alertCondition === 'below' ? 'turun ke atau di bawah' : 'naik ke atau di atas'} <strong class="text-white font-mono">{formatRupiah(Number(alertTargetRate || 0))}</strong>.
          </p>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-950/50 transition cursor-pointer disabled:opacity-50"
          disabled={isAlertSubmitting}
        >
          {isAlertSubmitting ? t('alert.submittingButton') : t('alert.submitButton')}
        </button>
      </form>

      <!-- Active Alerts Mini List (Stored in localStorage) -->
      {#if savedAlerts.length > 0}
        <div class="pt-4 border-t border-slate-800 space-y-2.5">
          <div class="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Alert Aktif Anda ({savedAlerts.length})</span>
            <span class="text-[10px] font-normal text-slate-500">Tersimpan di Perangkat</span>
          </div>

          <div class="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {#each savedAlerts as alert (alert.id)}
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-white font-mono px-1.5 py-0.5 rounded bg-slate-800 text-[11px]">
                    {alert.currency}
                  </span>
                  <span class="text-slate-300 font-mono font-bold">
                    {alert.condition === 'below' ? '≤' : '≥'} {formatRupiah(alert.targetRate)}
                  </span>
                  <span class="text-[10px] text-slate-500 truncate max-w-[120px]">
                    {alert.email}
                  </span>
                </div>

                <button
                  type="button"
                  onclick={() => deleteAlert(alert.id)}
                  class="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  title="Hapus Alert Ini"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
