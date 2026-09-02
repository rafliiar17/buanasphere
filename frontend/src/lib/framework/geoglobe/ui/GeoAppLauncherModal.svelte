<script lang="ts">
  import { geoStore } from '../geoStore.svelte';
  import { resolveAppIdToPath } from '../router';
  import { Coins, Clock, Plane, BookOpen, Sparkles, X, Check, ArrowRight } from 'lucide-svelte';

  const ICONS: Record<string, any> = {
    Coins,
    Clock,
    Plane,
    BookOpen,
  };
</script>

{#if geoStore.isLauncherOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 transition-all animate-in fade-in duration-200"
    role="dialog"
    aria-modal="true"
    onclick={() => (geoStore.isLauncherOpen = false)}
    onkeydown={(e) => e.key === 'Escape' && (geoStore.isLauncherOpen = false)}
    tabindex="-1"
  >
    <!-- Modal Card -->
    <div
      class="relative w-full max-w-3xl rounded-3xl border border-slate-700/80 bg-slate-900/95 p-6 md:p-8 shadow-2xl backdrop-blur-xl text-slate-100 transition-all"
      onclick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <!-- Header -->
      <div class="flex items-start justify-between pb-6 border-b border-slate-800">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
            <Sparkles class="h-6 w-6 text-slate-950" />
          </div>
          <div>
            <h2 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              GeoGlobe App Suite
              <span class="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                globe.arafz.id
              </span>
            </h2>
            <p class="text-xs md:text-sm text-slate-400 mt-0.5">
              Pilih aplikasi mikro berbasis 3D WebGL Globe & Geolocation 195+ negara
            </p>
          </div>
        </div>

        <button
          type="button"
          class="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          onclick={() => (geoStore.isLauncherOpen = false)}
          aria-label="Tutup Menu"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- App Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        {#each geoStore.allApps as app (app.id)}
          {@const IconComponent = ICONS[app.icon] ?? Sparkles}
          {@const isActive = geoStore.activeAppId === app.id}
          {@const appPath = resolveAppIdToPath(app.id)}

          <button
            type="button"
            class="group relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all duration-200 {isActive
              ? 'border-emerald-500/80 bg-emerald-950/30 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50'
              : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/60'}"
            onclick={() => geoStore.switchApp(app.id)}
          >
            <!-- Card Header -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-xl {isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                    : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700 group-hover:text-white'}"
                >
                  <IconComponent class="h-5 w-5" />
                </div>

                <div class="flex items-center gap-2">
                  <span class="rounded bg-slate-800/90 px-2 py-0.5 text-[11px] font-mono font-bold text-cyan-400 border border-slate-700">
                    {appPath}
                  </span>
                  {#if isActive}
                    <span class="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
                      <Check class="h-3 w-3" /> Aktif
                    </span>
                  {/if}
                </div>
              </div>

              <h3 class="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                {app.name}
              </h3>
              <p class="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                {app.tagline}
              </p>
            </div>

            <!-- Metrics Preview Footer -->
            <div class="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
              <span class="text-slate-500">
                {app.metrics.length} Metrik Visual
              </span>
              <span class="flex items-center gap-1 font-medium {isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-white'} transition-colors">
                Buka {appPath} <ArrowRight class="h-3.5 w-3.5 transform group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </button>
        {/each}
      </div>

      <!-- Footer Info -->
      <div class="rounded-2xl bg-slate-950/60 p-4 border border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <div class="flex items-center gap-2">
          <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>100% In-Memory Path Routing • Zero Page Reload (Sub-10ms)</span>
        </div>
        <div class="hidden sm:block text-slate-500 font-mono text-[11px]">
          globe.arafz.id & api-globe.arafz.id
        </div>
      </div>
    </div>
  </div>
{/if}
