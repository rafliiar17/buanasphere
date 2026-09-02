<script lang="ts">
  import { Globe2, ShieldCheck, Zap, Heart } from 'lucide-svelte';
  import Badge from './ui/Badge.svelte';
</script>

<header class="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
  <!-- Top Non-Fintech Disclaimer Banner -->
  <div class="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/40 border-b border-indigo-500/10 px-4 py-1.5 text-center text-[11px] sm:text-xs font-medium text-slate-300 flex items-center justify-center gap-2">
    <ShieldCheck class="w-3.5 h-3.5 text-indigo-400 shrink-0" />
    <span>
      <strong>Informasi Kurs Publik</strong> • 100% Gratis • Non-Fintech • Tanpa Registrasi Wajib
    </span>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
    <!-- Brand Logo -->
    <div class="flex items-center gap-3">
      <div class="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
        <Globe2 class="w-6 h-6 text-white" />
      </div>
      <div>
        <div class="flex items-center gap-2">
          <span class="text-lg font-extrabold tracking-tight text-white">Kurs<span class="text-indigo-400">.World</span></span>
          <Badge variant="default" size="sm" class="hidden sm:inline-flex">v1.0</Badge>
        </div>
        <p class="text-[10px] text-slate-400 font-medium -mt-0.5 hidden xs:block">
          Agregator Valas Real-Time Indonesia
        </p>
      </div>
    </div>

    <!-- Live Status & Attributes -->
    <div class="flex items-center gap-3">
      <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>Live Edge Sync</span>
      </div>

      <a
        href="https://github.com"
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition flex items-center gap-1.5 font-medium"
      >
        <Zap class="w-3.5 h-3.5 text-indigo-400" />
        <span>Public API</span>
      </a>
    </div>
  </div>
</header>
