# ADR 0027: Global Initial App Loading Splash Screen & Zero-JS Startup Fallback

## Status
**Accepted**

## Context & Problem Statement
Ketika pengguna pertama kali membuka aplikasi web Kurs World (misalnya pada koneksi jaringan lambat atau cold cache browser), terdapat jeda waktu antara unduhan dokumen HTML awal, parsing bundle JavaScript modern, hidrasi Svelte 5, dan pengambilan data kurs mata uang pertama kali. Tanpa splash screen awal yang terstruktur, pengguna dapat melihat layar kosong sesaat (*blank screen flicker*). Pengguna meminta adanya animasi loading global saat pertama kali membuka website.

## Decision Drivers
- **Seamless First Impression**: Menyambut pengguna dengan antarmuka bertema financial terminal modern, logo Kurs.World bercahaya, dan orbit scanner.
- **Zero-JS CSS Fallback**: Menampilkan splash placeholder murni berbasis CSS di `index.html` sebelum JavaScript ter-hydrate, mencegah FOUC (Flash of Unstyled Content) dan layar putih.
- **Transparent Telemetry**: Memberikan feedback informatif status koneksi edge network Cloudflare, sinkronisasi valuta asing, dan inisialisasi antarmuka.
- **Strict i18n & Theme Compatibility**: Mendukung dwibahasa penuh (ID/EN) dan mode Dark/Light.

## Architecture Decisions

### 1. `GlobalAppSplashScreen.svelte`
Membuat komponen splash screen global di root `App.svelte`:
- **Branding & Hologram**: Logo Kurs.World dengan ambient radial glow, rotating orbit ring, radar pulse, dan status badge Cloudflare Edge Sync (<50ms).
- **Telemetry Logger 3-Step**:
  - `[01/03]` Menghubungkan ke Cloudflare Workers Edge Network (<50ms)... / `Connecting to Cloudflare Workers Edge Network (<50ms)...`
  - `[02/03]` Memuat Nilai Tukar 195+ Valuta Asing Dunia... / `Loading 195+ World FX Exchange Rates...`
  - `[03/03]` Menyiapkan Antarmuka Interaktif & Peta 3D... / `Preparing Interactive UI & 3D Globe...`
- **Graceful Exit**: `opacity-0 scale-102 transition-all duration-700` dengan minimum presentation time 800ms untuk mencegah visual glitch.

### 2. Zero-JS CSS Splash Fallback di `index.html`
Menyematkan struktur inline CSS di dalam `<div id="app">` pada `index.html`. Elemen ini langsung digantikan begitu Svelte 5 me-mount komponen `App.svelte`.

### 3. State Management di `App.svelte`
- `isAppInitialLoading` state di `App.svelte` aktif saat aplikasi mount dan berubah menjadi `false` setelah komponen siap.

## Consequences
- **Positif**:
  - Nol layar kosong (*zero blank screen*) saat pertama kali membuka website.
  - Skor CLS (Cumulative Layout Shift) tetap < 0.05.
  - Pengalaman pengguna terasa sangat mulus, responsif, dan profesional.
- **Negatif**:
  - Membutuhkan penambahan beberapa kunci kamus terjemahan `splash.*` pada `id.ts` dan `en.ts`.
