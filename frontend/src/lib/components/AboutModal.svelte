<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    Globe, 
    X, 
    Github, 
    ExternalLink, 
    Layers, 
    Zap, 
    Shield, 
    Heart, 
    Code2, 
    Server,
    Sparkles
  } from 'lucide-svelte';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });

  const apps = [
    { icon: '💱', name: 'Kurs World', path: '/kurs', desc: 'Agregator kurs 195+ negara vs IDR, perbandingan bank komersial & sentral' },
    { icon: '☀️', name: 'TimeWorld', path: '/time', desc: 'Jam matahari diurnal 8-fase global, daylight tracker & referensi WIB' },
    { icon: '✈️', name: 'Flow Corridors', path: '/flight', desc: 'Visualisasi 3D koridor penerbangan remitansi & modal diaspora ke Indonesia' },
    { icon: '🛂', name: 'Passport World', path: '/passport', desc: 'Indeks kekuatan mobilitas paspor global & matriks bebas visa WNI' },
    { icon: '🌿', name: 'Nature World', path: '/nature', desc: 'Distribusi keanekaragaman hayati & flora-fauna endemik di berbagai bioma' },
    { icon: '🏛️', name: 'World Capitals', path: '/capitals', desc: '195+ ibukota berdaulat, sejarah hari kemerdekaan, & pemutar lagu kebangsaan' },
    { icon: '🌋', name: 'Earthquake Tracker', path: '/quake', desc: 'Pemantauan seismik global real-time (M4.5+) dengan gelombang episentrum 3D' },
  ];
</script>

{#if isOpen}
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    role="dialog"
    aria-modal="true"
    aria-labelledby="about-modal-title"
    onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div class="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900/95 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden font-sans">
      
      <!-- Top Accent Line -->
      <div class="h-1 w-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-rose-500"></div>

      <!-- Header -->
      <div class="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Globe class="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 id="about-modal-title" class="text-base font-extrabold text-white tracking-tight">
                Buanasphere
              </h2>
              <span class="rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono font-bold">
                v1.0 • Edge Platform
              </span>
            </div>
            <p class="text-xs text-slate-400">
              3D Geospatial Intelligence & Multi-App Planetary Platform
            </p>
          </div>
        </div>

        <button
          type="button"
          onclick={onClose}
          class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          aria-label="Tutup Modal"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300 leading-relaxed">
        
        <!-- Philosophy Section -->
        <div class="rounded-xl bg-slate-950/70 border border-slate-800 p-4 space-y-2">
          <div class="flex items-center gap-2 text-white font-bold text-xs">
            <Sparkles class="w-4 h-4 text-amber-400" />
            <span>Filosofi & Arti Nama Buanasphere</span>
          </div>
          <p class="text-slate-400">
            Nama <strong class="text-white">Buanasphere</strong> berasal dari kata <strong class="text-emerald-400">Buana</strong> <em>(Bahasa Sanskerta/Indonesia: Jagad Raya / Benua / Alam Dunia)</em> dan <strong class="text-cyan-400">Sphere</strong> <em>(Lingkup Bola 3D Bumi)</em>.
          </p>
          <p class="text-slate-400">
            Berprinsip <em>"Informasi Dulu, Transaksi Belakangan"</em> — menyediakan observatorium data dunia yang transparan, jujur, bebas hambatan, dan tanpa bias komersial.
          </p>
        </div>

        <!-- 7 Planetary Apps Showcase -->
        <div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Layers class="w-3.5 h-3.5 text-cyan-400" />
            <span>Ekosistem 7 Micro-Apps Interaktif</span>
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {#each apps as item}
              <a
                href={item.path}
                onclick={onClose}
                class="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40 transition group flex items-start gap-2.5 no-underline"
              >
                <span class="text-lg shrink-0 mt-0.5">{item.icon}</span>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 font-bold text-white group-hover:text-cyan-400 transition">
                    <span class="truncate">{item.name}</span>
                    <span class="text-[10px] font-mono text-slate-500 font-normal">{item.path}</span>
                  </div>
                  <p class="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </a>
            {/each}
          </div>
        </div>

        <!-- Tech Stack -->
        <div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
            <Server class="w-3.5 h-3.5 text-rose-400" />
            <span>Arsitektur & Teknologi Terdepan</span>
          </h3>
          <div class="flex flex-wrap gap-2 text-[11px]">
            <span class="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium">⚡ Bun v1.4+ Runtime</span>
            <span class="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium">🌐 Cloudflare Workers Edge</span>
            <span class="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium">🏎️ Elysia.js (TypeBox)</span>
            <span class="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium">🔥 Svelte 5 (Runes)</span>
            <span class="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium">🌍 Three.js & Globe.gl (WebGL)</span>
            <span class="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium">💾 Cloudflare D1 & KV Cache</span>
          </div>
        </div>

        <!-- Official Links & URLs -->
        <div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
            <Code2 class="w-3.5 h-3.5 text-emerald-400" />
            <span>Tautan Resmi & Dokumentasi Publik</span>
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href="https://globe.arafz.id"
              target="_blank"
              rel="noopener noreferrer"
              class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-white flex items-center justify-between no-underline transition"
            >
              <div class="flex items-center gap-2">
                <Globe class="w-4 h-4 text-cyan-400" />
                <span class="font-medium">globe.arafz.id</span>
              </div>
              <ExternalLink class="w-3.5 h-3.5 text-slate-500" />
            </a>

            <a
              href="https://github.com/rafliiar17/buanasphere"
              target="_blank"
              rel="noopener noreferrer"
              class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-white flex items-center justify-between no-underline transition"
            >
              <div class="flex items-center gap-2">
                <Github class="w-4 h-4 text-purple-400" />
                <span class="font-medium">GitHub Repository</span>
              </div>
              <ExternalLink class="w-3.5 h-3.5 text-slate-500" />
            </a>

            <a
              href="https://globe.arafz.id/swagger"
              target="_blank"
              rel="noopener noreferrer"
              class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-white flex items-center justify-between no-underline transition"
            >
              <div class="flex items-center gap-2">
                <Code2 class="w-4 h-4 text-emerald-400" />
                <span class="font-medium">Swagger REST API Docs</span>
              </div>
              <ExternalLink class="w-3.5 h-3.5 text-slate-500" />
            </a>

            <a
              href="/nimda"
              onclick={onClose}
              class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-white flex items-center justify-between no-underline transition"
            >
              <div class="flex items-center gap-2">
                <Shield class="w-4 h-4 text-rose-400" />
                <span class="font-medium">Edge Operator Console</span>
              </div>
              <ExternalLink class="w-3.5 h-3.5 text-slate-500" />
            </a>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0 text-[11px] text-slate-400">
        <div class="flex items-center gap-1.5">
          <span>Dibuat dengan</span>
          <Heart class="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          <span>oleh</span>
          <a
            href="https://github.com/rafliiar17"
            target="_blank"
            rel="noopener noreferrer"
            class="text-cyan-400 hover:underline font-bold"
          >
            Arafz (rafliiar17)
          </a>
        </div>

        <button
          type="button"
          onclick={onClose}
          class="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition cursor-pointer"
        >
          Tutup
        </button>
      </div>

    </div>
  </div>
{/if}

<style>
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-spin-slow {
    animation: spin-slow 20s linear infinite;
  }
</style>
