# ADR 0062: Full Replacement of FE1 Globe with Declarative GlobeScene Architecture

## Status
Accepted

## Context
Pada ADR 0061, kita telah memecah layer visual globe menjadi modul-modul terisolasi di `frontend/src/lib/features/map/globe/`. Namun, komponen `Globe3DView.svelte` masih mempertahankan struktur lama yang imperatif dan memadukan inisialisasi WebGL langsung di dalam satu file.

Pengguna meminta agar mesin globe di `fe1` sepenuhnya digantikan oleh arsitektur komponen **`GlobeScene.svelte`** yang terbukti bersih dan deklaratif pada `frontend-2`.

## Decision
1. **Membuat `frontend/src/lib/features/map/globe/GlobeScene.svelte`**:
   - Komponen deklaratif murni Svelte 5 yang membungkus `globe.gl`.
   - Menerima props reaktif: `polygons`, `arcs`, `paths`, `rings`, `labels`, `theme`, `activeMetric`, `selectedIso3`, `hoveredIso3`.
   - Menggunakan `$effect()` untuk menyinkronkan layer visual setiap kali state berubah.
   - Mengelola ResizeObserver secara otomatis dan unmount cleanup tanpa memory leak.
   - Mengekspor kontroler kamera standar (`flyToCountry`, `flyTo`, `handleZoomIn`, `handleZoomOut`, `handleResetView`, `getGlobe`).
2. **Refactor Penuh `Globe3DView.svelte` Menjadi Deklaratif Orchestrator**:
   - `Globe3DView.svelte` tidak lagi menginisialisasi Three.js WebGL canvas secara manual.
   - Bertindak sebagai penyedia data reaktif (*reactive data provider*) yang menghitung layer visual dari `mapData`, `mapState`, `geoStore`, dan `currentTheme`, lalu menyuplainya ke `<GlobeScene />`.
   - Tetap membungkus overlay interaktif (Meridian inspector card, transition HUD, floating zoom/reset navigation controls) dan mendukung integrasi Turbo Shader-LUT.
3. **Preservasi 100% Dynamic Filtering & Microapp FE1**:
   - `geoStore.isCountryMatched`, `timeFilter`, `flightCorridorFilter`, `passportVisaFilter`, `activeRegion`, dan seluruh hook polimorfik `activeApp` tetap berfungsi penuh secara deklaratif.

## Consequences
### Positif
- Kode globe di `fe1` kini 100% konsisten dengan arsitektur kanonikal `GlobeScene` dari `frontend-2`.
- Kode sangat bersih, deklaratif, dan modular.
- Pemisahan tanggung jawab yang jelas antara canvas WebGL (`GlobeScene`) dan overlay UI / state store (`Globe3DView`).
- `WorldRateMap.svelte` dan seluruh parent component tidak mengalami breaking change.

### Negatif / Trade-offs
- Memerlukan integrasi presisi antara lifecycle Turbo Shader-LUT Three.js dan `GlobeScene`.
