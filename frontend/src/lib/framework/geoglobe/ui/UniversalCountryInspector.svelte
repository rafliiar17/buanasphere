<script lang="ts">
  import { geoStore } from '../geoStore.svelte';
  import { X, Globe2, Compass } from 'lucide-svelte';

  const country = $derived(geoStore.selectedCountry);
  const activeApp = $derived(geoStore.activeApp);
  const appData = $derived(geoStore.currentAppData[country.iso3]);

  const widget = $derived(
    activeApp?.renderInspector
      ? activeApp.renderInspector(country as any, appData, geoStore.currentAppData)
      : null
  );
</script>

{#if geoStore.isInspectorOpen && country}
  <!-- Slide-Over Docked Panel (Right Side on Desktop / Bottom Sheet on Mobile) -->
  <aside
    class="absolute right-0 top-0 bottom-0 z-30 w-full sm:w-96 md:w-[420px] bg-slate-900/95 border-l border-slate-700/80 backdrop-blur-xl shadow-2xl flex flex-col justify-between transition-all duration-300 animate-in slide-in-from-right"
    aria-label="Panel Inspeksi Negara"
  >
    <!-- Header -->
    <div class="p-6 border-b border-slate-800/80">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <span class="text-4xl shadow-sm">{country.flagEmoji}</span>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-bold text-white tracking-tight">
                {country.countryName}
              </h2>
              <span class="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-300 border border-slate-700">
                {country.iso3}
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              {country.capital} • {country.region}
            </p>
          </div>
        </div>

        <button
          type="button"
          class="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          onclick={() => geoStore.closeInspector()}
          aria-label="Tutup Panel"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Active App Tagline Badge -->
      <div class="mt-4 flex items-center justify-between rounded-xl bg-slate-950/60 px-3 py-2 border border-slate-800/60 text-xs">
        <span class="font-medium text-emerald-400 flex items-center gap-1.5">
          <Globe2 class="h-3.5 w-3.5" /> {activeApp.name}
        </span>
        <span class="text-slate-500 font-mono text-[11px]">
          Lat: {country.lat.toFixed(1)}° | Lon: {country.lng.toFixed(1)}°
        </span>
      </div>
    </div>

    <!-- Body / Dynamic Widget Content -->
    <div class="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
      {#if widget}
        <!-- Hero Primary Value Card -->
        <div class="rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-slate-700/80 p-5 shadow-lg relative overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {widget.title}
            </span>
            {#if widget.badge}
              <span
                class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold border {widget.badge.variant === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : widget.badge.variant === 'warning'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : widget.badge.variant === 'danger'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'}"
              >
                {widget.badge.text}
              </span>
            {/if}
          </div>

          {#if widget.primaryValue}
            <div class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              {widget.primaryValue}
            </div>
          {/if}

          {#if widget.subtitle}
            <p class="text-xs text-slate-400 mt-1">
              {widget.subtitle}
            </p>
          {/if}
        </div>

        <!-- Stats Grid -->
        {#if widget.statsGrid && widget.statsGrid.length > 0}
          <div class="grid grid-cols-2 gap-3">
            {#each widget.statsGrid as stat}
              <div class="rounded-xl bg-slate-950/50 border border-slate-800/80 p-3.5">
                <span class="text-[11px] text-slate-400 block font-medium">
                  {stat.label}
                </span>
                <span class="text-sm font-bold text-slate-200 mt-0.5 block font-mono">
                  {stat.value}
                </span>
              </div>
            {/each}
          </div>
        {/if}
      {:else}
        <div class="rounded-xl bg-slate-950/40 p-6 text-center text-slate-400 text-xs">
          Memuat data statistik negara...
        </div>
      {/if}

      <!-- Geographic Coordinates Box -->
      <div class="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 text-xs text-slate-400 space-y-1.5">
        <div class="flex items-center gap-1.5 font-medium text-slate-300">
          <Compass class="h-3.5 w-3.5 text-emerald-400" /> Informasi Geografis Spasial
        </div>
        <div class="flex justify-between text-[11px]">
          <span>Zona Waktu:</span>
          <span class="font-mono text-slate-300">UTC{country.utcOffset >= 0 ? '+' : ''}{country.utcOffset}:00</span>
        </div>
        <div class="flex justify-between text-[11px]">
          <span>Mata Uang Resmi:</span>
          <span class="font-mono text-slate-300">{country.currencyCode} - {country.currencyName}</span>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
      <button
        type="button"
        class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-md shadow-emerald-950/50 transition-all flex items-center justify-center gap-2"
        onclick={() => geoStore.closeInspector()}
      >
        Lanjutkan Eksplorasi Globe
      </button>
    </div>
  </aside>
{/if}

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.4);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(51, 65, 85, 0.6);
    border-radius: 9999px;
  }
</style>
