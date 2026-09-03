<script lang="ts">
  import { geoStore } from '../geoStore.svelte';
  import { resolveAppIdToPath } from '../router';
  import {
    Coins,
    Clock,
    Plane,
    BookOpen,
    Trees,
    Landmark,
    Users,
    Activity,
    Sparkles,
    X,
    Check,
    ArrowRight,
    Search
  } from 'lucide-svelte';

  const ICONS: Record<string, any> = {
    Coins,
    Clock,
    Plane,
    BookOpen,
    Trees,
    Landmark,
    Users,
    Activity,
  };

  let searchQuery = $state('');

  const filteredApps = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return geoStore.allApps;
    return geoStore.allApps.filter((app) => {
      const path = resolveAppIdToPath(app.id).toLowerCase();
      const name = app.name.toLowerCase();
      const tagline = (app.tagline || '').toLowerCase();
      return name.includes(q) || tagline.includes(q) || path.includes(q);
    });
  });

  function handleSelectApp(appId: string) {
    geoStore.switchApp(appId);
    geoStore.isLauncherOpen = false;
  }
</script>

{#if geoStore.isLauncherOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 md:p-6 transition-all animate-in fade-in duration-200"
    role="dialog"
    aria-modal="true"
    onclick={() => (geoStore.isLauncherOpen = false)}
    onkeydown={(e) => e.key === 'Escape' && (geoStore.isLauncherOpen = false)}
    tabindex="-1"
  >
    <!-- Modal Card (Viewport Constrained with max-h and flex-col) -->
    <div
      class="relative w-full max-w-4xl max-h-[88vh] sm:max-h-[85vh] flex flex-col rounded-3xl border border-slate-700/80 bg-slate-900/95 shadow-2xl backdrop-blur-xl text-slate-100 overflow-hidden transition-all"
      onclick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <!-- 1. Fixed Header (shrink-0) -->
      <header class="shrink-0 flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 bg-slate-900/90">
        <div class="flex items-center gap-3 sm:gap-3.5">
          <div class="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20 shrink-0">
            <Sparkles class="h-5 w-5 sm:h-6 sm:w-6 text-slate-950" />
          </div>
          <div>
            <h2 class="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              GeoGlobe App Suite
              <span class="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                {geoStore.allApps.length} Aplikasi
              </span>
            </h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5 line-clamp-1">
              Pilih aplikasi mikro berbasis 3D WebGL Globe & Geolocation 195+ negara
            </p>
          </div>
        </div>

        <button
          type="button"
          class="flex items-center gap-1.5 rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors border border-transparent hover:border-slate-700 cursor-pointer"
          onclick={() => (geoStore.isLauncherOpen = false)}
          aria-label="Tutup Menu"
        >
          <span class="hidden sm:inline text-[10px] font-mono font-semibold bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">ESC</span>
          <X class="h-5 w-5" />
        </button>
      </header>

      <!-- 2. Scrollable Content Area (flex-1 min-h-0 overflow-y-auto) -->
      <main class="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 overscroll-contain custom-scrollbar">
        <!-- Quick Search Bar -->
        <div class="relative mb-4 sm:mb-5">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Cari aplikasi berdasarkan nama, deskripsi, atau path (misal: /kurs, /time, gempa, paspor)..."
            class="w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
          />
          {#if searchQuery}
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              onclick={() => (searchQuery = '')}
              aria-label="Hapus Pencarian"
            >
              <X class="h-3.5 w-3.5" />
            </button>
          {/if}
        </div>

        <!-- Microapps Responsive Grid -->
        {#if filteredApps.length > 0}
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {#each filteredApps as app (app.id)}
              {@const IconComponent = (typeof app.icon === 'function' || (typeof app.icon === 'object' && app.icon !== null))
                ? app.icon
                : (typeof app.icon === 'string' && ICONS[app.icon] ? ICONS[app.icon] : Sparkles)}
              {@const isActive = geoStore.activeAppId === app.id}
              {@const appPath = resolveAppIdToPath(app.id)}

              <button
                type="button"
                class="group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer {isActive
                  ? 'border-emerald-500/80 bg-emerald-950/30 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                  : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/60 hover:shadow-md'}"
                onclick={() => handleSelectApp(app.id)}
              >
                <!-- Card Top -->
                <div>
                  <div class="flex items-center justify-between mb-2.5">
                    <div
                      class="flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105 {isActive
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                        : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700 group-hover:text-white'}"
                    >
                      <IconComponent class="h-4.5 w-4.5" />
                    </div>

                    <div class="flex items-center gap-1.5">
                      <span class="rounded bg-slate-800/90 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-400 border border-slate-700/80">
                        {appPath}
                      </span>
                      {#if isActive}
                        <span class="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-500/30">
                          <Check class="h-2.5 w-2.5" /> Aktif
                        </span>
                      {/if}
                    </div>
                  </div>

                  <h3 class="text-sm sm:text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {app.name}
                  </h3>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {app.tagline}
                  </p>
                </div>

                <!-- Card Bottom / Footer -->
                <div class="mt-3.5 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span class="text-[11px] text-slate-500">
                    {app.metrics.length} Metrik
                  </span>
                  <span class="flex items-center gap-1 text-[11px] font-medium {isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-white'} transition-colors">
                    Buka {appPath} <ArrowRight class="h-3 w-3 transform group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </button>
            {/each}
          </div>
        {:else}
          <!-- Empty State -->
          <div class="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <Search class="h-8 w-8 text-slate-600 mb-2 opacity-60" />
            <p class="text-sm font-semibold text-slate-300">Aplikasi tidak ditemukan</p>
            <p class="text-xs text-slate-500 mt-1">Tidak ada aplikasi yang cocok dengan kata kunci "{searchQuery}"</p>
            <button
              type="button"
              class="mt-3 text-xs text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
              onclick={() => (searchQuery = '')}
            >
              Reset pencarian
            </button>
          </div>
        {/if}
      </main>

      <!-- 3. Fixed Footer (shrink-0) -->
      <footer class="shrink-0 rounded-b-3xl bg-slate-950/80 px-5 py-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div class="flex items-center gap-2">
          <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-[11px] sm:text-xs">100% In-Memory Path Routing • Zero Page Reload (Sub-10ms)</span>
        </div>
        <div class="hidden sm:flex items-center gap-3 text-slate-500 font-mono text-[11px]">
          <span>globe.arafz.id</span>
          <span>•</span>
          <span>Tekan ESC untuk menutup</span>
        </div>
      </footer>
    </div>
  </div>
{/if}

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(51, 65, 85, 0.6);
    border-radius: 9999px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(100, 116, 139, 0.8);
  }
</style>
