<script lang="ts">
  import { 
    Clock, 
    Search, 
    RotateCcw, 
    Sun, 
    Moon, 
    Sunrise,
    Sunset,
    Building2, 
    Eye, 
    EyeOff, 
    SlidersHorizontal,
    ExternalLink,
    Play,
    RotateCw,
    Sparkles
  } from 'lucide-svelte';
  import type { CountrySpatialMetadata } from '$lib/framework/geoglobe/types';
  import { EXTENDED_COUNTRIES_DATA } from '$lib/framework/geoglobe/countrySpatialData';
  import { 
    WORLD_CITIES_TIME, 
    type WorldCityTimeInfo 
  } from '$lib/framework/geoglobe/data/worldCitiesTimeData';
  import { 
    calculateLocalTime, 
    calculateSimulatedDateFromMinutes,
    formatUtcOffset, 
    getDiurnalPhase 
  } from '$lib/framework/geoglobe/geoMath';
  import { geoStore } from '$lib/framework/geoglobe/geoStore.svelte';

  interface Props {
    onSelectCountry?: (iso3: string) => void;
    onResetView?: () => void;
  }

  let { onSelectCountry, onResetView }: Props = $props();

  const timeFilter = $derived(geoStore.timeFilter);
  let searchQuery = $state('');
  let isSearchDropdownOpen = $state(false);

  let liveNow = $state(new Date());

  // Keep live digital clock ticking every second
  $effect(() => {
    const timer = setInterval(() => {
      liveNow = new Date();
    }, 1000);
    return () => clearInterval(timer);
  });

  const selectedCountry = $derived(geoStore.selectedCountry);

  // Derive effective date: if time travel scrubber is active, calculate virtual date
  const effectiveDate = $derived.by(() => {
    if (geoStore.isSimulatingTime) {
      return calculateSimulatedDateFromMinutes(
        geoStore.simulatedMinutes,
        geoStore.simulationAnchorZone,
        selectedCountry.utcOffset
      );
    }
    return liveNow;
  });

  // ==========================================
  // INDONESIAN 3-TIMEZONE SYNCHRONIZATION
  // ==========================================
  const wibTime = $derived(calculateLocalTime(effectiveDate, 7));
  const wibPhase = $derived(getDiurnalPhase(wibTime.hours, wibTime.minutes));

  const witaTime = $derived(calculateLocalTime(effectiveDate, 8));
  const witaPhase = $derived(getDiurnalPhase(witaTime.hours, witaTime.minutes));

  const witTime = $derived(calculateLocalTime(effectiveDate, 9));
  const witPhase = $derived(getDiurnalPhase(witTime.hours, witTime.minutes));

  // Current anchor time formatted
  const currentAnchorTimeFormatted = $derived.by(() => {
    switch (geoStore.simulationAnchorZone) {
      case 'WITA':
        return `${witaTime.formatted} WITA`;
      case 'WIT':
        return `${witTime.formatted} WIT`;
      case 'LOCAL':
        return `${localTime.formatted} (${selectedCountry.countryName})`;
      case 'WIB':
      default:
        return `${wibTime.formatted} WIB`;
    }
  });

  // ==========================================
  // SELECTED COUNTRY / CITY TIME DATA
  // ==========================================
  const localTime = $derived(calculateLocalTime(effectiveDate, selectedCountry.utcOffset));
  const selectedPhase = $derived(getDiurnalPhase(localTime.hours, localTime.minutes));

  const diffWib = $derived(selectedCountry.utcOffset - 7);
  const diffWita = $derived(selectedCountry.utcOffset - 8);
  const diffWit = $derived(selectedCountry.utcOffset - 9);

  // ==========================================
  // SEARCH AUTOCOMPLETE (120+ CITIES & COUNTRIES)
  // ==========================================
  interface SearchItem {
    type: 'city' | 'country';
    id: string;
    name: string;
    subtitle: string;
    flagEmoji: string;
    iso3: string;
    lat: number;
    lng: number;
    utcOffset: number;
    timezoneAbbr: string;
  }

  const searchResults = $derived.by<SearchItem[]>(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();

    // 1. Search World Cities
    const cityMatches = WORLD_CITIES_TIME.filter(
      (c) =>
        c.cityName.toLowerCase().includes(q) ||
        c.timezoneAbbr.toLowerCase() === q ||
        c.countryName.toLowerCase().includes(q)
    ).slice(0, 6).map((c): SearchItem => ({
      type: 'city',
      id: c.id,
      name: c.cityName,
      subtitle: `${c.countryName} • ${c.timezoneAbbr}`,
      flagEmoji: c.flagEmoji,
      iso3: c.countryIso3,
      lat: c.lat,
      lng: c.lng,
      utcOffset: c.utcOffset,
      timezoneAbbr: c.timezoneAbbr,
    }));

    // 2. Search Countries
    const countryMatches = EXTENDED_COUNTRIES_DATA.filter(
      (c) =>
        c.countryName.toLowerCase().includes(q) ||
        c.capital.toLowerCase().includes(q) ||
        c.iso3.toLowerCase().includes(q)
    ).slice(0, 6).map((c): SearchItem => ({
      type: 'country',
      id: c.iso3,
      name: c.countryName,
      subtitle: c.capital,
      flagEmoji: c.flagEmoji,
      iso3: c.iso3,
      lat: c.lat,
      lng: c.lng,
      utcOffset: c.utcOffset,
      timezoneAbbr: formatUtcOffset(c.utcOffset),
    }));

    return [...cityMatches, ...countryMatches].slice(0, 8);
  });

  function handleCitySelect(city: { iso3: string; lat: number; lng: number }) {
    geoStore.selectCountry(city.iso3);
    geoStore.travelToCountry(city.iso3);
    searchQuery = '';
    isSearchDropdownOpen = false;
    onSelectCountry?.(city.iso3);
  }

  function handleCountrySelect(iso3: string) {
    geoStore.selectCountry(iso3);
    geoStore.travelToCountry(iso3);
    searchQuery = '';
    isSearchDropdownOpen = false;
    onSelectCountry?.(iso3);
  }

  function handleSearchKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && searchResults.length > 0) {
      e.preventDefault();
      const first = searchResults[0];
      if (first.type === 'city') {
        handleCitySelect(first);
      } else {
        handleCountrySelect(first.iso3);
      }
    }
  }

  // ==========================================
  // TIME SCRUBBER CONTROLS
  // ==========================================
  function handleScrubberChange(e: Event) {
    const val = Number((e.target as HTMLInputElement).value);
    geoStore.setSimulatedMinutes(val);
  }

  function handlePresetJump(minutes: number) {
    geoStore.setSimulatedMinutes(minutes);
  }

  function handleResetLive() {
    geoStore.resetTimeToLive();
  }
</script>

<!-- Floating Top-Right Controls Card -->
<div class="absolute top-4 right-4 z-20 w-80 sm:w-92 flex flex-col gap-3 pointer-events-auto select-none">
  <div class="rounded-3xl border border-slate-700/80 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl text-slate-100 transition-all duration-200 flex flex-col gap-3">
    
    <!-- Header -->
    <div class="flex items-center justify-between pb-2.5 border-b border-slate-800">
      <div class="flex items-center gap-2">
        <Clock class="w-4 h-4 text-amber-400" />
        <span class="text-xs font-bold tracking-tight text-white uppercase">Pusat Kontrol Jam Global</span>
      </div>

      <div class="flex items-center gap-1.5">
        <!-- Live Indicator / Reset Button -->
        {#if geoStore.isSimulatingTime}
          <button
            type="button"
            onclick={handleResetLive}
            class="px-2 py-1 rounded-lg text-[10px] font-extrabold bg-rose-500 hover:bg-rose-400 text-white animate-pulse transition flex items-center gap-1 shadow cursor-pointer"
            title="Klik untuk kembali ke waktu live saat ini"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            <span>LIVE</span>
          </button>
        {:else}
          <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>LIVE</span>
          </span>
        {/if}

        <button
          type="button"
          onclick={onResetView}
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Reset Sudut Pandang Kamera"
        >
          <RotateCcw class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- 🇮🇩 INDONESIAN 3-TIMEZONE SYNCHRONIZATION RIBBON (WIB • WITA • WIT) -->
    <div class="rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-2.5 shadow-inner">
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
          <span>🇮🇩 Waktu Indonesia (3 Zona)</span>
        </span>
        <span class="text-[9px] text-slate-400 font-mono">Serempak</span>
      </div>

      <div class="grid grid-cols-3 gap-1.5">
        <!-- WIB -->
        <button
          type="button"
          onclick={() => geoStore.setSimulationAnchorZone('WIB')}
          class="p-1.5 rounded-xl border text-left transition cursor-pointer flex flex-col items-center justify-center {geoStore.simulationAnchorZone === 'WIB' ? 'bg-amber-500/20 border-amber-500/60 shadow-sm' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}"
          title="Jadikan WIB sebagai patokan waktu"
        >
          <div class="flex items-center gap-1 text-[10px] font-bold text-amber-300">
            <span>WIB</span>
            <span class="text-[9px] text-slate-400">(UTC+7)</span>
          </div>
          <span class="text-sm font-mono font-extrabold text-white mt-0.5">{wibTime.formatted}</span>
          <span class="text-[9px] text-slate-400 flex items-center gap-0.5 mt-0.5">
            <span>{wibPhase.emoji}</span>
            <span>Jakarta</span>
          </span>
        </button>

        <!-- WITA -->
        <button
          type="button"
          onclick={() => geoStore.setSimulationAnchorZone('WITA')}
          class="p-1.5 rounded-xl border text-left transition cursor-pointer flex flex-col items-center justify-center {geoStore.simulationAnchorZone === 'WITA' ? 'bg-amber-500/20 border-amber-500/60 shadow-sm' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}"
          title="Jadikan WITA sebagai patokan waktu"
        >
          <div class="flex items-center gap-1 text-[10px] font-bold text-amber-300">
            <span>WITA</span>
            <span class="text-[9px] text-slate-400">(UTC+8)</span>
          </div>
          <span class="text-sm font-mono font-extrabold text-white mt-0.5">{witaTime.formatted}</span>
          <span class="text-[9px] text-slate-400 flex items-center gap-0.5 mt-0.5">
            <span>{witaPhase.emoji}</span>
            <span>Bali • IKN</span>
          </span>
        </button>

        <!-- WIT -->
        <button
          type="button"
          onclick={() => geoStore.setSimulationAnchorZone('WIT')}
          class="p-1.5 rounded-xl border text-left transition cursor-pointer flex flex-col items-center justify-center {geoStore.simulationAnchorZone === 'WIT' ? 'bg-amber-500/20 border-amber-500/60 shadow-sm' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}"
          title="Jadikan WIT sebagai patokan waktu"
        >
          <div class="flex items-center gap-1 text-[10px] font-bold text-amber-300">
            <span>WIT</span>
            <span class="text-[9px] text-slate-400">(UTC+9)</span>
          </div>
          <span class="text-sm font-mono font-extrabold text-white mt-0.5">{witTime.formatted}</span>
          <span class="text-[9px] text-slate-400 flex items-center gap-0.5 mt-0.5">
            <span>{witPhase.emoji}</span>
            <span>Papua</span>
          </span>
        </button>
      </div>
    </div>

    <!-- ⏱️ INTERACTIVE 24-HOUR TIME SCRUBBER (TIME-TRAVEL ENGINE) -->
    <div class="rounded-2xl bg-slate-950/90 border border-slate-800 p-3 space-y-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <Clock class="w-3.5 h-3.5 text-amber-400" />
          <span class="text-[11px] font-bold text-slate-200">Simulasi Waktu 24 Jam</span>
        </div>

        <div class="flex items-center gap-1">
          <span class="text-[10px] font-mono font-extrabold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
            {currentAnchorTimeFormatted}
          </span>
        </div>
      </div>

      <!-- 24-Hour Range Slider -->
      <div class="space-y-1">
        <input
          type="range"
          min="0"
          max="1439"
          step="15"
          value={geoStore.isSimulatingTime ? geoStore.simulatedMinutes : (wibTime.hours * 60 + wibTime.minutes)}
          oninput={handleScrubberChange}
          class="w-full h-2 bg-gradient-to-r from-indigo-900 via-amber-500 to-indigo-950 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
        />
        <div class="flex items-center justify-between text-[9px] font-mono text-slate-400 px-0.5">
          <span>00:00</span>
          <span>06:00 🌅</span>
          <span>12:00 ☀️</span>
          <span>18:00 🌇</span>
          <span>23:59</span>
        </div>
      </div>

      <!-- Quick Preset Chips & Anchor Zone Buttons -->
      <div class="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/80">
        <div class="flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onclick={() => handlePresetJump(8 * 60)}
            class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            08:00 Pagi
          </button>
          <button
            type="button"
            onclick={() => handlePresetJump(12 * 60)}
            class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            12:00 Siang
          </button>
          <button
            type="button"
            onclick={() => handlePresetJump(17 * 60)}
            class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            17:00 Sore
          </button>
          <button
            type="button"
            onclick={() => handlePresetJump(21 * 60)}
            class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            21:00 Malam
          </button>
        </div>

        {#if geoStore.isSimulatingTime}
          <button
            type="button"
            onclick={handleResetLive}
            class="text-[9px] font-bold text-rose-400 hover:text-rose-300 underline cursor-pointer shrink-0"
          >
            Reset Live
          </button>
        {/if}
      </div>
    </div>

    <!-- Autocomplete Search Input (120+ Cities & Countries) -->
    <div class="relative">
      <div class="relative flex items-center">
        <Search class="absolute left-3 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Cari 120+ kota & negara (Tokyo, Bali, London)..."
          bind:value={searchQuery}
          onkeydown={handleSearchKeydown}
          onfocus={() => { isSearchDropdownOpen = true; }}
          class="w-full pl-9 pr-8 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
        />
      </div>

      <!-- Search Dropdown List -->
      {#if isSearchDropdownOpen && searchResults.length > 0}
        <div class="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl z-30 divide-y divide-slate-800">
          {#each searchResults as item}
            {@const itemTime = calculateLocalTime(effectiveDate, item.utcOffset)}
            {@const itemPhase = getDiurnalPhase(itemTime.hours, itemTime.minutes)}
            <button
              type="button"
              onclick={() => {
                if (item.type === 'city') handleCitySelect(item);
                else handleCountrySelect(item.iso3);
              }}
              class="w-full px-3 py-2 text-left hover:bg-slate-800/80 flex items-center justify-between transition text-xs cursor-pointer"
            >
              <div class="flex items-center gap-2 truncate">
                <span>{item.flagEmoji}</span>
                <span class="font-medium text-white truncate">{item.name}</span>
                <span class="text-[10px] text-slate-400 truncate">({item.subtitle})</span>
                {#if item.type === 'city'}
                  <span class="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono shrink-0">Kota</span>
                {/if}
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <span class="text-[10px]">{itemPhase.emoji}</span>
                <span class="text-[11px] font-mono font-bold text-amber-400">{itemTime.formatted}</span>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Projection Toggle, 3D Labels Toggle, and Timezone Lines Toggle -->
    <div class="grid grid-cols-3 gap-2">
      <button
        type="button"
        onclick={() => geoStore.setProjection(geoStore.projectionMode === 'globe' ? 'flat' : 'globe')}
        class="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border text-xs font-semibold transition cursor-pointer {geoStore.projectionMode === 'globe' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800/80 text-slate-400 border-slate-700'}"
      >
        <span>{geoStore.projectionMode === 'globe' ? '🌍 3D' : '🗺️ Datar'}</span>
      </button>

      <button
        type="button"
        onclick={() => { geoStore.showLabels = !geoStore.showLabels; }}
        class="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border text-xs font-semibold transition cursor-pointer {geoStore.showLabels ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800/80 text-slate-400 border-slate-700'}"
      >
        {#if geoStore.showLabels}
          <Eye class="w-3.5 h-3.5" />
          <span>Label: ON</span>
        {:else}
          <EyeOff class="w-3.5 h-3.5" />
          <span>Label: OFF</span>
        {/if}
      </button>

      <button
        type="button"
        onclick={() => geoStore.toggleTimezoneLines()}
        class="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border text-xs font-semibold transition cursor-pointer {geoStore.showTimezoneLines ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-800/80 text-slate-400 border-slate-700'}"
        title="Tampilkan / Sembunyikan Garis Zona Waktu 3D"
      >
        <span>🌐 Garis: {geoStore.showTimezoneLines ? 'ON' : 'OFF'}</span>
      </button>
    </div>

    <!-- 8-Phase Diurnal Solar Filters (ADR 0037) -->
    <div>
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Filter Waktu & Siklus Surya</span>
      <div class="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onclick={() => geoStore.setTimeFilter('all')}
          class="py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer {timeFilter === 'all' ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <span>🌐 Semua Zona</span>
        </button>

        <button
          type="button"
          onclick={() => geoStore.setTimeFilter('golden_hour')}
          class="py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer {timeFilter === 'golden_hour' ? 'bg-rose-500 text-slate-950 border-rose-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <Sunset class="w-3 h-3" />
          <span>Fajar & Senja 🌅</span>
        </button>

        <button
          type="button"
          onclick={() => geoStore.setTimeFilter('daylight')}
          class="py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer {timeFilter === 'daylight' ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <Sun class="w-3 h-3" />
          <span>Siang Hari ☀️</span>
        </button>

        <button
          type="button"
          onclick={() => geoStore.setTimeFilter('night')}
          class="py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer {timeFilter === 'night' ? 'bg-indigo-500 text-slate-950 border-indigo-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <Moon class="w-3 h-3" />
          <span>Malam Hari 🌙</span>
        </button>

        <button
          type="button"
          onclick={() => geoStore.setTimeFilter('working')}
          class="col-span-2 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer {timeFilter === 'working' ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow' : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'}"
        >
          <Building2 class="w-3 h-3" />
          <span>Jam Kantor Aktif (09:00 - 17:00)</span>
        </button>
      </div>
    </div>

    <!-- Active Country Time Card (IDN Default & Diurnal Phase) -->
    <div class="rounded-2xl bg-slate-950/80 border border-slate-800 p-3 space-y-2">
      <div class="flex items-center justify-between text-xs">
        <span class="font-bold text-slate-200 flex items-center gap-1.5">
          <span class="text-base">{selectedCountry.flagEmoji}</span>
          <span>{selectedCountry.countryName}</span>
        </span>
        <span class="font-mono text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
          {formatUtcOffset(selectedCountry.utcOffset)}
        </span>
      </div>

      <div class="flex items-center justify-between bg-slate-900/60 p-2 rounded-xl border border-slate-800">
        <div class="flex flex-col">
          <span class="text-[10px] text-slate-400 font-medium">Jam Lokal:</span>
          <span class="text-xl font-mono font-extrabold text-white tracking-tight">
            {localTime.formatted}
          </span>
        </div>

        <div class="text-right flex flex-col items-end">
          <span class="text-[10px] text-slate-400 font-medium mb-0.5">Fase Surya:</span>
          <span 
            class="px-2 py-0.5 rounded-lg text-[10px] font-bold text-white flex items-center gap-1 shadow-sm"
            style="background: {selectedPhase.colorRgba};"
          >
            <span>{selectedPhase.emoji}</span>
            <span>{selectedPhase.label}</span>
          </span>
        </div>
      </div>

      <!-- Comparative Offsets vs Indonesia (WIB, WITA, WIT) -->
      <div class="grid grid-cols-3 gap-1 pt-1 border-t border-slate-800/80 text-[10px]">
        <div class="bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/60 flex flex-col items-center text-center">
          <span class="text-slate-400 text-[9px]">vs WIB</span>
          <span class="font-bold text-white font-mono mt-0.5">{diffWib === 0 ? 'Sama' : `${diffWib > 0 ? '+' : ''}${diffWib}j`}</span>
        </div>
        <div class="bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/60 flex flex-col items-center text-center">
          <span class="text-slate-400 text-[9px]">vs WITA</span>
          <span class="font-bold text-white font-mono mt-0.5">{diffWita === 0 ? 'Sama' : `${diffWita > 0 ? '+' : ''}${diffWita}j`}</span>
        </div>
        <div class="bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/60 flex flex-col items-center text-center">
          <span class="text-slate-400 text-[9px]">vs WIT</span>
          <span class="font-bold text-white font-mono mt-0.5">{diffWit === 0 ? 'Sama' : `${diffWit > 0 ? '+' : ''}${diffWit}j`}</span>
        </div>
      </div>
    </div>

    <!-- Country Inspector CTA Button -->
    <button
      type="button"
      onclick={() => { geoStore.isInspectorOpen = true; }}
      class="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-950/50 transition flex items-center justify-center gap-2 cursor-pointer"
    >
      <span>🕒 Buka Time Inspector ({selectedCountry.countryName})</span>
      <ExternalLink class="w-3.5 h-3.5" />
    </button>
  </div>
</div>
