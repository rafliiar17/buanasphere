# ADR 0017: Modular Map Architecture Decomposition, On-Demand Lazy Loading & GPU Lifecycle Management

## Status
**Accepted**

## Context & Problem Statement
File `WorldRateMap.svelte` telah berkembang menjadi *God-Component* berukuran lebih dari 1.500 baris kode yang mencakup seluruh rendering WebGL 3D, Plotly 2D, autocomplete search, filtering kawasan, drawer kalkulator, dan split-view. Kondisi ini menurunkan *maintainability* dan mempersulit pengujian unit secara terisolasi. Selain itu, bundle awal memuat library Plotly seberat 4.27 MB bahkan ketika pengguna hanya melihat tampilan Globe 3D default, serta belum adanya manajemen siklus hidup pelepasan memori VRAM GPU Three.js (`texture.dispose()` / `material.dispose()`).

## Architecture Decisions

### 1. Dekomposisi Komponen Modular (Single Responsibility Principle)
Memecah `WorldRateMap.svelte` menjadi struktur folder yang bersih dan terisolasi:
- `frontend/src/lib/features/map/mapState.svelte.ts`: State management reaktif menggunakan Svelte 5 runes (`$state()`).
- `frontend/src/lib/features/map/components/MapControlsToolbar.svelte`: Toolbar kontrol, autocomplete search, filter kawasan, dan switcher metrik.
- `frontend/src/lib/features/map/components/Globe3DView.svelte`: Viewport WebGL Three.js `globe.gl` dengan pin label dan camera controller.
- `frontend/src/lib/features/map/components/FlatMap2DView.svelte`: Viewport Plotly Choropleth 2D yang di-load secara on-demand.
- `frontend/src/lib/features/map/components/CountryInspectorDrawer.svelte`: Panel inspeksi detail negara, quick convert, dan perbandingan kurs.
- `frontend/src/lib/features/map/WorldRateMap.svelte`: Orchestrator ramping (<200 baris kode) yang menggabungkan sub-komponen.

### 2. On-Demand Lazy-Loading & Vite Chunking
- Library `plotly.js-dist-min` hanya di-fetch secara asinkron via dynamic `import('plotly.js-dist-min')` ketika pengguna mengklik tab *Peta Datar 2D*.
- Konfigurasi Vite `manualChunks` memisahkan vendor Three.js (`three-vendor`) dan Plotly (`plotly-vendor`).
- Memangkas lebih dari 4.2 MB beban muat awal untuk waktu interaktif (TTI) sub-100ms.

### 3. GPU Memory & Texture Lifecycle Management
- Menambahkan fungsi pembersihan eksplisit `dispose()` pada setiap `CanvasTexture` dan `ShaderMaterial` saat komponen unmount atau saat berganti tema visual untuk mencegah VRAM memory leak.

## Consequences
- **Positif**:
  - Kode bersih, modular, mudah diuji dan dipelihara.
  - Performa load awal meningkat drastis dengan lazy-loading chunk Plotly.
  - Zero memory leaks pada sesi WebGL yang panjang.
- **Negatif**:
  - Sedikit overhead transisi pertama kali pengguna beralih dari Globe 3D ke Peta Datar (dimitigasi dengan spinner loading lokal halus).
