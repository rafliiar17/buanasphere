<script lang="ts">
  import { globeState, type ActiveMetric } from '../state/globeState.svelte';
  import {
    DollarSign,
    TrendingUp,
    Flag,
    Tag,
    Clock,
    Plus,
    Minus,
    RotateCcw,
  } from 'lucide-svelte';

  interface Props {
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onResetCamera?: () => void;
  }

  let { onZoomIn, onZoomOut, onResetCamera }: Props = $props();

  const metrics: Array<{ id: ActiveMetric; label: string; icon: any }> = [
    { id: 'rate', label: 'Kurs Spot', icon: DollarSign },
    { id: 'change', label: '24h Trend', icon: TrendingUp },
    { id: 'flag', label: 'Bendera', icon: Flag },
  ];

  function handleZoomIn() {
    globeState.zoomIn();
    onZoomIn?.();
  }

  function handleZoomOut() {
    globeState.zoomOut();
    onZoomOut?.();
  }

  function handleResetCamera() {
    globeState.resetCamera();
    onResetCamera?.();
  }
</script>

<div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 p-1.5 bg-slate-900/90 backdrop-blur-xl border border-slate-700/70 rounded-full shadow-2xl shadow-black/60 max-w-[95vw] overflow-x-auto no-scrollbar">
  <!-- Metric Switcher Group -->
  <div class="flex items-center gap-1 bg-slate-950/60 p-1 rounded-full border border-slate-800/80">
    {#each metrics as m (m.id)}
      {@const Icon = m.icon}
      <button
        onclick={() => globeState.setActiveMetric(m.id)}
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer {globeState.activeMetric === m.id
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}"
        title="Ubah metrik visualisasi: {m.label}"
      >
        <Icon class="w-3.5 h-3.5" />
        <span class="whitespace-nowrap">{m.label}</span>
      </button>
    {/each}
  </div>

  <div class="h-5 w-[1px] bg-slate-800 shrink-0"></div>

  <!-- Layers & Overlay Toggles -->
  <div class="flex items-center gap-1">
    <button
      onclick={() => globeState.toggleLabels()}
      class="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer {globeState.showLabels
        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'}"
      title="Tampilkan / Sembunyikan Label Nama Negara"
    >
      <Tag class="w-3.5 h-3.5" />
      <span class="hidden sm:inline">Label</span>
    </button>

    <button
      onclick={() => globeState.toggleTimezoneLines()}
      class="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer {globeState.showTimezoneLines
        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'}"
      title="Tampilkan Garis Bujur / Zona Waktu"
    >
      <Clock class="w-3.5 h-3.5" />
      <span class="hidden sm:inline">Zona Waktu</span>
    </button>
  </div>

  <div class="h-5 w-[1px] bg-slate-800 shrink-0"></div>

  <!-- Zoom & Camera Altitude Controls -->
  <div class="flex items-center gap-1">
    <button
      onclick={handleZoomIn}
      class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer"
      title="Perbesar (Zoom In)"
    >
      <Plus class="w-4 h-4" />
    </button>

    <button
      onclick={handleZoomOut}
      class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer"
      title="Perkecil (Zoom Out)"
    >
      <Minus class="w-4 h-4" />
    </button>

    <button
      onclick={handleResetCamera}
      class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer"
      title="Reset Kamera"
    >
      <RotateCcw class="w-3.5 h-3.5" />
    </button>
  </div>
</div>
