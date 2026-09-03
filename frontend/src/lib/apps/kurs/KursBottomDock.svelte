<script lang="ts">
  import { Globe, LineChart, TableProperties, Calculator, Sparkles, Bell } from 'lucide-svelte';
  import GlobalMoversTicker from '$lib/features/map/GlobalMoversTicker.svelte';
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

  const viewOptions = [
    { id: 'map', label: 'Peta Kurs Dunia', icon: Globe },
    { id: 'chart', label: 'Grafik & Analisis Tren', icon: LineChart },
    { id: 'matrix', label: 'Perbandingan Kurs Valas', icon: TableProperties },
    { id: 'converter', label: 'Kalkulator Konversi', icon: Calculator },
    { id: 'cards', label: 'Rate Cards', icon: Sparkles },
  ] as const;
</script>

<div class="pointer-events-none absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 z-20 flex flex-col sm:flex-row items-end justify-between gap-3 select-none">
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
