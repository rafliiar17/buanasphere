<script lang="ts">
  import { onMount } from 'svelte';
  import { Globe, ShieldCheck, Zap, Server, Activity } from 'lucide-svelte';
  import { t } from '$lib/i18n';

  interface Props {
    isReady: boolean;
    class?: string;
  }

  let { isReady, class: className = '' }: Props = $props();

  let activeStep = $state(1);
  let isMounted = $state(true);

  onMount(() => {
    const step1Timer = setTimeout(() => { activeStep = 2; }, 350);
    const step2Timer = setTimeout(() => { activeStep = 3; }, 750);

    return () => {
      clearTimeout(step1Timer);
      clearTimeout(step2Timer);
    };
  });

  $effect(() => {
    if (isReady) {
      const timer = setTimeout(() => {
        isMounted = false;
      }, 700);
      return () => clearTimeout(timer);
    }
  });
</script>

{#if isMounted}
  <div
    role="status"
    aria-live="polite"
    class={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--bg)] text-[var(--ink)] select-none transition-all duration-700 ease-out ${
      isReady ? 'opacity-0 pointer-events-none scale-102' : 'opacity-100'
    } ${className}`}
  >
    <!-- Ambient Background Radial Glows -->
    <div class="absolute -top-48 -left-48 w-[500px] h-[500px] bg-sky-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
    <div class="absolute -bottom-48 -right-48 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse" style="animation-delay: 1.2s;"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

    <!-- Center Content Card -->
    <div class="relative flex flex-col items-center text-center max-w-lg px-6 z-10 space-y-8">
      
      <!-- Top Brandmark & Beta Tag -->
      <div class="flex flex-col items-center space-y-2">
        <div class="flex items-baseline gap-1">
          <span class="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--ink)] font-sans">
            Kurs
          </span>
          <span class="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--signal)] font-sans">
            .World
          </span>
          <span class="ml-2 text-[10px] font-bold tracking-widest uppercase text-[var(--ink-4)] px-2 py-0.5 border border-[var(--bg-rule)] rounded-md">
            {t('common.beta')}
          </span>
        </div>
        <p class="text-xs sm:text-sm text-[var(--ink-3)] font-medium max-w-sm">
          {t('splash.tagline')}
        </p>
      </div>

      <!-- Holographic Globe & Radar Scanner Visual -->
      <div class="relative flex items-center justify-center my-2">
        <!-- Orbit Ring 1 -->
        <div class="absolute w-44 h-44 rounded-full border border-dashed border-sky-500/40 animate-spin" style="animation-duration: 22s;"></div>

        <!-- Orbit Ring 2 -->
        <div class="absolute w-56 h-56 rounded-full border border-sky-400/20 animate-spin" style="animation-duration: 30s; animation-direction: reverse;"></div>

        <!-- Radar Pulse -->
        <div class="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-sky-500/25 via-emerald-500/15 to-transparent animate-ping opacity-50"></div>

        <!-- Center Sphere with Glowing Core -->
        <div class="relative w-24 h-24 rounded-full bg-gradient-to-b from-sky-950 via-slate-900 to-slate-950 border-2 border-sky-400/70 shadow-[0_0_50px_rgba(56,189,248,0.4)] flex items-center justify-center backdrop-blur-xl">
          <Globe class="w-12 h-12 text-sky-400 animate-pulse" />
          
          <!-- Crosshair HUD markers -->
          <div class="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-sky-400"></div>
          <div class="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-sky-400"></div>
          <div class="absolute left-1 top-1/2 -translate-y-1/2 w-0.5 h-2 bg-sky-400"></div>
          <div class="absolute right-1 top-1/2 -translate-y-1/2 w-0.5 h-2 bg-sky-400"></div>
        </div>
      </div>

      <!-- Telemetry Progress Log Box -->
      <div class="w-full bg-[var(--bg-raised)]/80 border border-[var(--bg-rule)] rounded-2xl p-4 shadow-2xl space-y-2.5 text-left backdrop-blur-xl">
        
        <!-- Step 1: Cloudflare Edge Network -->
        <div class="flex items-center gap-3 text-xs font-medium transition-all duration-300">
          {#if activeStep >= 1}
            <div class="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold">✓</div>
            <span class="text-emerald-400 font-semibold">{t('splash.edgeConnecting')}</span>
          {:else}
            <div class="w-4 h-4 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-[10px]">1</div>
            <span class="text-[var(--ink-4)]">{t('splash.edgeConnecting')}</span>
          {/if}
        </div>

        <!-- Step 2: 195+ World FX Rates -->
        <div class="flex items-center gap-3 text-xs font-medium transition-all duration-300">
          {#if activeStep >= 2}
            <div class="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold">✓</div>
            <span class="text-emerald-400 font-semibold">{t('splash.ratesLoading')}</span>
          {:else}
            <div class="w-4 h-4 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] animate-pulse">2</div>
            <span class="text-[var(--ink-4)]">{t('splash.ratesLoading')}</span>
          {/if}
        </div>

        <!-- Step 3: Interactive UI & 3D Globe -->
        <div class="flex items-center gap-3 text-xs font-medium transition-all duration-300">
          {#if isReady}
            <div class="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold">✓</div>
            <span class="text-emerald-400 font-semibold">{t('splash.uiPreparing')}</span>
          {:else if activeStep >= 3}
            <div class="w-4 h-4 rounded-full border border-sky-400 border-t-transparent animate-spin"></div>
            <span class="text-sky-400 font-semibold">{t('splash.uiPreparing')}</span>
          {:else}
            <div class="w-4 h-4 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-[10px]">3</div>
            <span class="text-[var(--ink-4)]">{t('splash.uiPreparing')}</span>
          {/if}
        </div>
      </div>

      <!-- Animated Progress Bar & Edge Badge -->
      <div class="w-full space-y-3">
        <div class="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden relative">
          <div
            class="h-full bg-gradient-to-r from-sky-500 via-emerald-400 to-indigo-500 rounded-full transition-all duration-500 ease-out"
            style={`width: ${isReady ? '100%' : activeStep === 1 ? '40%' : activeStep === 2 ? '75%' : '92%'};`}
          ></div>
        </div>

        <div class="flex items-center justify-between text-[11px] text-[var(--ink-4)]">
          <span class="flex items-center gap-1.5">
            <ShieldCheck class="w-3.5 h-3.5 text-emerald-400" />
            {t('splash.edgeBadge')}
          </span>
          <span class="font-mono text-[10px] text-sky-400">
            HTTP/3 · Edge 0ms Cold Start
          </span>
        </div>
      </div>

    </div>
  </div>
{/if}
