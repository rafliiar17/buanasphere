<script lang="ts">
  import { Coins, Clock, PlaneTakeoff, Stamp, ArrowRight, Globe2, Zap, Shield, Code2 } from 'lucide-svelte';

  const APPS = [
    {
      path: '/kurs',
      emoji: '💱',
      name: 'Kurs World',
      tagline: 'Nilai Tukar & Konversi Valas',
      description: 'Peta interaktif nilai tukar 195+ mata uang dunia vs Rupiah. Bandingkan kurs BCA, Mandiri, BNI, dan BI secara real-time.',
      gradFrom: '#06b6d4',
      gradTo: '#2563eb',
      borderColor: 'rgba(6,182,212,0.25)',
      badgeText: 'Live · 195+ Valas',
      badgeColor: 'rgba(6,182,212,0.15)',
      badgeTextColor: '#67e8f9',
      glowColor: 'rgba(6,182,212,0.06)',
    },
    {
      path: '/time',
      emoji: '🌐',
      name: 'Time World',
      tagline: 'Zona Waktu Global Real-Time',
      description: 'Pantau jam lokal seluruh dunia, filter negara yang sedang jam kerja, dan temukan zona waktu bisnis yang aktif sekarang.',
      gradFrom: '#f59e0b',
      gradTo: '#ea580c',
      borderColor: 'rgba(245,158,11,0.25)',
      badgeText: 'Real-Time UTC',
      badgeColor: 'rgba(245,158,11,0.15)',
      badgeTextColor: '#fcd34d',
      glowColor: 'rgba(245,158,11,0.06)',
    },
    {
      path: '/flight',
      emoji: '✈️',
      name: 'Flow Corridors',
      tagline: 'Rute Remitansi & Kiriman Uang',
      description: 'Visualisasi 3D rute remitansi dari Timur Tengah, ASEAN, Asia Timur, dan Barat ke Indonesia dengan volume transfer TKI.',
      gradFrom: '#10b981',
      gradTo: '#0d9488',
      borderColor: 'rgba(16,185,129,0.25)',
      badgeText: '4 Koridor Aktif',
      badgeColor: 'rgba(16,185,129,0.15)',
      badgeTextColor: '#6ee7b7',
      glowColor: 'rgba(16,185,129,0.06)',
    },
    {
      path: '/passport',
      emoji: '🛂',
      name: 'Passport World',
      tagline: 'Kekuatan Paspor & Visa WNI',
      description: 'Cek persyaratan visa WNI ke 195+ negara. Filter destinasi bebas visa, visa on arrival, eVisa, dan yang memerlukan visa.',
      gradFrom: '#8b5cf6',
      gradTo: '#7c3aed',
      borderColor: 'rgba(139,92,246,0.25)',
      badgeText: 'Paspor Indonesia',
      badgeColor: 'rgba(139,92,246,0.15)',
      badgeTextColor: '#c4b5fd',
      glowColor: 'rgba(139,92,246,0.06)',
    },
    {
      path: '/nature',
      emoji: '🌿',
      name: 'Nature World',
      tagline: 'Keanekaragaman Hayati & Satwa',
      description: 'Jelajahi satwa ikonik, flora khas, bioma habitat, dan status konservasi IUCN di 195+ negara serta 17 negara Megadiverse.',
      gradFrom: '#059669',
      gradTo: '#0d9488',
      borderColor: 'rgba(5,150,105,0.25)',
      badgeText: '195+ Satwa & Flora',
      badgeColor: 'rgba(5,150,105,0.15)',
      badgeTextColor: '#6ee7b7',
      glowColor: 'rgba(5,150,105,0.06)',
    },
    {
      path: '/capitals',
      emoji: '🏛️',
      name: 'World Capitals',
      tagline: 'Ibukota & Sejarah Kemerdekaan',
      description: '195+ ibukota berdaulat di bumi, tahun pendirian, asal kemerdekaan, pemutar lagu kebangsaan audio, dan pergerakan era sejarah.',
      gradFrom: '#6366f1',
      gradTo: '#8b5cf6',
      borderColor: 'rgba(99,102,241,0.25)',
      badgeText: '195+ Ibukota & Anthems',
      badgeColor: 'rgba(99,102,241,0.15)',
      badgeTextColor: '#a5b4fc',
      glowColor: 'rgba(99,102,241,0.06)',
    },
    {
      path: '/quake',
      emoji: '🌋',
      name: 'Earthquake Tracker',
      tagline: 'Aktivitas Seismik Real-Time',
      description: 'Pemantauan gempa bumi global & Indonesia (M4.5+), kedalaman hiposentrum, status tsunami, dan gelombang episentrum 3D.',
      gradFrom: '#ef4444',
      gradTo: '#f97316',
      borderColor: 'rgba(239,68,68,0.25)',
      badgeText: 'Live Seismik M4.5+',
      badgeColor: 'rgba(239,68,68,0.15)',
      badgeTextColor: '#fca5a5',
      glowColor: 'rgba(239,68,68,0.06)',
    },
  ];
</script>

<div class="min-h-screen w-screen bg-[#080C14] text-slate-100 overflow-x-hidden">

  <!-- Ambient Background Glows -->
  <div class="fixed inset-0 pointer-events-none overflow-hidden">
    <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full" style="background: radial-gradient(circle, rgba(6,182,212,0.04), transparent 70%);"></div>
    <div class="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full" style="background: radial-gradient(circle, rgba(139,92,246,0.04), transparent 70%);"></div>
  </div>

  <!-- Header -->
  <header class="relative border-b border-white/5 backdrop-blur-sm">
    <div class="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Globe2 class="w-5 h-5 text-cyan-400" />
        <span class="text-base font-extrabold tracking-tight">
          <span class="text-white">Buana</span><span class="text-cyan-400">sphere</span>
        </span>
        <span class="ml-1 text-[10px] font-semibold tracking-widest uppercase text-slate-500 border border-slate-700 rounded px-1.5 py-0.5">globe.arafz.id</span>
      </div>
      <div class="flex items-center gap-4">
        <a href="https://github.com/rafliiar17/buanasphere" target="_blank" rel="noopener noreferrer" class="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors">
          GitHub
        </a>
        <a href="/api/v1/docs" class="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors">
          <Code2 class="w-3.5 h-3.5" />
          Public API
        </a>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="relative max-w-5xl mx-auto px-6 pt-20 pb-10 text-center">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/8 text-cyan-300 text-xs font-semibold mb-6">
      <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block"></span>
      Data Langsung · Edge Network Global
    </div>

    <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4">
      Informasi Dunia<br />
      <span style="background: linear-gradient(90deg, #22d3ee, #60a5fa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
        Real-Time, Satu Platform
      </span>
    </h1>

    <p class="text-slate-400 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
      Peta interaktif 3D globe untuk kurs valas, zona waktu, remitansi, dan kekuatan paspor Indonesia.
      Transparan, gratis, tanpa registrasi.
    </p>

    <!-- Feature Pills -->
    <div class="flex flex-wrap justify-center gap-3 mb-14">
      <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
        <Zap class="w-3.5 h-3.5 text-cyan-400" />
        <span class="font-semibold text-white">Edge-First</span>
        <span class="text-slate-500">·</span>
        <span class="text-slate-400">&lt;50ms via Cloudflare Workers</span>
      </div>
      <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
        <Shield class="w-3.5 h-3.5 text-cyan-400" />
        <span class="font-semibold text-white">No Login</span>
        <span class="text-slate-500">·</span>
        <span class="text-slate-400">Transparan tanpa registrasi</span>
      </div>
      <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
        <Code2 class="w-3.5 h-3.5 text-cyan-400" />
        <span class="font-semibold text-white">Public API</span>
        <span class="text-slate-500">·</span>
        <span class="text-slate-400">REST API terbuka untuk developer</span>
      </div>
    </div>
  </section>

  <!-- App Cards Grid -->
  <section class="max-w-5xl mx-auto px-6 pb-20">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {#each APPS as app}
        <a
          href={app.path}
          class="group relative flex flex-col p-6 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden"
          style="border: 1px solid {app.borderColor}; background: {app.glowColor}; text-decoration: none;"
          onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = app.gradFrom + '88'; }}
          onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = app.borderColor; }}
        >
          <!-- Corner glow -->
          <div class="absolute top-0 right-0 w-28 h-28 rounded-bl-full pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity"
            style="background: linear-gradient(to bottom left, {app.gradFrom}, transparent);">
          </div>

          <!-- App Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-lg"
                style="background: linear-gradient(135deg, {app.gradFrom}, {app.gradTo});">
                {app.emoji}
              </div>
              <div>
                <div class="font-bold text-base text-white leading-tight">{app.name}</div>
                <div class="text-xs text-slate-400 mt-0.5">{app.tagline}</div>
              </div>
            </div>
            <span class="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style="background: {app.badgeColor}; color: {app.badgeTextColor};">
              {app.badgeText}
            </span>
          </div>

          <!-- Description -->
          <p class="text-sm text-slate-400 leading-relaxed flex-1 mb-5">{app.description}</p>

          <!-- CTA -->
          <div class="flex items-center gap-1.5 text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
            <span>Buka Aplikasi</span>
            <ArrowRight class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
          </div>
        </a>
      {/each}
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t border-white/5 py-6">
    <div class="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
      <span>© 2026 <strong>Buanasphere</strong> by <a href="https://github.com/rafliiar17" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:underline">Arafz</a>. Platform observatorium data dunia real-time.</span>
      <div class="flex items-center gap-4 flex-wrap">
        <a href="https://github.com/rafliiar17/buanasphere" target="_blank" rel="noopener noreferrer" class="hover:text-slate-300 transition-colors">GitHub</a>
        <a href="/api/v1/docs" class="hover:text-slate-300 transition-colors">API Docs</a>
        <a href="/kurs" class="hover:text-slate-300 transition-colors">Kurs</a>
        <a href="/time" class="hover:text-slate-300 transition-colors">Time</a>
        <a href="/flight" class="hover:text-slate-300 transition-colors">Flight</a>
        <a href="/passport" class="hover:text-slate-300 transition-colors">Passport</a>
        <a href="/nature" class="hover:text-slate-300 transition-colors">Nature</a>
        <a href="/capitals" class="hover:text-slate-300 transition-colors">Capitals</a>
        <a href="/quake" class="hover:text-slate-300 transition-colors">Quake</a>
      </div>
    </div>
  </footer>

</div>
