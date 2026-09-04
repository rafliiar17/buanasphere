<script lang="ts">
  import { onMount } from 'svelte';
  import { Activity, Waves, Sparkles, AlertTriangle, Radio } from 'lucide-svelte';
  import { geoStore } from '$lib/framework/geoglobe/geoStore.svelte';
  import {
    fetchLiveEarthquakes,
    type LiveEarthquakeResult,
    type EnrichedEarthquakeRecord,
  } from '$lib/features/map/services/liveEarthquakeService';
  import { GLOBAL_EARTHQUAKES, type EarthquakeRecord } from '$lib/framework/geoglobe/data/earthquakeData';

  let earthquakeEvents = $state<EnrichedEarthquakeRecord[]>(GLOBAL_EARTHQUAKES);
  let autogempa = $state<EnrichedEarthquakeRecord | null>(null);
  let isLiveFeed = $state(false);
  let feedSource = $state<string>('USGS & BMKG');

  onMount(async () => {
    try {
      const result: LiveEarthquakeResult = await fetchLiveEarthquakes({ timeoutMs: 5000 });
      if (result?.events && result.events.length > 0) {
        earthquakeEvents = result.events;
        isLiveFeed = result.isLive;
        feedSource = result.source === 'hybrid_live' ? 'USGS & BMKG Live' : 'USGS Live Feed';
        autogempa = result.latestAutoGempa ?? null;
      }
    } catch {
      // Fallback to bundled dataset
      earthquakeEvents = GLOBAL_EARTHQUAKES;
    }
  });

  function handleQuakeClick(quake: EarthquakeRecord) {
    if (quake.countryIso3 && quake.countryIso3 !== 'GLOBAL') {
      geoStore.selectCountry(quake.countryIso3);
      geoStore.travelToCountry?.(quake.countryIso3);
    }
    geoStore.isInspectorOpen = true;
  }

  function getMagnitudeClass(mag: number): string {
    if (mag >= 6.0) return 'bg-rose-500 text-slate-950 font-black shadow-rose-900/50';
    if (mag >= 5.0) return 'bg-amber-500 text-slate-950 font-extrabold shadow-amber-900/50';
    return 'bg-emerald-500 text-slate-950 font-bold shadow-emerald-900/50';
  }
</script>

<div class="pointer-events-none absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 z-20 flex flex-col sm:flex-row items-end justify-between gap-3 select-none">
  {#if autogempa}
    <!-- BMKG Gempa Mutakhir Spotlight Card -->
    <div class="pointer-events-auto bg-slate-900/95 border border-rose-500/40 rounded-2xl shadow-2xl backdrop-blur-xl px-3.5 py-2 flex items-center gap-3">
      <div class="flex items-center gap-2">
        <span class="px-2 py-0.5 rounded-lg text-xs font-black bg-rose-500 text-slate-950 shadow-sm animate-pulse">
          M{autogempa.magnitude.toFixed(1)}
        </span>
        <div class="flex flex-col text-left">
          <div class="flex items-center gap-1.5 text-[11px] font-bold text-slate-200">
            <span class="text-rose-400">BMKG Mutakhir:</span>
            <span class="text-slate-200 truncate max-w-[180px] sm:max-w-[240px]">{autogempa.wilayahPusat || autogempa.place}</span>
          </div>
          <div class="text-[10px] text-slate-400 flex items-center gap-2">
            <span>Kedalaman: {autogempa.depthKm} km</span>
            {#if autogempa.tsunamiWarning}
              <span class="text-rose-400 font-bold flex items-center gap-1">
                <Waves class="w-3 h-3 text-rose-400 animate-pulse" />
                Siaga Tsunami
              </span>
            {:else}
              <span class="text-emerald-400 font-medium">Aman Tsunami</span>
            {/if}
          </div>
        </div>
      </div>
      <button
        type="button"
        onclick={() => handleQuakeClick(autogempa!)}
        class="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold transition cursor-pointer border border-rose-500/30 whitespace-nowrap"
      >
        Fokus 3D
      </button>
    </div>
  {/if}

  <!-- Horizontal Live Seismic Ticker Strip -->
  <div class="pointer-events-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl px-4 py-2 overflow-x-auto max-w-5xl flex items-center gap-4">
    <div class="flex items-center gap-2 text-xs font-bold text-rose-400 border-r border-slate-800 pr-3 whitespace-nowrap">
      <Radio class="w-3.5 h-3.5 text-rose-500 animate-pulse" />
      <span>Live Seismik ({feedSource}):</span>
    </div>

    <div class="flex items-center gap-2.5 overflow-x-auto py-0.5">
      {#each earthquakeEvents as quake (quake.id || quake.place)}
        <button
          type="button"
          onclick={() => handleQuakeClick(quake)}
          class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800/90 transition cursor-pointer text-xs whitespace-nowrap shadow-sm hover:border-slate-700"
          title={`Klik untuk zoom 3D ke ${quake.place}`}
        >
          <!-- Magnitude Badge -->
          <span class={`px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm ${getMagnitudeClass(quake.magnitude)}`}>
            M{quake.magnitude.toFixed(1)}
          </span>

          <!-- Location Name -->
          <span class="font-medium text-slate-200 max-w-[140px] truncate text-[11px]">{quake.place}</span>

          <!-- Depth -->
          <span class="text-[10px] font-mono text-slate-400">
            {quake.depthKm} km
          </span>

          {#if quake.tsunamiWarning}
            <span class="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/50">
              <Waves class="w-2.5 h-2.5 text-rose-400 animate-pulse" />
              <span>Tsunami</span>
            </span>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <!-- Inspector CTA Button -->
  <div class="pointer-events-auto flex items-center gap-2">
    <button
      type="button"
      onclick={() => { geoStore.isInspectorOpen = true; }}
      class="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-xl shadow-rose-950/50 transition cursor-pointer"
    >
      <Sparkles class="w-3.5 h-3.5" />
      <span>Peta Lempeng & Seismik</span>
    </button>
  </div>
</div>
