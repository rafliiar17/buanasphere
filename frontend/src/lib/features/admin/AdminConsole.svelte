<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    Shield, 
    Key, 
    RefreshCw, 
    Trash2, 
    Check, 
    AlertTriangle, 
    Database, 
    Server, 
    Layers, 
    Globe, 
    ExternalLink, 
    Plus, 
    Copy, 
    Lock, 
    Unlock, 
    LogOut,
    Eye,
    EyeOff,
    Flame,
    Cpu,
    ArrowLeft
  } from 'lucide-svelte';
  import { apiClient } from '$lib/api/client';
  import { geoRegistry } from '$lib/framework/geoglobe/appRegistry';

  let adminKey = $state<string>('');
  let isKeyVerified = $state<boolean>(false);
  let keyInput = $state<string>('');
  let keyError = $state<string | null>(null);
  let showSecret = $state<boolean>(false);

  // Tabs: 'ingest' | 'quarantine' | 'apikeys' | 'apps'
  let activeTab = $state<'ingest' | 'quarantine' | 'apikeys' | 'apps'>('ingest');

  // Health data
  let isLoadingHealth = $state(false);
  let healthData = $state<any>(null);

  // Ingest state
  let isIngesting = $state(false);
  let ingestResult = $state<any>(null);

  // Cache purge state
  let isPurgingCache = $state(false);
  let purgeResult = $state<any>(null);

  // Quarantine state
  let isLoadingQuarantine = $state(false);
  let quarantineItems = $state<any[]>([]);

  // API Keys state
  let isLoadingApiKeys = $state(false);
  let apiKeys = $state<any[]>([]);
  let isCreateKeyModalOpen = $state(false);
  let newKeyName = $state('');
  let newKeyEmail = $state('');
  let newKeyTier = $state<'free' | 'pro' | 'enterprise'>('free');
  let isCreatingKey = $state(false);
  let newlyCreatedKey = $state<any>(null);
  let isCopiedNewKey = $state(false);

  const registeredApps = geoRegistry.getAllApps();

  onMount(() => {
    if (typeof window !== 'undefined') {
      const savedKey = sessionStorage.getItem('kw_nimda_key');
      if (savedKey) {
        adminKey = savedKey;
        isKeyVerified = true;
        loadDashboardData(savedKey);
      }
    }
  });

  async function handleVerifyKey(e: Event) {
    e.preventDefault();
    if (!keyInput.trim()) return;
    keyError = null;

    try {
      const health = await apiClient.nimdaGetHealth(keyInput.trim());
      if (health && health.status === 'ok') {
        adminKey = keyInput.trim();
        isKeyVerified = true;
        sessionStorage.setItem('kw_nimda_key', adminKey);
        healthData = health;
        loadDashboardData(adminKey);
      } else {
        keyError = 'Secret key tidak valid atau akses ditolak.';
      }
    } catch (err: any) {
      keyError = err.message || 'Secret key tidak valid atau akses ditolak (401).';
    }
  }

  function handleLogout() {
    adminKey = '';
    isKeyVerified = false;
    keyInput = '';
    healthData = null;
    sessionStorage.removeItem('kw_nimda_key');
  }

  async function loadDashboardData(key: string) {
    loadHealth(key);
    loadQuarantine(key);
    loadApiKeys(key);
  }

  async function loadHealth(key: string) {
    isLoadingHealth = true;
    try {
      healthData = await apiClient.nimdaGetHealth(key);
    } catch (err) {
      console.error('Error loading health:', err);
    } finally {
      isLoadingHealth = false;
    }
  }

  async function handleTriggerIngest() {
    isIngesting = true;
    ingestResult = null;
    try {
      const res = await apiClient.nimdaTriggerIngest(adminKey);
      ingestResult = res;
      loadHealth(adminKey);
      loadQuarantine(adminKey);
    } catch (err: any) {
      ingestResult = { success: false, error: err.message };
    } finally {
      isIngesting = false;
    }
  }

  async function handlePurgeCache() {
    if (!confirm('Apakah Anda yakin ingin mem-purge seluruh live rates di Cloudflare KV?')) return;
    isPurgingCache = true;
    purgeResult = null;
    try {
      const res = await apiClient.nimdaPurgeCache(adminKey);
      purgeResult = res;
    } catch (err: any) {
      purgeResult = { success: false, error: err.message };
    } finally {
      isPurgingCache = false;
    }
  }

  async function loadQuarantine(key: string) {
    isLoadingQuarantine = true;
    try {
      const res = await apiClient.nimdaGetQuarantine(key);
      quarantineItems = res.items || [];
    } catch (err) {
      console.error('Error loading quarantine:', err);
    } finally {
      isLoadingQuarantine = false;
    }
  }

  async function handleClearQuarantineItem(id: number | string) {
    try {
      await apiClient.nimdaClearQuarantine(id, adminKey);
      quarantineItems = quarantineItems.filter((item) => item.id !== id);
    } catch (err) {
      console.error('Error clearing quarantine item:', err);
    }
  }

  async function loadApiKeys(key: string) {
    isLoadingApiKeys = true;
    try {
      const res = await apiClient.nimdaGetApiKeys(key);
      apiKeys = res.keys || [];
    } catch (err) {
      console.error('Error loading api keys:', err);
    } finally {
      isLoadingApiKeys = false;
    }
  }

  async function handleCreateApiKey(e: Event) {
    e.preventDefault();
    if (!newKeyName || !newKeyEmail) return;
    isCreatingKey = true;
    try {
      const res = await apiClient.nimdaCreateApiKey(
        { name: newKeyName, ownerEmail: newKeyEmail, tier: newKeyTier },
        adminKey
      );
      newlyCreatedKey = res.key;
      newKeyName = '';
      newKeyEmail = '';
      loadApiKeys(adminKey);
    } catch (err: any) {
      alert('Gagal membuat API Key: ' + err.message);
    } finally {
      isCreatingKey = false;
    }
  }

  async function handleToggleApiKey(id: string) {
    try {
      const res = await apiClient.nimdaToggleApiKey(id, adminKey);
      apiKeys = apiKeys.map((k) => (k.id === id ? { ...k, isActive: res.isActive } : k));
    } catch (err) {
      console.error('Error toggling API key:', err);
    }
  }

  async function handleDeleteApiKey(id: string) {
    if (!confirm(`Hapus permanen API key ${id}?`)) return;
    try {
      await apiClient.nimdaDeleteApiKey(id, adminKey);
      apiKeys = apiKeys.filter((k) => k.id !== id);
    } catch (err) {
      console.error('Error deleting API key:', err);
    }
  }

  function copyRawKey(token: string) {
    navigator.clipboard.writeText(token);
    isCopiedNewKey = true;
    setTimeout(() => {
      isCopiedNewKey = false;
    }, 2500);
  }

  function navigateToHome() {
    window.location.href = '/kurs';
  }
</script>

<svelte:head>
  <title>Nimda Operator Console — Kurs World</title>
</svelte:head>

<div class="min-h-screen w-full bg-slate-950 text-slate-100 font-sans flex flex-col antialiased">
  {#if !isKeyVerified}
    <!-- Key Gate View (Login) -->
    <div class="flex-1 flex items-center justify-center p-4 sm:p-6">
      <div class="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-2xl relative">
        <div class="flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto mb-5">
          <Shield class="w-7 h-7" />
        </div>

        <h1 class="text-xl font-bold text-center text-white mb-2">
          Nimda Operator Console
        </h1>
        <p class="text-xs text-center text-slate-400 mb-6 leading-relaxed">
          Masukkan kunci rahasia administrator (<code class="font-mono text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded">X-Admin-Key</code>) untuk mengakses dashboard operasional edge.
        </p>

        {#if keyError}
          <div class="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle class="w-4 h-4 shrink-0" />
            <span>{keyError}</span>
          </div>
        {/if}

        <form onsubmit={handleVerifyKey} class="space-y-4">
          <div>
            <label for="nimda-secret-input" class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Admin Secret Key
            </label>
            <div class="relative">
              <input
                id="nimda-secret-input"
                type={showSecret ? 'text' : 'password'}
                bind:value={keyInput}
                placeholder="kw_secret_..."
                required
                class="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 font-mono pr-10"
              />
              <button
                type="button"
                onclick={() => (showSecret = !showSecret)}
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {#if showSecret}
                  <EyeOff class="w-4 h-4" />
                {:else}
                  <Eye class="w-4 h-4" />
                {/if}
              </button>
            </div>
          </div>

          <button
            type="submit"
            class="w-full py-2.5 px-4 rounded-xl font-medium text-sm text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <Key class="w-4 h-4" />
            <span>Verifikasi & Masuk</span>
          </button>
        </form>

        <div class="mt-6 pt-4 border-t border-slate-800 text-center">
          <button
            type="button"
            onclick={navigateToHome}
            class="text-xs text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft class="w-3.5 h-3.5" />
            <span>Kembali ke Globe 3D</span>
          </button>
        </div>
      </div>
    </div>
  {:else}
    <!-- Operator Console Dashboard -->
    <header class="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400">
          <Shield class="w-4 h-4" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-sm font-bold text-white tracking-tight">NIMDA OPERATOR</h1>
            <span class="rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 text-[10px] font-mono font-bold">
              EDGE /nimda
            </span>
          </div>
          <p class="text-[11px] text-slate-400">
            Cloudflare Workers & D1 Operator Dashboard
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          type="button"
          onclick={() => loadDashboardData(adminKey)}
          class="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition text-xs flex items-center gap-1.5 cursor-pointer"
          title="Segarkan Data"
        >
          <RefreshCw class="w-3.5 h-3.5 {isLoadingHealth ? 'animate-spin' : ''}" />
          <span class="hidden sm:inline">Refresh</span>
        </button>

        <button
          type="button"
          onclick={navigateToHome}
          class="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Globe class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Globe 3D</span>
        </button>

        <button
          type="button"
          onclick={handleLogout}
          class="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>

    <!-- Main Container -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
      
      <!-- Top Health Metric Chips -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div class="rounded-xl bg-slate-900 border border-slate-800 p-4">
          <div class="flex items-center justify-between text-slate-400 mb-1">
            <span class="text-xs font-semibold uppercase">Cloudflare D1</span>
            <Database class="w-4 h-4 text-emerald-400" />
          </div>
          <div class="text-lg font-bold text-white">
            {healthData?.storage?.ratesCount ?? 0}
            <span class="text-xs font-normal text-slate-400">rates</span>
          </div>
          <p class="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Connected
          </p>
        </div>

        <div class="rounded-xl bg-slate-900 border border-slate-800 p-4">
          <div class="flex items-center justify-between text-slate-400 mb-1">
            <span class="text-xs font-semibold uppercase">Edge KV Cache</span>
            <Server class="w-4 h-4 text-cyan-400" />
          </div>
          <div class="text-lg font-bold text-white">
            TTL 15m SWR
          </div>
          <p class="text-[11px] text-cyan-400 mt-1">
            {healthData?.storage?.kvConnected ? 'Active Global Cache' : 'Local Fallback'}
          </p>
        </div>

        <div class="rounded-xl bg-slate-900 border border-slate-800 p-4">
          <div class="flex items-center justify-between text-slate-400 mb-1">
            <span class="text-xs font-semibold uppercase">Quarantine</span>
            <AlertTriangle class="w-4 h-4 {quarantineItems.length > 0 ? 'text-amber-400' : 'text-slate-500'}" />
          </div>
          <div class="text-lg font-bold {quarantineItems.length > 0 ? 'text-amber-300' : 'text-slate-300'}">
            {quarantineItems.length}
            <span class="text-xs font-normal text-slate-400">anomali</span>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">
            {quarantineItems.length > 0 ? 'Perlu tindakan' : 'Bersih'}
          </p>
        </div>

        <div class="rounded-xl bg-slate-900 border border-slate-800 p-4">
          <div class="flex items-center justify-between text-slate-400 mb-1">
            <span class="text-xs font-semibold uppercase">API Keys</span>
            <Key class="w-4 h-4 text-purple-400" />
          </div>
          <div class="text-lg font-bold text-white">
            {apiKeys.length}
            <span class="text-xs font-normal text-slate-400">kunci aktif</span>
          </div>
          <p class="text-[11px] text-purple-400 mt-1">
            Developer Public API
          </p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          type="button"
          onclick={() => (activeTab = 'ingest')}
          class="px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 {activeTab === 'ingest' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}"
        >
          <Flame class="w-3.5 h-3.5" />
          <span>⚡ Ingest & Cache</span>
        </button>

        <button
          type="button"
          onclick={() => (activeTab = 'quarantine')}
          class="px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 {activeTab === 'quarantine' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}"
        >
          <AlertTriangle class="w-3.5 h-3.5" />
          <span>🛡️ Karantina ({quarantineItems.length})</span>
        </button>

        <button
          type="button"
          onclick={() => (activeTab = 'apikeys')}
          class="px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 {activeTab === 'apikeys' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}"
        >
          <Key class="w-3.5 h-3.5" />
          <span>🔑 API Keys ({apiKeys.length})</span>
        </button>

        <button
          type="button"
          onclick={() => (activeTab = 'apps')}
          class="px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 {activeTab === 'apps' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}"
        >
          <Globe class="w-3.5 h-3.5" />
          <span>🌐 Micro-Apps ({registeredApps.length})</span>
        </button>
      </div>

      <!-- Tab 1: Ingest & Cache Content -->
      {#if activeTab === 'ingest'}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Ingestion Card -->
          <div class="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <div class="flex items-center gap-2.5">
              <div class="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <RefreshCw class="w-5 h-5 {isIngesting ? 'animate-spin' : ''}" />
              </div>
              <div>
                <h2 class="text-sm font-bold text-white">Manual Ingestion Force Trigger</h2>
                <p class="text-xs text-slate-400">Tarik data kurs valas terbaru dari provider aktif seketika.</p>
              </div>
            </div>

            <p class="text-xs text-slate-400 leading-relaxed">
              Memaksa siklus scraping <code class="text-slate-300 font-mono">AggregatorService.ingestAll()</code> untuk dieksekusi tanpa menunggu Cloudflare Cron Trigger 15-menit. Kurs yang memenuhi kriteria validasi akan langsung masuk ke database D1 dan memperbarui KV cache.
            </p>

            <button
              type="button"
              onclick={handleTriggerIngest}
              disabled={isIngesting}
              class="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw class="w-3.5 h-3.5 {isIngesting ? 'animate-spin' : ''}" />
              <span>{isIngesting ? 'Menjalankan Ingest...' : 'Tarik Data Kurs Sekarang'}</span>
            </button>

            {#if ingestResult}
              <div class="p-3.5 rounded-xl border {ingestResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'} text-xs space-y-1">
                <div class="font-bold flex items-center gap-1.5">
                  {#if ingestResult.success}
                    <Check class="w-4 h-4 text-emerald-400" />
                    <span>Ingestion Berhasil ({ingestResult.duration_ms}ms)</span>
                  {:else}
                    <AlertTriangle class="w-4 h-4 text-rose-400" />
                    <span>Ingestion Gagal</span>
                  {/if}
                </div>
                {#if ingestResult.result}
                  <p class="text-[11px] text-slate-300">
                    Rates diperbarui: <span class="font-bold">{ingestResult.result.ratesIngested}</span> • Anomali karantina: <span class="font-bold">{ingestResult.result.quarantinedCount}</span>
                  </p>
                {/if}
              </div>
            {/if}
          </div>

          <!-- Purge KV Card -->
          <div class="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <div class="flex items-center gap-2.5">
              <div class="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Flame class="w-5 h-5" />
              </div>
              <div>
                <h2 class="text-sm font-bold text-white">Edge KV Cache Invalidation</h2>
                <p class="text-xs text-slate-400">Purge cache kunci global live rates di Cloudflare KV.</p>
              </div>
            </div>

            <p class="text-xs text-slate-400 leading-relaxed">
              Kunci <code class="text-cyan-400 font-mono bg-cyan-500/10 px-1 py-0.5 rounded">kurs:latest:rates</code> akan dihapus dari KV. Permintaan API publik selanjutnya akan langsung mengambil data segar dari D1 database (Stale-While-Revalidate reset).
            </p>

            <button
              type="button"
              onclick={handlePurgeCache}
              disabled={isPurgingCache}
              class="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Flame class="w-3.5 h-3.5 {isPurgingCache ? 'animate-pulse' : ''}" />
              <span>{isPurgingCache ? 'Mem-purge Cache...' : 'Purge KV Cache (1-Click)'}</span>
            </button>

            {#if purgeResult}
              <div class="p-3.5 rounded-xl border bg-cyan-500/10 border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2">
                <Check class="w-4 h-4 text-cyan-400" />
                <span>{purgeResult.message || 'Cache berhasil dibersihkan.'}</span>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Tab 2: Quarantine Room Content -->
      {#if activeTab === 'quarantine'}
        <div class="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-sm font-bold text-white">Kamar Karantina Anomali Harga</h2>
              <p class="text-xs text-slate-400">Daftar kurs yang ditahan otomatis karena lonjakan harga tidak wajar atau sell &lt; buy.</p>
            </div>
            <button
              type="button"
              onclick={() => loadQuarantine(adminKey)}
              class="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw class="w-3.5 h-3.5 {isLoadingQuarantine ? 'animate-spin' : ''}" />
              <span>Segarkan</span>
            </button>
          </div>

          {#if quarantineItems.length === 0}
            <div class="p-12 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
              <Check class="w-8 h-8 text-emerald-400 mx-auto" />
              <p class="text-sm font-bold text-white">Kamar Karantina Bersih</p>
              <p class="text-xs text-slate-500">Tidak ada anomali harga yang terdeteksi dalam 100 siklus terakhir.</p>
            </div>
          {:else}
            <div class="overflow-x-auto rounded-xl border border-slate-800">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th class="p-3">ID</th>
                    <th class="p-3">Provider</th>
                    <th class="p-3">Pasangan</th>
                    <th class="p-3">Buy / Sell</th>
                    <th class="p-3">Alasan Karantina</th>
                    <th class="p-3">Waktu</th>
                    <th class="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-mono">
                  {#each quarantineItems as item}
                    <tr class="hover:bg-slate-800/40 transition">
                      <td class="p-3 text-slate-500">#{item.id}</td>
                      <td class="p-3 font-semibold text-slate-300">{item.provider}</td>
                      <td class="p-3 text-rose-400">{item.baseCurrency}/{item.quoteCurrency}</td>
                      <td class="p-3 text-slate-300">{item.buyRate} / {item.sellRate}</td>
                      <td class="p-3 font-sans text-slate-400 max-w-xs truncate" title={item.reason}>{item.reason}</td>
                      <td class="p-3 text-slate-500 text-[11px]">{new Date(item.createdAt).toLocaleString('id-ID')}</td>
                      <td class="p-3 text-right">
                        <button
                          type="button"
                          onclick={() => handleClearQuarantineItem(item.id)}
                          class="px-2 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 text-[11px] transition cursor-pointer"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Tab 3: API Keys Management Content -->
      {#if activeTab === 'apikeys'}
        <div class="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-sm font-bold text-white">Public Developer API Keys</h2>
              <p class="text-xs text-slate-400">Pengelolaan akses token pengembang pihak ketiga berbasis hash SHA-256 di D1.</p>
            </div>
            <button
              type="button"
              onclick={() => (isCreateKeyModalOpen = true)}
              class="py-2 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-purple-600/20"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Terbitkan Kunci Baru</span>
            </button>
          </div>

          <!-- Newly Created Key Banner (Shown Once) -->
          {#if newlyCreatedKey}
            <div class="p-4 rounded-xl bg-purple-500/10 border border-purple-500/40 text-purple-200 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-purple-300">⚠️ Kunci Baru Diterbitkan (Simpan Sekarang)</span>
                <button
                  type="button"
                  onclick={() => (newlyCreatedKey = null)}
                  class="text-xs text-slate-400 hover:text-white"
                >
                  Tutup
                </button>
              </div>
              <div class="flex items-center gap-2 font-mono text-sm bg-slate-950 px-3 py-2 rounded-lg border border-purple-500/30 text-emerald-400 break-all select-all">
                <span class="flex-1">{newlyCreatedKey.rawKey}</span>
                <button
                  type="button"
                  onclick={() => copyRawKey(newlyCreatedKey.rawKey)}
                  class="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Salin Kunci"
                >
                  {#if isCopiedNewKey}
                    <Check class="w-4 h-4 text-emerald-400" />
                  {:else}
                    <Copy class="w-4 h-4" />
                  {/if}
                </button>
              </div>
              <p class="text-[11px] text-purple-300">
                Pemilik: {newlyCreatedKey.ownerEmail} ({newlyCreatedKey.name}) • Tier: {newlyCreatedKey.tier}
              </p>
            </div>
          {/if}

          <!-- API Keys Table -->
          {#if apiKeys.length === 0}
            <div class="p-12 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
              <Key class="w-8 h-8 text-slate-600 mx-auto" />
              <p class="text-sm font-bold text-white">Belum Ada API Key</p>
              <p class="text-xs text-slate-500">Klik "Terbitkan Kunci Baru" untuk membuat akses token pengembang pertama.</p>
            </div>
          {:else}
            <div class="overflow-x-auto rounded-xl border border-slate-800">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th class="p-3">Nama Service</th>
                    <th class="p-3">Tier</th>
                    <th class="p-3">Owner Email</th>
                    <th class="p-3">Hash Preview</th>
                    <th class="p-3">Status</th>
                    <th class="p-3">Dibuat</th>
                    <th class="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-mono">
                  {#each apiKeys as k}
                    <tr class="hover:bg-slate-800/40 transition">
                      <td class="p-3 font-semibold text-white font-sans">{k.name}</td>
                      <td class="p-3">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase {k.tier === 'enterprise' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : k.tier === 'pro' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'}">
                          {k.tier}
                        </span>
                      </td>
                      <td class="p-3 text-slate-300 font-sans">{k.ownerEmail}</td>
                      <td class="p-3 text-slate-500 text-[11px]">{k.keyHashPreview}</td>
                      <td class="p-3 font-sans">
                        {#if k.isActive}
                          <span class="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Aktif
                          </span>
                        {:else}
                          <span class="inline-flex items-center gap-1 text-slate-500 text-[11px]">
                            <span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Nonaktif
                          </span>
                        {/if}
                      </td>
                      <td class="p-3 text-slate-500 text-[11px]">{new Date(k.createdAt).toLocaleDateString('id-ID')}</td>
                      <td class="p-3 text-right space-x-1.5">
                        <button
                          type="button"
                          onclick={() => handleToggleApiKey(k.id)}
                          class="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[11px] transition cursor-pointer"
                        >
                          {k.isActive ? 'Suspend' : 'Aktifkan'}
                        </button>
                        <button
                          type="button"
                          onclick={() => handleDeleteApiKey(k.id)}
                          class="px-2 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 text-[11px] transition cursor-pointer"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Tab 4: Micro-Apps Status Grid -->
      {#if activeTab === 'apps'}
        <div class="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
          <div>
            <h2 class="text-sm font-bold text-white">Status Ekosistem 7 Micro-Apps</h2>
            <p class="text-xs text-slate-400">Pantau ketersediaan dan rute kanonikal seluruh modul 3D Globe.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {#each registeredApps as app}
              <div class="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-white">{app.name}</span>
                    <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-emerald-400">
                      {app.canonicalPath || '/'}
                    </span>
                  </div>
                  <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {app.tagline}
                  </p>
                </div>

                <div class="flex items-center justify-between pt-3 border-t border-slate-900">
                  <span class="text-[11px] text-slate-500 uppercase font-mono">
                    Cat: {app.category}
                  </span>
                  <a
                    href={app.canonicalPath || '/kurs'}
                    class="text-xs text-rose-400 hover:text-rose-300 font-medium inline-flex items-center gap-1"
                  >
                    <span>Buka App</span>
                    <ExternalLink class="w-3 h-3" />
                  </a>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

    </main>

    <!-- Create API Key Dialog Modal -->
    {#if isCreateKeyModalOpen}
      <div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-sm font-bold text-white">Terbitkan Public Developer API Key</h3>
            <button
              type="button"
              onclick={() => (isCreateKeyModalOpen = false)}
              class="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <form onsubmit={handleCreateApiKey} class="space-y-3.5">
            <div>
              <label for="new-key-name" class="block text-xs font-medium text-slate-300 mb-1">
                Nama Layanan / Aplikasi
              </label>
              <input
                id="new-key-name"
                type="text"
                required
                placeholder="Contoh: FinTech Mobile App"
                bind:value={newKeyName}
                class="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label for="new-key-email" class="block text-xs font-medium text-slate-300 mb-1">
                Email Pengembang
              </label>
              <input
                id="new-key-email"
                type="email"
                required
                placeholder="developer@company.com"
                bind:value={newKeyEmail}
                class="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label for="new-key-tier" class="block text-xs font-medium text-slate-300 mb-1">
                Akses Tier
              </label>
              <select
                id="new-key-tier"
                bind:value={newKeyTier}
                class="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="free">Free (100 req/jam)</option>
                <option value="pro">Pro (5.000 req/jam)</option>
                <option value="enterprise">Enterprise (Unlimited)</option>
              </select>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onclick={() => (isCreateKeyModalOpen = false)}
                class="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isCreatingKey}
                class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition cursor-pointer disabled:opacity-50"
              >
                {isCreatingKey ? 'Membuat...' : 'Terbitkan Kunci'}
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}
  {/if}
</div>
