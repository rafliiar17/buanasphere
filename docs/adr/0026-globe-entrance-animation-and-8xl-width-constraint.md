# ADR 0026: Holographic Globe Entrance Animation & Universal Max-Width 8xl Layout Constraint

## Status
**Accepted**

## Context & Problem Statement
1. **Globe 3D Loading Transition**: Saat pengguna membuka aplikasi Kurs World pada tampilan Peta Valas Dunia, proses inisialisasi WebGL Three.js, kompilasi shader atmosfer, parsing GeoJSON 195+ negara, dan pemuatan feed live exchange rates membutuhkan waktu beberapa detik. Tanpa transisi visual yang terarah, layar dapat mengalami flicker layout atau pop-in mendadak.
2. **Container Width Standardization**: Beberapa komponen antarmuka aplikasi masih menggunakan batas lebar maksimal `max-width: 1280px` atau `max-w-6xl` (`1152px`), yang membatasi kenyamanan visual pada monitor widescreen modern beresolusi tinggi (1080p, 1440p, 4K). Pengguna menghendaki seluruh container antarmuka menggunakan batas maksimal **`max-w-8xl`** (`1536px` / `96rem`).

## Decision Drivers
- **Zero CLS & High-Fidelity Entrance**: Menyediakan animasi loading masuk (*entrance loader*) futuristik bertema holographic globe dengan status telemetri inisialisasi yang informatif dan transisi *crossfade* mulus saat WebGL scene Three.js siap.
- **Widescreen Modern Aesthetics**: Menstandarisasikan lebar seluruh viewport, navbar, footer, matrix comparison, dan view overlays pada `max-w-8xl` (`1536px`).
- **Strict i18n & Dark/Light Theme Compatibility**: Seluruh teks status telemetri dan badge loader mendukung dwibahasa (ID/EN) dan reaktif terhadap pergantian tema.

## Architecture Decisions

### 1. Dedicated `GlobeEntranceLoader.svelte` Component
Membuat komponen overlay loading terisolasi dengan visual:
- Holographic spinning wireframe circle & orbit rings (`animate-spin-slow`, `border-dashed`).
- Radar scanner pulse & glowing core badge (`animate-ping`, `backdrop-blur-2xl`).
- Step-by-step telemetry progress logger:
  - `[01/03] Memuat Geometri 195+ Negara Dunia (GeoJSON)...` / `Loading 195+ World Country Boundaries...`
  - `[02/03] Menginisialisasi Engine 3D WebGL & Shader Atmosfer...` / `Initializing 3D WebGL Engine & Atmospheric Shaders...`
  - `[03/03] Sinkronisasi Live Exchange Rates BI & Multi-Provider...` / `Syncing Live Multi-Provider Exchange Rates...`
- Smooth fade-out via CSS transition saat `isGlobeReady = true` dengan auto unmount setelah animasi rampung.

### 2. Readiness Lifecycle Callback in `Globe3DView.svelte` & `WorldRateMap.svelte`
- `Globe3DView.svelte` menambahkan event `onReady?.()` yang dipicu tepat saat instance Three.js selesai membuat polygon mesh dan siap merender frame pertama.
- `WorldRateMap.svelte` menampung state `isGlobeSceneReady` untuk mengontrol visibilitas `GlobeEntranceLoader`.

### 3. Universal Max-Width 8xl Layout Constraint
Memperbarui seluruh wrapper utama ke `max-w-8xl` (`max-width: 1536px` / `96rem`):
- `frontend/src/App.svelte` (Container overlay view, toolbar bar, content wrapper).
- `frontend/src/lib/components/Navbar.svelte` (Header bar max-width).
- `frontend/src/lib/components/Footer.svelte` (Footer content max-width).
- `frontend/src/lib/features/matrix/CurrencyComparisonMatrix.svelte` (Matrix table max-width).
- `frontend/src/lib/components/skeletons/MapSkeleton.svelte` (Skeleton layout max-width).

## Consequences
- **Positif**:
  - Transisi masuk ke peta terasa sangat halus, premium, dan futuristik tanpa pop-in.
  - Tampilan pada monitor modern memanfaatkan ruang widescreen secara optimal dan simetris pada 1536px (`max-w-8xl`).
  - Menjaga skor CLS (Cumulative Layout Shift) < 0.05.
- **Negatif**:
  - Membutuhkan penambahan beberapa kunci kamus baru untuk teks telemetri pada `id.ts` dan `en.ts`.
