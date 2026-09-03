<script lang="ts">
  import { onMount } from 'svelte';
  import { Globe, LineChart, TableProperties, Calculator, Sparkles, Bell } from 'lucide-svelte';
  import GlobalMoversTicker from '$lib/features/map/GlobalMoversTicker.svelte';
  import { calculateMarketSessions } from '$lib/features/map/marketSessions';
  import { geoStore } from '$lib/framework/geoglobe/geoStore.svelte';
  import { t } from '$lib/i18n';

  interface Props {
    activeView?: 'map' | 'chart' | 'matrix' | 'converter' | 'cards';
    onSelectView?: (view: 'map' | 'chart' | 'matrix' | 'converter' | 'cards') => void;
    onSelectCurrency?: (currencyCode: string) => void;
    onOpenAlertModal?: () => void;
  }

  let {
    activeView = 'map',
    onSelectView = () => {},
    onSelectCurrency,
    onOpenAlertModal = () => {}
  }: Props = $props();

  let currentTime = $state(new Date());

  onMount(() => {
    const timer = setInterval(() => {
      currentTime = new Date();
    }, 10000);
    return () => clearInterval(timer);
  });

  const marketSummary = $derived(calculateMarketSessions(currentTime));

  const viewOptions = [
    { id: 'map', label: 'Peta Kurs Dunia', icon: Globe },
    { id: 'chart', label: 'Grafik & Analisis Tren', icon: LineChart },
    { id: 'matrix', label: 'Perbandingan Kurs Valas', icon: TableProperties },
    { id: 'converter', label: 'Kalkulator Konversi', icon: Calculator },
    { id: 'cards', label: 'Rate Cards', icon: Sparkles },
  ] as const;
</script>

<div class="pointer-events-none absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 z-20 flex flex-col items-stretch gap-2.5 select-none">
  <!-- Top Row: Live FX Market Sessions Strip -->
  <div class="pointer-events-auto flex items-center justify-between gap-3 overflow-x-auto">
    <div class="bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl px-3.5 py-1.5 flex items-center gap-3 overflow-x-auto max-w-full">
      <div class="flex items-center gap-2 text-xs font-bold text-emerald-400 border-r border-slate-800 pr-3 whitespace-nowrap">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>Pasar Valas Global:</span>
      </div>

      <div class="flex items-center gap-2 overflow-x-auto">
        {#each marketSummary.sessions as s}
          <button
            type="button"
            onclick={() => {
              geoStore.selectCountry(s.iso3);
              geoStore.travelToCountry?.(s.iso3);
              if (onSelectCurrency && s.currencyCode !== 'IDR') {
                onSelectCurrency(s.currencyCode);
              }
            }}
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition cursor-pointer text-xs whitespace-nowrap {s.isOpen
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'}"
            title="{s.sessionName} — {s.isOpen ? 'Sedang BUKA (Aktif)' : 'Sedang TUTUP'}"
          >
            <span>{s.flagEmoji}</span>
            <span class="font-medium">{s.city}</span>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded {s.isOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}">
              {s.isOpen ? 'OPEN' : 'CLOSED'}
            </span>
            <span class="font-mono text-[11px] text-slate-300">{s.localTimeFormatted}</span>
          </button>
        {/each}

        {#if marketSummary.isLondonNewYorkOverlap}
          <span class="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold whitespace-nowrap">
            🔥 Overlap London-NY (Puncak Likuiditas)
          </span>
        {/if}
      </div>
    </div>
  </div>

  <!-- Bottom Row: Currency Movers Ticker & Navigation View Pills -->
  <div class="flex flex-col sm:flex-row items-end justify-between gap-3">
    <!-- Floating Currency Ticker Strip -->
    <div class="pointer-events-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl px-3 py-1.5 overflow-hidden max-w-xl hidden lg:block">
      <GlobalMoversTicker onSelectCurrency={onSelectCurrency} />
    </div>

    <!-- Floating Navigation View Pills -->
    <div class="pointer-events-auto flex items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl overflow-x-auto ml-auto">
      {#each viewOptions as opt}
        {@const isActive = activeView === opt.id}
        {@const IconComponent = opt.icon}
        <button
          type="button"
          onclick={() => onSelectView(opt.id)}
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap {isActive
            ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'}"
        >
          <IconComponent class="w-3.5 h-3.5" />
          <span>{opt.label}</span>
        </button>
      {/each}

      <button
        type="button"
        onclick={onOpenAlertModal}
        class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/30 transition cursor-pointer"
        title={t('masthead.ctaAlert')}
      >
        <Bell class="w-3.5 h-3.5" />
        <span class="hidden md:inline">{t('masthead.ctaAlert')}</span>
      </button>
    </div>
  </div>
</div>
