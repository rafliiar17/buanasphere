# ADR 0029: Clean DOM Mounting Target & Literal Reactive Map State Proxy

## Status
**Accepted**

## Context & Problem Statement
1. Di `frontend/index.html`, elemen static overlay `<div style="position:fixed;inset:0;...z-index:999">` disematkan di dalam `<div id="app">`. Ketika Svelte 5 me-mount aplikasi via `mount(App, { target: document.getElementById('app')! })`, Svelte 5 meng-append komponen ke target tanpa membersihkan elemen HTML sebelumnya, sehingga overlay statis menutupi seluruh antarmuka secara permanen (*perpetual loading*).
2. Di `MapControlsToolbar.svelte`, `bind:value={mapState.searchQuery}` memicu runtime warning `binding_property_non_reactive` karena instansi kelas TypeScript biasa tidak ter-proxy sebagai Svelte 5 reactive signals.

## Decision Drivers
- **Guaranteed Splash Dismissal**: Seluruh splash screen dikelola secara tunggal oleh Svelte komponen `GlobalAppSplashScreen.svelte` di `App.svelte` yang memiliki siklus transisi dan unmount otomatis.
- **Clean Mounting Target**: Memastikan target `#app` selalu kosong bersih sebelum dan selama hidrasi Svelte 5.
- **Deep Reactivity Proxy**: Menjadikan state peta sebagai plain object literal dengan deep reactivity Svelte 5 untuk mendukung two-way binding (`bind:value`).

## Architecture Decisions

### 1. Pembersihan `index.html` & `main.ts`
- Mengosongkan `<div id="app"></div>` di `index.html`.
- Menambahkan `target.innerHTML = ''` di `main.ts` sebelum memanggil `mount(App, { target })`.

### 2. Literal Reactive State Factory di `mapState.ts`
- Mengubah `createMapState()` agar mengembalikan objek literal TypeScript dengan properti dan method manipulasi peta:
  ```ts
  export function createMapState(initial?: Partial<MapStateConfig>): MapStateStore {
    return {
      projectionMode: initial?.projectionMode ?? 'globe',
      activeMetric: initial?.activeMetric ?? 'rate',
      activeRegion: initial?.activeRegion ?? 'all',
      selectedCurrencyCode: initial?.selectedCurrencyCode ?? 'USD',
      selectedCountryIso3: initial?.selectedCountryIso3 ?? 'USA',
      hoveredIso3: initial?.hoveredIso3 ?? null,
      searchQuery: initial?.searchQuery ?? '',
      isSearchDropdownOpen: initial?.isSearchDropdownOpen ?? false,
      isInspectorOpen: initial?.isInspectorOpen ?? false,
      showLabels: initial?.showLabels ?? true,
      convertAmount: initial?.convertAmount ?? 100,
      convertDirection: initial?.convertDirection ?? 'foreign_to_idr',
      isControlsCollapsed: initial?.isControlsCollapsed ?? false,
      isRegionDropdownOpen: initial?.isRegionDropdownOpen ?? false,
      highlightedIndex: 0,
      ...methods
    };
  }
  ```
- Di dalam `WorldRateMap.svelte`:
  ```ts
  const mapState = $state(createMapState());
  ```
  Svelte 5 mengonversi seluruh objek dan nested properties menjadi *deep reactive proxy*, sehingga `bind:value={mapState.searchQuery}` 100% reaktif tanpa warning.

## Consequences
- **Positif**:
  - Tampilan loading permanen (*perpetual loading*) 100% teratasi.
  - Seluruh warning konsol `binding_property_non_reactive` hilang total.
  - Komponen Svelte 5 `GlobalAppSplashScreen` mengontrol entrance & exit dengan mulus.
