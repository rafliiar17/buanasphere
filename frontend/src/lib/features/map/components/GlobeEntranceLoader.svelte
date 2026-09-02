<script lang="ts">
  import { onMount } from 'svelte';
  import { Globe, Sparkles, Cpu, Radio, ShieldCheck } from 'lucide-svelte';
  import { t } from '$lib/i18n';

  interface Props {
    isReady: boolean;
    class?: string;
  }

  let { isReady, class: className = '' }: Props = $props();

  let activeStep = $state(1);
  let isMounted = $state(true);

  onMount(() => {
    const step1Timer = setTimeout(() => { activeStep = 2; }, 400);
    const step2Timer = setTimeout(() => { activeStep = 3; }, 900);

    return () => {
      clearTimeout(step1Timer);
      clearTimeout(step2Timer);
    };
  });

  // When isReady becomes true, trigger smooth unmount after transition completes
  $effect(() => {
    if (isReady) {
      const unmountTimer = setTimeout(() => {
        isMounted = false;
      }, 700);
      return () => clearTimeout(unmountTimer);
    }
  });
</script>

{#if isMounted}
  <div
    role="status"
    aria-live="polite"
    class={`absolute inset-0 z-40 flex flex-col items-center justify-center bg-[var(--bg)]/95 backdrop-blur-2xl transition-all duration-700 ease-out select-none ${
      isReady ? 'opacity-0 pointer-events-none scale-102' : 'opacity-100'
    } ${className}`}
  >
    <!-- Background Ambient Radial Glows -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" style="animation-delay: 1s;"></div>

    <!-- Center Holographic Globe Container -->
    <div class="relative flex items-center justify-center mb-8">
      
      <!-- Outer Orbit Ring 1 (Clockwise) -->
      <div class="absolute w-44 h-44 rounded-full border border-dashed border-sky-500/40 animate-spin" style="animation-duration: 20s;"></div>

      <!-- Outer Orbit Ring 2 (Counter-Clockwise) -->
      <div class="absolute w-56 h-56 rounded-full border border-sky-400/20 animate-spin" style="animation-duration: 28s; animation-direction: reverse;"></div>

      <!-- Radial Radar Scanner Pulse -->
      <div class="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-sky-500/20 via-emerald-500/10 to-transparent animate-ping opacity-40"></div>

      <!-- Center Holographic Sphere -->
      <div class="relative w-28 h-28 rounded-full bg-gradient-to-b from-sky-900/60 to-slate-950/80 border-2 border-sky-400/60 shadow-[0_0_40px_rgba(56,189,248,0.35)] flex items-center justify-center backdrop-blur-md">
        <Globe class="w-14 h-14 text-sky-400 animate-pulse" />
        
        <!-- Crosshair HUD markers -->
        <div class="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-sky-400"></div>
        <div class="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-sky-400"></div>
        <div class="absolute left-1 top-1/2 -translate-y-1/2 w-0.5 h-2 bg-sky-400"></div>
        <div class="absolute right-1 top-1/2 -translate-y-1/2 w-0.5 h-2 bg-sky-400"></div>
      </div>
    </div>

    <!-- Title & Status Readout Card -->
    <div class="flex flex-col items-center text-center max-w-md px-6 z-10 space-y-4">
      
      <!-- Live Pill Badge -->
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--bg-raised)] border border-[var(--bg-rule)] shadow-lg">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span class="text-xs font-bold tracking-wide text-[var(--ink)]">
          {t('map.loader.initializing')}
        </span>
      </div>

      <!-- Subtitle description -->
      <p class="text-xs text-[var(--ink-4)] leading-relaxed">
        {t('map.loader.subInitializing')}
      </p>

      <!-- Step Telemetry Tracker -->
      <div class="w-full bg-[var(--bg-raised)]/90 border border-[var(--bg-rule)] rounded-2xl p-3.5 shadow-xl space-y-2 text-left backdrop-blur-sm">
        
        <!-- Step 1: GeoJSON Geometry -->
        <div class="flex items-center gap-2.5 text-[11px] font-medium transition-all duration-300">
          {#if activeStep >= 1}
            <div class="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[9px] font-bold">✓</div>
            <span class="text-emerald-400 font-semibold">{t('map.loader.step1')}</span>
          {:else}
            <div class="w-4 h-4 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-[9px]">1</div>
            <span class="text-[var(--ink-4)]">{t('map.loader.step1')}</span>
          {/if}
        </div>

        <!-- Step 2: Three.js Shaders -->
        <div class="flex items-center gap-2.5 text-[11px] font-medium transition-all duration-300">
          {#if activeStep >= 2}
            <div class="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[9px] font-bold">✓</div>
            <span class="text-emerald-400 font-semibold">{t('map.loader.step2')}</span>
          {:else}
            <div class="w-4 h-4 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-[9px] animate-pulse">2</div>
            <span class="text-[var(--ink-4)]">{t('map.loader.step2')}</span>
          {/if}
        </div>

        <!-- Step 3: Live Rates Sync -->
        <div class="flex items-center gap-2.5 text-[11px] font-medium transition-all duration-300">
          {#if isReady}
            <div class="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[9px] font-bold">✓</div>
            <span class="text-emerald-400 font-semibold">{t('map.loader.step3')}</span>
          {:else if activeStep >= 3}
            <div class="w-4 h-4 rounded-full border border-sky-400 border-t-transparent animate-spin"></div>
            <span class="text-sky-400 font-semibold">{t('map.loader.step3')}</span>
          {:else}
            <div class="w-4 h-4 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-[9px]">3</div>
            <span class="text-[var(--ink-4)]">{t('map.loader.step3')}</span>
          {/if}
        </div>
      </div>

      <!-- Animated Shimmer Progress Bar -->
      <div class="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden relative">
        <div
          class="h-full bg-gradient-to-r from-sky-500 via-emerald-400 to-indigo-500 rounded-full transition-all duration-500 ease-out"
          style={`width: ${isReady ? '100%' : activeStep === 1 ? '35%' : activeStep === 2 ? '70%' : '90%'};`}
        ></div>
      </div>
    </div>
  </div>
{/if}
